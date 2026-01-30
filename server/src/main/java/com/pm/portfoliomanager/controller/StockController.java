package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
import com.pm.portfoliomanager.service.AlphaVantageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {

    private final AlphaVantageService alphaVantageService;

    @GetMapping("/{ticker}/history")
    public Mono<StockHistoryResponse> getStockHistory(@PathVariable String ticker) {
        return alphaVantageService.getDailyStockHistory(ticker.toUpperCase());
    }
}
