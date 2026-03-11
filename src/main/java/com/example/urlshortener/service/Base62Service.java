package com.example.urlshortener.service;

import org.springframework.stereotype.Component;

@Component
public class Base62Service {

    private static final char[] CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toCharArray();

    public String encode(long value) {
        if (value == 0) {
            return String.valueOf(CHARS[0]);
        }

        StringBuilder sb = new StringBuilder();
        long number = value;
        while (number > 0) {
            sb.append(CHARS[(int) (number % 62)]);
            number /= 62;
        }
        return sb.reverse().toString();
    }
}
