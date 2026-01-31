package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.dto.CompanyOverviewResponse;
import com.pm.portfoliomanager.model.CompanyOverview;
import com.pm.portfoliomanager.repository.CompanyOverviewRepository;
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
    private final CompanyOverviewRepository companyRepository;

    @GetMapping("/{ticker}")
    public Mono<CompanyOverviewResponse> getCompanyOverview(
            @PathVariable String ticker
    ) {
        return companyService
                .getCompanyOverview(ticker.toUpperCase())
                .flatMap(company -> {
                    // Save to DB using JPA (blocking call wrapped in Mono)
                    return Mono.fromCallable(() -> companyRepository.save(company))
                            .map(saved -> new CompanyOverviewResponse(saved));
                });
    }
}
