package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.CompanyOverviewResponse;
import com.pm.portfoliomanager.service.AlphaVantageCompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyController {

    private final AlphaVantageCompanyService companyService;

    @GetMapping("/{ticker}")
    public Mono<CompanyOverviewResponse> getCompanyOverview(
            @PathVariable String ticker
    ) {
        return companyService
                .getCompanyOverview(ticker.toUpperCase())
                .map(CompanyOverviewResponse::new);
    }
}
