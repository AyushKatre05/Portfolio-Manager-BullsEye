package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
import com.pm.portfoliomanager.model.PricePoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

@Service
public class PolygonService {

    private final WebClient webClient;

    @Value("${polygon.api.key}")
    private String apiKey;

    public PolygonService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("https://api.polygon.io").build();
    }

    public Mono<StockHistoryResponse> getDailyHistory(String ticker) {

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusMonths(6);

        return webClient.get()
                .uri(uri -> uri
                        .path("/v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}")
                        .queryParam("adjusted", true)
                        .queryParam("sort", "asc")
                        .queryParam("apiKey", apiKey)
                        .build(ticker, from, to))
                .retrieve()
                .bodyToMono(PolygonResponse.class)
                .flatMap(resp -> {
                    if (resp.results == null || resp.results.isEmpty()) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "No Polygon data for " + ticker));
                    }

                    List<PricePoint> prices = resp.toPricePoints(ticker);
                    return Mono.just(new StockHistoryResponse(ticker, prices));
                });
    }

    // ---------- INNER DTO ----------
    static class PolygonResponse {
        public List<Result> results;

        List<PricePoint> toPricePoints(String ticker) {
            return results.stream().map(r -> {
                PricePoint p = new PricePoint();
                p.setTicker(ticker);
                p.setDate(String.valueOf(r.t));
                p.setClose(r.c);
                return p;
            }).toList();
        }
    }

    static class Result {
        public long t;
        public double c;
    }
}
