package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.dto.StockBehaviorResponse;
import com.pm.portfoliomanager.model.PricePoint;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockBehaviorService {

    private final StockPriceService stockPriceService;

    public Mono<StockBehaviorResponse> analyze(String ticker) {

        return stockPriceService.getDailyPrices(ticker)
                .map(prices -> {

                    double volatility = calculateVolatility(prices);
                    double trend = prices.get(prices.size() - 1).getClose()
                            - prices.get(0).getClose();

                    String volatilityType =
                            volatility < 1.5 ? "LOW" :
                                    volatility < 3 ? "MEDIUM" : "HIGH";

                    String trendNature = trend > 0 ? "UPTREND" : "DOWNTREND";
                    String suitability =
                            volatilityType.equals("LOW")
                                    ? "LONG_TERM_INVESTOR"
                                    : "SHORT_TERM_TRADER";

                    int confidenceScore = Math.min(95, (int) (100 - volatility * 10));

                    return new StockBehaviorResponse(
                            ticker,
                            volatilityType,
                            trendNature,
                            suitability,
                            confidenceScore
                    );
                });
    }

    private double calculateVolatility(List<PricePoint> prices) {
        double avg = prices.stream().mapToDouble(PricePoint::getClose).average().orElse(0);
        return Math.sqrt(
                prices.stream()
                        .mapToDouble(p -> Math.pow(p.getClose() - avg, 2))
                        .average()
                        .orElse(0)
        );
    }
}
