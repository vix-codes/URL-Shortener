package com.example.urlshortener.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private static final int LIMIT_PER_MINUTE = 120;
    private static final long WINDOW_SECONDS = 60;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String key = request.getRemoteAddr();
        long now = Instant.now().getEpochSecond();

        WindowCounter counter = counters.compute(key, (k, v) -> {
            if (v == null || now - v.windowStart >= WINDOW_SECONDS) {
                return new WindowCounter(now, 1);
            }
            v.count++;
            return v;
        });

        if (counter.count > LIMIT_PER_MINUTE) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Rate limit exceeded\"}");
            return false;
        }

        return true;
    }

    private static class WindowCounter {
        private final long windowStart;
        private int count;

        private WindowCounter(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
