package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.StockBehaviorResponse;
import com.pm.portfoliomanager.service.StockBehaviorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/behavior")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockBehaviorController {

    private final StockBehaviorService behaviorService;

    @GetMapping("/{ticker}")
    public Mono<StockBehaviorResponse> analyze(@PathVariable String ticker) {
        return behaviorService.analyze(ticker.toUpperCase());
    }
}
