package com.example.urlshortener.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(NotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequest(BadRequestException e) {
        log.warn("Bad request: {}", e.getMessage());
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Invalid request body.");
        log.warn("Validation error: {}", message);
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneric(Exception e) {
        log.error("Unhandled exception: ", e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again later.");
    }

    private Map<String, Object> error(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
