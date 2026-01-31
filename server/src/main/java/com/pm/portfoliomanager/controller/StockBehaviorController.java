package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.StockBehaviorResponse;
import com.pm.portfoliomanager.model.StockBehavior;
import com.pm.portfoliomanager.repository.StockBehaviorRepository;
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
    private final StockBehaviorRepository behaviorRepository;

    @GetMapping("/{ticker}")
    public Mono<StockBehaviorResponse> analyze(@PathVariable String ticker) {
        return behaviorService.analyze(ticker.toUpperCase())
                .flatMap(behaviorDto -> {
                    // Map DTO to Entity
                    StockBehavior entity = new StockBehavior(
                            ticker.toUpperCase(),
                            behaviorDto.getVolatilityType(),
                            behaviorDto.getTrendNature(),
                            behaviorDto.getSuitability(),
                            behaviorDto.getConfidenceScore()
                    );
                    // Save entity to DB (blocking call wrapped in Mono)
                    return Mono.fromCallable(() -> behaviorRepository.save(entity))
                            .map(saved -> behaviorDto); // return original DTO
                });
    }
}
