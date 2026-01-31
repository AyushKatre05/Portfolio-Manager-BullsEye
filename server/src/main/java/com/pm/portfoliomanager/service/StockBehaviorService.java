package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.dto.StockBehaviorResponse;
import com.pm.portfoliomanager.model.PricePoint;
import com.pm.portfoliomanager.model.StockBehavior;
import com.pm.portfoliomanager.repository.StockBehaviorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class StockBehaviorService {

    private final StockPriceService stockPriceService;
    private final StockBehaviorRepository behaviorRepository;

    // Prevent multiple calculations for the same ticker at the same time
    private final ConcurrentHashMap<String, Mono<StockBehaviorResponse>> cache = new ConcurrentHashMap<>();

    public Mono<StockBehaviorResponse> analyze(String ticker) {
        ticker = ticker.toUpperCase();

        return cache.computeIfAbsent(ticker, t ->
                calculateAndSaveBehavior(t)
                        .doFinally(signal -> cache.remove(t)) // clear cache when done
                        .cache() // reuse result for concurrent requests
        );
    }

    @Transactional
    protected Mono<StockBehaviorResponse> calculateAndSaveBehavior(String ticker) {
        // Check if behavior already exists in DB
        StockBehavior existing = behaviorRepository.findByTicker(ticker);
        if (existing != null) {
            return Mono.just(toResponse(existing));
        }

        // Get price points
        return stockPriceService.getDailyPrices(ticker)
                .flatMap(prices -> {
                    if (prices == null || prices.isEmpty()) {
                        return Mono.just(new StockBehaviorResponse(
                                ticker,
                                "UNKNOWN",
                                "UNKNOWN",
                                "INSUFFICIENT_DATA",
                                0
                        ));
                    }

                    // Calculate behavior
                    double volatility = calculateVolatility(prices);
                    double trend = prices.get(prices.size() - 1).getClose() - prices.get(0).getClose();

                    String volatilityType = volatility < 1.5 ? "LOW" :
                            volatility < 3 ? "MEDIUM" : "HIGH";
                    String trendNature = trend > 0 ? "UPTREND" : "DOWNTREND";
                    String suitability = volatilityType.equals("LOW") ? "LONG_TERM_INVESTOR" : "SHORT_TERM_TRADER";
                    int confidenceScore = Math.min(95, (int) (100 - volatility * 10));

                    StockBehavior entity = new StockBehavior(ticker, volatilityType, trendNature, suitability, confidenceScore);

                    // Save once transactionally
                    StockBehavior saved = behaviorRepository.save(entity);

                    return Mono.just(toResponse(saved));
                });
    }

    private StockBehaviorResponse toResponse(StockBehavior behavior) {
        return new StockBehaviorResponse(
                behavior.getTicker(),
                behavior.getVolatilityType(),
                behavior.getTrendNature(),
                behavior.getSuitability(),
                behavior.getConfidenceScore()
        );
    }

    private double calculateVolatility(List<PricePoint> prices) {
        double avg = prices.stream().mapToDouble(PricePoint::getClose).average().orElse(0);
        return Math.sqrt(prices.stream().mapToDouble(p -> Math.pow(p.getClose() - avg, 2)).average().orElse(0));
    }
}
