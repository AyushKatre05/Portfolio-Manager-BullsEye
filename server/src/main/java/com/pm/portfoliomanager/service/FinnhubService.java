package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
import com.pm.portfoliomanager.model.PricePoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class FinnhubService {

    private final WebClient webClient;

    @Value("${finnhub.api.key}")
    private String apiKey;

    public FinnhubService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("https://finnhub.io").build();
    }

    public Mono<StockHistoryResponse> getDailyHistory(String ticker) {
        long to = Instant.now().getEpochSecond();
        long from = Instant.now().minus(180, ChronoUnit.DAYS).getEpochSecond();

        return webClient.get()
                .uri(uri -> uri
                        .path("/api/v1/stock/candle")
                        .queryParam("symbol", ticker)
                        .queryParam("resolution", "D")
                        .queryParam("from", from)
                        .queryParam("to", to)
                        .queryParam("token", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(FinnhubResponse.class)
                .flatMap(resp -> {
                    if (!"ok".equals(resp.s) || resp.c == null) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "No Finnhub data for " + ticker));
                    }

                    List<PricePoint> prices = resp.toPricePoints(ticker);
                    return Mono.just(new StockHistoryResponse(ticker, prices));
                });
    }

    // ---------- INNER DTO ----------
    static class FinnhubResponse {
        public String s;
        public List<Long> t;
        public List<Double> c;

        List<PricePoint> toPricePoints(String ticker) {
            return java.util.stream.IntStream.range(0, c.size())
                    .mapToObj(i -> {
                        PricePoint p = new PricePoint();
                        p.setTicker(ticker);
                        p.setDate(Instant.ofEpochSecond(t.get(i)).toString());
                        p.setClose(c.get(i));
                        return p;
                    })
                    .toList();
        }
    }
}
