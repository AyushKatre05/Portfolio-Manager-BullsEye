package com.signalist.stock.services;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class TemplateService {

    public String loadTemplate(String fileName) throws Exception {
        ClassPathResource resource = new ClassPathResource("email-templates/" + fileName);
        if (!resource.exists()) {
            throw new IllegalArgumentException("Template not found: " + fileName);
        }
        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public String render(String template, Map<String, String> values) {
        String out = template;
        for (var e : values.entrySet()) {
            out = out.replace("{{" + e.getKey() + "}}", e.getValue() == null ? "" : e.getValue());
        }
        return out;
    }
}