package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
import com.pm.portfoliomanager.model.PricePoint;
import com.pm.portfoliomanager.repository.PricePointRepository;
import com.pm.portfoliomanager.service.AlphaVantageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {

    private final AlphaVantageService alphaVantageService;
    private final PricePointRepository pricePointRepository;

    @GetMapping("/{ticker}/history")
    public Mono<StockHistoryResponse> getStockHistory(@PathVariable String ticker) {
        return alphaVantageService.getDailyStockHistory(ticker.toUpperCase())
                .flatMap(historyResponse -> {
                    // Save the list of PricePoints to DB
                    List<PricePoint> points = historyResponse.getPrices();
                    return Mono.fromCallable(() -> pricePointRepository.saveAll(points))
                            .map(saved -> historyResponse); // return original response
                });
    }
}
