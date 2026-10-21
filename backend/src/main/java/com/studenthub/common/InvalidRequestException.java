package com.studenthub.common;

/**
 * A request that passed bean validation but breaks a rule spanning several fields. Reported against {@code field}.
 */
public class InvalidRequestException extends RuntimeException {

    private final String field;

    public InvalidRequestException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
