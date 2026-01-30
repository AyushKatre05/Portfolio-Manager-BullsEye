package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
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
public class AlphaVantageService {

    private static final String API_KEY = "HBKBEQDGEQLI2B4O";

    private final WebClient webClient;

    public Mono<StockHistoryResponse> getDailyStockHistory(String ticker) {

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("www.alphavantage.co")
                        .path("/query")
                        .queryParam("function", "TIME_SERIES_DAILY")
                        .queryParam("symbol", ticker)
                        .queryParam("apikey", API_KEY)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {

                    Map<String, Map<String, String>> timeSeries =
                            (Map<String, Map<String, String>>) response.get("Time Series (Daily)");

                    if (timeSeries == null) {
                        throw new RuntimeException("AlphaVantage API limit hit or invalid response");
                    }

                    List<PricePoint> prices = timeSeries.entrySet()
                            .stream()
                            .map(entry -> new PricePoint(
                                    entry.getKey(),
                                    Double.parseDouble(entry.getValue().get("4. close"))
                            ))
                            .sorted(Comparator.comparing(PricePoint::getDate))
                            .toList();

                    return new StockHistoryResponse(ticker, prices);
                });
    }
}
