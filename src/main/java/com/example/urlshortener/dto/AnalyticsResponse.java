package com.example.urlshortener.dto;

import java.time.Instant;

public record AnalyticsResponse(String shortCode, long clickCount, Instant createdAt, Instant expiresAt, String longUrl) {
}
