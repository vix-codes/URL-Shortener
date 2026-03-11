package com.example.urlshortener.dto;

public record ShortenResponse(String shortUrl, String shortCode, String longUrl) {
}
