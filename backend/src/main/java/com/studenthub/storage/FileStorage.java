package com.studenthub.storage;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Stores uploaded files under opaque keys. Keeping this behind an interface lets the local-disk implementation be
 * swapped for S3-compatible object storage in production without touching the features that use it.
 */
public interface FileStorage {

    void store(String key, InputStream content) throws IOException;

    Resource load(String key);

    void delete(String key);
}
