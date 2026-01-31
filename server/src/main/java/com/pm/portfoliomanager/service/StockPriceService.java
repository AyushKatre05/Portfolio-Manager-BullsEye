package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.PricePoint;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockPriceService {

    private static final String API_KEY = "YOUR_ALPHA_VANTAGE_KEY";
    private final WebClient webClient;

    public Mono<List<PricePoint>> getDailyPrices(String ticker) {

        String url = "https://www.alphavantage.co/query"
                + "?function=TIME_SERIES_DAILY"
                + "&symbol=" + ticker
                + "&apikey=" + API_KEY;

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    Map<String, Map<String, String>> series =
                            (Map<String, Map<String, String>>) response.get("Time Series (Daily)");

                    return series.entrySet()
                            .stream()
                            .map(e -> new PricePoint(
                                    e.getKey(),
                                    Double.parseDouble(e.getValue().get("4. close"))
                            ))
                            .sorted(Comparator.comparing(PricePoint::getDate))
                            .toList();
                });
    }
}
