package com.studenthub.common;

import org.springframework.http.HttpStatus;

/**
 * An error the client reacts to by its machine-readable {@code code}, for example to offer resending a verification
 * email. The code is returned as a property of the problem detail.
 */
public class CodedException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public CodedException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
