package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.CompanyOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final PolygonCompanyService polygonService;
    private final FinnhubCompanyService finnhubService; // your existing Finnhub wrapper

    public Mono<CompanyOverview> getCompanyOverview(String ticker) {
        return polygonService.getCompanyOverview(ticker)
                .onErrorResume(e -> finnhubService.getCompanyOverview(ticker));
    }
}
