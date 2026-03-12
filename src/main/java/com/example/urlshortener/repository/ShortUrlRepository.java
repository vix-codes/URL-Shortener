package com.example.urlshortener.repository;

import com.example.urlshortener.entity.ShortUrl;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShortUrlRepository extends JpaRepository<ShortUrl, Long> {
    Optional<ShortUrl> findByShortCode(String shortCode);
    Optional<ShortUrl> findByLongUrlAndExpiresAtIsNull(String longUrl);
    boolean existsByShortCode(String shortCode);

    @Modifying
    @Query("UPDATE ShortUrl s SET s.clickCount = s.clickCount + 1 WHERE s.id = :id")
    void incrementClickCount(@Param("id") Long id);
}
