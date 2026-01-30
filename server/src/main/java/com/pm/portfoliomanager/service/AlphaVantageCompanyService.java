package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.CompanyOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AlphaVantageCompanyService {

    private static final String API_KEY = "HBKBEQDGEQLI2B4O";

    private final WebClient webClient;

    public Mono<CompanyOverview> getCompanyOverview(String ticker) {

        String url = "https://www.alphavantage.co/query"
                + "?function=OVERVIEW"
                + "&symbol=" + ticker
                + "&apikey=" + API_KEY;

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    if (response == null || response.isEmpty()) {
                        throw new RuntimeException("No company data found");
                    }

                    return new CompanyOverview(
                            (String) response.get("Symbol"),
                            (String) response.get("Name"),
                            (String) response.get("Sector"),
                            (String) response.get("Industry"),
                            (String) response.get("MarketCapitalization"),
                            (String) response.get("PERatio"),
                            (String) response.get("DividendYield"),
                            (String) response.get("Description")
                    );
                });
    }
}
