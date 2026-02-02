package com.signalist.stock.config;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GenAiConfig {

    @Bean
    public Client genAiClient(
            @Value("${gemini.apiKey}") String apiKey
    ) {
        return Client.builder()
                .apiKey(apiKey)
                .build();
    }
}
