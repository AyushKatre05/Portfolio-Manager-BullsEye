package com.signalist.stock.services;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class PromptService {

    public String loadPrompt(String fileName) throws Exception{
        // try provided name first (with/without extension), then try adding .txt
        String basePath = "prompt/";
        String[] candidates = new String[]{fileName};
        for (String candidate : candidates) {
            ClassPathResource resource = new ClassPathResource(basePath + candidate);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        }
        throw new IllegalArgumentException("Prompt file not found: " + fileName);
    }

    public String render(String template, Map<String,String> values){
        String out  = template;
        for(var e: values.entrySet()){
            out = out.replace("{{" + e.getKey() + "}}", e.getValue() == null ? "" : e.getValue());
        }

        return out;
    }
}