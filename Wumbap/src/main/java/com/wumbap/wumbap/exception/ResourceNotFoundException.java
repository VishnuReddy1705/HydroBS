package com.wumbap.wumbap.exception;

/**
 * Thrown when a requested entity does not exist. Mapped to HTTP 404 by
 * {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
