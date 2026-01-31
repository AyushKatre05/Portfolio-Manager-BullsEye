package com.pm.portfoliomanager.controller;

import com.pm.portfoliomanager.model.CompanyOverview;
import com.pm.portfoliomanager.repository.CompanyOverviewRepository;
import com.pm.portfoliomanager.service.FinnhubCompanyService;
import com.pm.portfoliomanager.service.PolygonCompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyController {

    private final FinnhubCompanyService finnhubService;
    private final PolygonCompanyService polygonService;
    private final CompanyOverviewRepository companyRepository;

    @GetMapping("/{ticker}")
    public Mono<CompanyOverview> getCompanyOverview(@PathVariable String ticker) {
        ticker = ticker.toUpperCase();

        String finalTicker = ticker;
        String finalTicker1 = ticker;
        return finnhubService.getCompanyOverview(ticker)
                .flatMap(finnhubCo -> {
                    // if critical fields missing, fallback to Polygon
                    boolean needsFallback =
                            finnhubCo.getSector().equals("-") || finnhubCo.getIndustry().equals("-")
                                    || finnhubCo.getMarketCap().equals("-") || finnhubCo.getDescription().equals("-");

                    if (!needsFallback) return Mono.just(finnhubCo);

                    return polygonService.getCompanyOverview(finalTicker1)
                            .map(polygonCo -> {
                                if (finnhubCo.getSector().equals("-")) finnhubCo.setSector(polygonCo.getSector());
                                if (finnhubCo.getIndustry().equals("-")) finnhubCo.setIndustry(polygonCo.getIndustry());
                                if (finnhubCo.getMarketCap().equals("-")) finnhubCo.setMarketCap(polygonCo.getMarketCap());
                                if (finnhubCo.getDescription().equals("-")) finnhubCo.setDescription(polygonCo.getDescription());
                                return finnhubCo;
                            });
                })
                .flatMap(co -> Mono.fromCallable(() -> companyRepository.save(co)))
                .onErrorMap(e -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Company not found for ticker: " + finalTicker, e));
    }

}
