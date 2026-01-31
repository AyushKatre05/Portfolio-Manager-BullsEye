package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.PricePoint;
import com.pm.portfoliomanager.repository.PricePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class StockPriceService {

    private final PricePointRepository pricePointRepository;
    private final FinnhubService finnhubService;
    private final PolygonService polygonService;

    // Cache to prevent multiple calls at the same time
    private final ConcurrentHashMap<String, Mono<List<PricePoint>>> cache = new ConcurrentHashMap<>();

    public Mono<List<PricePoint>> getDailyPrices(String ticker) {
        ticker = ticker.toUpperCase();

        return cache.computeIfAbsent(ticker, t ->
                fetchAndSaveIfAbsent(t)
                        .doFinally(signal -> cache.remove(t)) // remove from cache after execution
                        .cache() // cache result for multiple subscribers
        );
    }

    @Transactional
    protected Mono<List<PricePoint>> fetchAndSaveIfAbsent(String ticker) {
        // First, check if DB already has prices
        List<PricePoint> existing = pricePointRepository.findByTicker(ticker);
        if (!existing.isEmpty()) {
            return Mono.just(existing);
        }

        // Fetch from Finnhub, fallback to Polygon
        return finnhubService.getDailyHistory(ticker)
                .onErrorResume(e -> polygonService.getDailyHistory(ticker))
                .flatMap(resp -> {
                    List<PricePoint> prices = resp.getPrices();

                    if (prices == null || prices.isEmpty()) {
                        return Mono.just(List.<PricePoint>of());
                    }

                    prices.forEach(p -> p.setTicker(ticker));

                    // Only save once transactionally
                    return Mono.fromCallable(() -> pricePointRepository.saveAll(prices));
                });
    }
}
