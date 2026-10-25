package com.studenthub.moderation;

import java.util.Optional;
import java.util.UUID;

/**
 * Lets moderation work with any kind of content without knowing its feature. Each feature that accepts user content
 * provides one implementation for its {@link ContentType}.
 */
public interface ModeratedContent {

    ContentType type();

    Optional<Summary> describe(UUID id);

    void setHidden(UUID id, boolean hidden);

    void delete(UUID id);

    /**
     * @param link path in the web app where the content can be seen
     */
    record Summary(String title, String excerpt, String courseCode, String link, boolean hidden) {
    }
}
