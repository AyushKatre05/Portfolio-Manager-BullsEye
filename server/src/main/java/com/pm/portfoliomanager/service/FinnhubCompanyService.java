package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.CompanyOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class FinnhubCompanyService {

    private final WebClient webClient;

    @Value("${finnhub.api.key}")
    private String apiKey;

    public Mono<CompanyOverview> getCompanyOverview(String ticker) {
        String url = "https://finnhub.io/api/v1/stock/profile2?symbol=" + ticker + "&token=" + apiKey;

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(FinnhubResponse.class)
                .map(resp -> {
                    CompanyOverview co = new CompanyOverview();
                    co.setSymbol(resp.getTicker());
                    co.setName(resp.getName());
                    co.setSector(resp.getSector() != null ? resp.getSector() : "-");
                    co.setIndustry(resp.getIndustry() != null ? resp.getIndustry() : "-");
                    co.setMarketCap(resp.getMarketCap() != null ? resp.getMarketCap().toString() : "-");
                    co.setDescription(resp.getDescription() != null ? resp.getDescription() : "-");
                    return co;
                });
    }

    // internal DTO for Finnhub
    static class FinnhubResponse {
        private String ticker;
        private String name;
        private String sector;
        private String industry;
        private Double marketCapitalization;
        private String description;

        public String getTicker() { return ticker; }
        public void setTicker(String ticker) { this.ticker = ticker; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSector() { return sector; }
        public void setSector(String sector) { this.sector = sector; }
        public String getIndustry() { return industry; }
        public void setIndustry(String industry) { this.industry = industry; }
        public Double getMarketCap() { return marketCapitalization; }
        public void setMarketCap(Double marketCap) { this.marketCapitalization = marketCap; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
