package com.signalist.stock.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FinnhubService {

    @Value("${finnhub.api.key}")
    private String finKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public double getCurrentPrice(String symbol) {
        String url = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + finKey;
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response != null && response.containsKey("c")) {
            return ((Number) response.get("c")).doubleValue();
        }
        return 0;
    }
}
