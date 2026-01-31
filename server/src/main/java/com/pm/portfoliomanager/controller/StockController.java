package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.StockHistoryResponse;
import com.pm.portfoliomanager.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {

    private final StockPriceService stockPriceService;

    @GetMapping("/{ticker}/history")
    public Mono<StockHistoryResponse> getStockHistory(@PathVariable String ticker) {
        return stockPriceService.getDailyPrices(ticker.toUpperCase())
                .map(prices -> new StockHistoryResponse(ticker.toUpperCase(), prices))
                .onErrorResume(e -> Mono.just(new StockHistoryResponse(ticker.toUpperCase(), List.of())));
    }
}
