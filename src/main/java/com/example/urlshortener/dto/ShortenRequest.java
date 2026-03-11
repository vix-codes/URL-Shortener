package com.example.urlshortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record ShortenRequest(
        @NotBlank String url,
        @Size(min = 3, max = 32) String alias,
        Instant expiresAt
) {
}
