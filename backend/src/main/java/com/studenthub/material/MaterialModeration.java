package com.studenthub.material;

import com.studenthub.moderation.ContentType;
import com.studenthub.moderation.ModeratedContent;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
class MaterialModeration implements ModeratedContent {

    private final MaterialRepository materials;
    private final MaterialService materialService;

    MaterialModeration(MaterialRepository materials, MaterialService materialService) {
        this.materials = materials;
        this.materialService = materialService;
    }

    @Override
    public ContentType type() {
        return ContentType.MATERIAL;
    }

    @Override
    public Optional<Summary> describe(UUID id) {
        return materials.findWithCourseById(id).map(material -> new Summary(material.getTitle(),
                material.getDescription() == null ? material.getFileName() : material.getDescription(),
                material.getCourse().getCode(), "/courses/" + material.getCourse().getId(), material.isHidden()));
    }

    @Override
    public void setHidden(UUID id, boolean hidden) {
        materials.findById(id).ifPresent(material -> material.setHidden(hidden));
    }

    @Override
    public void delete(UUID id) {
        materials.findById(id).ifPresent(materialService::remove);
    }
}
