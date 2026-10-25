package com.studenthub.material;

import com.studenthub.auth.CurrentUser;
import com.studenthub.material.MaterialDtos.MaterialForm;
import com.studenthub.material.MaterialDtos.MaterialResponse;
import com.studenthub.material.MaterialService.MaterialFile;
import com.studenthub.material.MaterialService.VoteResponse;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
class MaterialController {

    private final MaterialService materialService;

    MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    /** Materials of a course, best rated first unless {@code sort=new}. */
    @GetMapping("/api/courses/{courseId}/materials")
    List<MaterialResponse> list(CurrentUser user, @PathVariable UUID courseId,
                                @RequestParam(required = false) MaterialType type,
                                @RequestParam(required = false) String year,
                                @RequestParam(defaultValue = "top") String sort) {
        return materialService.list(user, courseId, type, year, "new".equals(sort));
    }

    /** Uploads a file with its details sent as multipart form fields. */
    @PostMapping(value = "/api/courses/{courseId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    MaterialResponse upload(CurrentUser user, @PathVariable UUID courseId, @Valid @ModelAttribute MaterialForm form,
                            @RequestPart(name = "file", required = false) MultipartFile file) {
        return materialService.upload(user, courseId, form, file);
    }

    /** Latest materials shared in the courses the user joined. */
    @GetMapping("/api/materials/feed")
    List<MaterialResponse> feed(CurrentUser user) {
        return materialService.feed(user);
    }

    @GetMapping("/api/materials/{materialId}/file")
    ResponseEntity<Resource> download(CurrentUser user, @PathVariable UUID materialId) {
        MaterialFile file = materialService.open(user, materialId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .contentLength(file.size())
                // Always a download: uploaded files are never rendered as part of this site.
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(file.resource());
    }

    @PutMapping("/api/materials/{materialId}/vote")
    VoteResponse upvote(CurrentUser user, @PathVariable UUID materialId) {
        return materialService.vote(user, materialId, true);
    }

    @DeleteMapping("/api/materials/{materialId}/vote")
    VoteResponse removeVote(CurrentUser user, @PathVariable UUID materialId) {
        return materialService.vote(user, materialId, false);
    }

    @DeleteMapping("/api/materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(CurrentUser user, @PathVariable UUID materialId) {
        materialService.delete(user, materialId);
    }
}
