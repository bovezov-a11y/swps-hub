package com.studenthub.material;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * File types students may share. The content type is derived from the extension instead of trusted from the client,
 * and formats a browser could execute (HTML, SVG, scripts) are deliberately not on the list.
 */
public final class FileTypes {

    private static final Map<String, String> CONTENT_TYPES = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("webp", "image/webp"),
            Map.entry("txt", "text/plain"),
            Map.entry("md", "text/markdown"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("zip", "application/zip"));

    private FileTypes() {
    }

    public static Optional<String> contentTypeFor(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return Optional.empty();
        }
        return Optional.ofNullable(CONTENT_TYPES.get(fileName.substring(dot + 1).toLowerCase(Locale.ROOT)));
    }
}
