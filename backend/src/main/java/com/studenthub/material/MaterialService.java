package com.studenthub.material;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.course.CourseService;
import com.studenthub.material.MaterialDtos.CourseRef;
import com.studenthub.material.MaterialDtos.MaterialForm;
import com.studenthub.material.MaterialDtos.MaterialResponse;
import com.studenthub.material.MaterialDtos.Uploader;
import com.studenthub.storage.FileStorage;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
class MaterialService {

    private static final int MAX_MATERIALS_PER_COURSE = 200;
    private static final int FEED_SIZE = 8;

    private final MaterialRepository materials;
    private final MaterialVoteRepository votes;
    private final CourseService courseService;
    private final UserRepository users;
    private final FileStorage storage;
    private final boolean showUploaderNames;

    MaterialService(MaterialRepository materials, MaterialVoteRepository votes, CourseService courseService,
                    UserRepository users, FileStorage storage,
                    @Value("${app.privacy.show-uploader-names}") boolean showUploaderNames) {
        this.materials = materials;
        this.votes = votes;
        this.courseService = courseService;
        this.users = users;
        this.storage = storage;
        this.showUploaderNames = showUploaderNames;
    }

    @Transactional(readOnly = true)
    List<MaterialResponse> list(CurrentUser user, UUID courseId, MaterialType type, String academicYear, boolean newestFirst) {
        courseService.require(courseId);
        Sort sort = newestFirst
                ? Sort.by(Sort.Order.desc("createdAt"))
                : Sort.by(Sort.Order.desc("voteCount"), Sort.Order.desc("createdAt"));
        List<Material> found = materials.findForCourse(courseId, type,
                academicYear == null || academicYear.isBlank() ? null : academicYear, user.id(), user.isModerator(),
                PageRequest.of(0, MAX_MATERIALS_PER_COURSE, sort));
        return toResponses(user, found);
    }

    @Transactional(readOnly = true)
    List<MaterialResponse> feed(CurrentUser user) {
        return toResponses(user, materials.findLatestForUser(user.id(), PageRequest.of(0, FEED_SIZE)));
    }

    @Transactional
    MaterialResponse upload(CurrentUser user, UUID courseId, MaterialForm form, MultipartFile file) {
        Course course = courseService.require(courseId);
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("file", "choose a file to upload");
        }
        String fileName = cleanFileName(file.getOriginalFilename());
        String contentType = FileTypes.contentTypeFor(fileName).orElseThrow(() -> new InvalidRequestException("file",
                "this file type is not supported; use PDF, an image, an Office document, text or ZIP"));

        Material material = new Material(UUID.randomUUID(), course, form.type(), form.title().strip(),
                form.description() == null || form.description().isBlank() ? null : form.description().strip(),
                form.academicYear(), fileName, contentType, file.getSize(), user.id());
        try {
            storage.store(material.getFileKey(), file.getInputStream());
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store uploaded file", e);
        }
        // If the row is never committed, the stored file must not be left behind.
        afterTransaction(committed -> {
            if (!committed) storage.delete(material.getFileKey());
        });
        materials.save(material);
        return toResponses(user, List.of(material)).getFirst();
    }

    @Transactional(readOnly = true)
    MaterialFile open(CurrentUser user, UUID materialId) {
        Material material = require(materialId);
        if (material.isHidden() && !material.getUploadedBy().equals(user.id()) && !user.isModerator()) {
            throw new NotFoundException("Material not found");
        }
        Resource resource = storage.load(material.getFileKey());
        if (!resource.exists()) {
            throw new NotFoundException("The file for this material is missing");
        }
        return new MaterialFile(resource, material.getFileName(), material.getContentType(), material.getFileSize());
    }

    @Transactional
    VoteResponse vote(CurrentUser user, UUID materialId, boolean upvote) {
        require(materialId);
        boolean changed = upvote
                ? votes.insertIfAbsent(materialId, user.id()) == 1
                : votes.deleteVote(materialId, user.id()) == 1;
        if (changed) {
            materials.adjustVoteCount(materialId, upvote ? 1 : -1);
        }
        return new VoteResponse(require(materialId).getVoteCount(), upvote);
    }

    @Transactional
    void delete(CurrentUser user, UUID materialId) {
        Material material = require(materialId);
        if (!canDelete(user, material)) {
            throw new ForbiddenException("Only the uploader or a moderator can delete this material");
        }
        remove(material);
    }

    /** Deletes the row now and the stored file once the deletion is committed. */
    void remove(Material material) {
        materials.delete(material);
        afterTransaction(committed -> {
            if (committed) storage.delete(material.getFileKey());
        });
    }

    private Material require(UUID materialId) {
        return materials.findById(materialId).orElseThrow(() -> new NotFoundException("Material not found"));
    }

    private List<MaterialResponse> toResponses(CurrentUser user, List<Material> found) {
        if (found.isEmpty()) {
            return List.of();
        }
        // Sharing is anonymous unless configured otherwise: students only ever see their own name.
        List<UUID> visibleUploaders = found.stream().map(Material::getUploadedBy)
                .filter(uploader -> showUploaderNames || uploader.equals(user.id()))
                .distinct().toList();
        Map<UUID, User> uploaders = users.findAllById(visibleUploaders).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Set<UUID> voted = votes.findVotedMaterialIds(user.id(), found.stream().map(Material::getId).toList());
        return found.stream().map(material -> {
            Course course = material.getCourse();
            User uploader = uploaders.get(material.getUploadedBy());
            boolean mine = material.getUploadedBy().equals(user.id());
            return new MaterialResponse(material.getId(), new CourseRef(course.getId(), course.getCode(), course.getName()),
                    material.getType(), material.getTitle(), material.getDescription(), material.getAcademicYear(),
                    material.getFileName(), material.getContentType(), material.getFileSize(), material.getVoteCount(),
                    voted.contains(material.getId()),
                    uploader == null ? null : new Uploader(uploader.getDisplayName()),
                    mine, material.isHidden(), material.getCreatedAt(), canDelete(user, material));
        }).toList();
    }

    private static boolean canDelete(CurrentUser user, Material material) {
        return material.getUploadedBy().equals(user.id()) || user.isModerator();
    }

    /** Keeps only the last path segment (some browsers send full paths) and drops characters unsafe in headers. */
    static String cleanFileName(String original) {
        if (original == null) {
            return "file";
        }
        String name = original.substring(Math.max(original.lastIndexOf('/'), original.lastIndexOf('\\')) + 1)
                .replaceAll("[\\p{Cntrl}\"]", "")
                .strip();
        if (name.isEmpty()) {
            return "file";
        }
        return name.length() <= 255 ? name : name.substring(name.length() - 255);
    }

    private static void afterTransaction(Consumer<Boolean> action) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                action.accept(status == STATUS_COMMITTED);
            }
        });
    }

    record MaterialFile(Resource resource, String fileName, String contentType, long size) {
    }

    record VoteResponse(int voteCount, boolean voted) {
    }
}
