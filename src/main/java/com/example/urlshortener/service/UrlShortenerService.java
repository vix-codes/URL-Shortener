package com.example.urlshortener.service;

import com.example.urlshortener.dto.AnalyticsResponse;
import com.example.urlshortener.dto.ShortenRequest;
import com.example.urlshortener.dto.ShortenResponse;
import com.example.urlshortener.entity.ShortUrl;
import com.example.urlshortener.exception.BadRequestException;
import com.example.urlshortener.exception.NotFoundException;
import com.example.urlshortener.repository.ShortUrlRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;

@Service
public class UrlShortenerService {

    private final ShortUrlRepository repository;
    private final Base62Service base62Service;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public UrlShortenerService(ShortUrlRepository repository, Base62Service base62Service) {
        this.repository = repository;
        this.base62Service = base62Service;
    }

    @Transactional
    public ShortenResponse createShortUrl(ShortenRequest request) {
        validateUrl(request.url());
        validateExpiry(request.expiresAt());

        if (request.alias() == null || request.alias().isBlank()) {
            return repository.findByLongUrlAndExpiresAtIsNull(request.url())
                    .map(this::toResponse)
                    .orElseGet(() -> createNew(request.url(), null, request.expiresAt()));
        }

        if (repository.existsByShortCode(request.alias())) {
            throw new BadRequestException("Alias is already in use.");
        }

        return createNew(request.url(), request.alias(), request.expiresAt());
    }

    @Transactional
    public String resolveLongUrl(String shortCode) {
        ShortUrl shortUrl = getByShortCode(shortCode);
        if (shortUrl.isExpired()) {
            throw new NotFoundException("Short URL has expired.");
        }
        shortUrl.incrementClickCount();
        repository.save(shortUrl);
        return shortUrl.getLongUrl();
    }

    @Cacheable(cacheNames = "urlByCode", key = "#shortCode")
    public ShortUrl getByShortCode(String shortCode) {
        return repository.findByShortCode(shortCode)
                .orElseThrow(() -> new NotFoundException("Short URL not found."));
    }

    @Transactional
    @CachePut(cacheNames = "urlByCode", key = "#result.shortCode")
    public ShortUrl persist(ShortUrl entity) {
        return repository.save(entity);
    }

    @CacheEvict(cacheNames = "urlByCode", key = "#shortCode")
    public void evict(String shortCode) {
    }

    public AnalyticsResponse getAnalytics(String shortCode) {
        ShortUrl entry = getByShortCode(shortCode);
        return new AnalyticsResponse(entry.getShortCode(), entry.getClickCount(), entry.getCreatedAt(), entry.getExpiresAt(), entry.getLongUrl());
    }

    private ShortenResponse createNew(String longUrl, String preferredCode, Instant expiresAt) {
        ShortUrl entity = new ShortUrl();
        entity.setLongUrl(longUrl);
        entity.setExpiresAt(expiresAt);

        if (preferredCode == null || preferredCode.isBlank()) {
            ShortUrl saved = repository.save(entity);
            saved.setShortCode(base62Service.encode(saved.getId()));
            saved = persist(saved);
            return toResponse(saved);
        }

        entity.setShortCode(preferredCode);
        ShortUrl saved = persist(entity);
        return toResponse(saved);
    }

    private ShortenResponse toResponse(ShortUrl shortUrl) {
        return new ShortenResponse(baseUrl + "/" + shortUrl.getShortCode(), shortUrl.getShortCode(), shortUrl.getLongUrl());
    }

    private void validateUrl(String url) {
        try {
            URI uri = new URI(url);
            if (uri.getScheme() == null || (!uri.getScheme().equals("http") && !uri.getScheme().equals("https"))) {
                throw new BadRequestException("Only http/https URLs are allowed.");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException("URL host is required.");
            }
        } catch (URISyntaxException e) {
            throw new BadRequestException("URL format is invalid.");
        }
    }

    private void validateExpiry(Instant expiresAt) {
        if (expiresAt != null && expiresAt.isBefore(Instant.now())) {
            throw new BadRequestException("Expiry must be in the future.");
        }
    }
}
