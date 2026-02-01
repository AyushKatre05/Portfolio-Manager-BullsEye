package com.signalist.stock.config;

import com.google.genai.Client;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GenAiConfig {

    @Bean
    public Client genAiClient() {
        // Hardcode API key for testing / development
        String apiKey = "AIzaSyDfYz8ECo3FjW526OyQ5GW2ml7p1aoClWM";
        // Set it in the environment for the library to pick up
        try {
            // Hacky but works: use reflection to inject into env map
            java.util.Map<String, String> env = System.getenv();
            java.lang.reflect.Field field = env.getClass().getDeclaredField("m");
            field.setAccessible(true);
            ((java.util.Map<String, String>) field.get(env)).put("GOOGLE_API_KEY", apiKey);
        } catch (Exception ignored) {}

        return new Client(); // Library will now see the key
    }
}
