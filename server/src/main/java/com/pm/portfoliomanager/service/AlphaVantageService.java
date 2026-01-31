//package com.pm.portfoliomanager.service;
//
//import com.pm.portfoliomanager.dto.StockHistoryResponse;
//import com.pm.portfoliomanager.model.PricePoint;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.HttpStatus;
//import org.springframework.stereotype.Service;
//import org.springframework.web.reactive.function.client.WebClient;
//import org.springframework.web.server.ResponseStatusException;
//import reactor.core.publisher.Mono;
//
//import java.util.Comparator;
//import java.util.List;
//import java.util.Map;
//
//@Service
//@RequiredArgsConstructor
//public class AlphaVantageService {
//
//    private static final String API_KEY = "8Y0YN1L40VFQ4WQH";
//
//    private final WebClient webClient;
//
//    public Mono<StockHistoryResponse> getDailyStockHistory(String ticker) {
//
//        return webClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .scheme("https")
//                        .host("www.alphavantage.co")
//                        .path("/query")
//                        .queryParam("function", "TIME_SERIES_DAILY")
//                        .queryParam("symbol", ticker)
//                        .queryParam("apikey", API_KEY)
//                        .build())
//                .retrieve()
//                .bodyToMono(Map.class)
//                .flatMap(response -> {
//                    // Extract time series data
//                    Map<String, Map<String, String>> timeSeries =
//                            (Map<String, Map<String, String>>) response.get("Time Series (Daily)");
//
//                    if (timeSeries == null || timeSeries.isEmpty()) {
//                        // Handle empty response gracefully
//                        return Mono.error(new ResponseStatusException(
//                                HttpStatus.NOT_FOUND,
//                                "No stock price data found for ticker '" + ticker +
//                                        "'. This may happen if the ticker is invalid or API limit is reached."
//                        ));
//                    }
//
//                    // Map to PricePoint list
//                    List<PricePoint> prices = timeSeries.entrySet().stream()
//                            .map(entry -> new PricePoint(
//                                    entry.getKey(),
//                                    Double.parseDouble(entry.getValue().get("4. close"))
//                            ))
//                            .sorted(Comparator.comparing(PricePoint::getDate))
//                            .toList();
//
//                    return Mono.just(new StockHistoryResponse(ticker, prices));
//                })
//                .onErrorMap(e -> {
//                    // Wrap unexpected errors
//                    if (e instanceof ResponseStatusException) return e;
//                    return new ResponseStatusException(
//                            HttpStatus.INTERNAL_SERVER_ERROR,
//                            "Failed to fetch stock history for '" + ticker + "': " + e.getMessage(),
//                            e
//                    );
//                });
//    }
//}
