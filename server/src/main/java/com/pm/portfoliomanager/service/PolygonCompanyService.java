package com.pm.portfoliomanager.service;

import com.pm.portfoliomanager.model.CompanyOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class PolygonCompanyService {

    private final WebClient webClient;

    @Value("${polygon.api.key}")
    private String polygonApiKey;

    public Mono<CompanyOverview> getCompanyOverview(String ticker) {
        String url = "https://api.polygon.io/v3/reference/tickers/" + ticker + "?apiKey=" + polygonApiKey;

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(PolygonResponse.class)
                .map(resp -> {
                    PolygonResponse.Results r = resp.getResults();
                    CompanyOverview co = new CompanyOverview();
                    co.setSymbol(r.getTicker());
                    co.setName(r.getName());
                    co.setSector(r.getSector() != null ? r.getSector() : "-");
                    co.setIndustry(r.getIndustry() != null ? r.getIndustry() : "-");
                    co.setMarketCap(r.getMarketCap() != null ? r.getMarketCap().toString() : "-");
                    co.setDescription(r.getDescription() != null ? r.getDescription() : "-");
                    return co;
                });
    }

    static class PolygonResponse {
        private Results results;
        public Results getResults() { return results; }
        public void setResults(Results results) { this.results = results; }

        static class Results {
            private String ticker;
            private String name;
            private String sector;
            private String industry;
            private Double marketCap;
            private String description;

            public String getTicker() { return ticker; }
            public void setTicker(String ticker) { this.ticker = ticker; }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public String getSector() { return sector; }
            public void setSector(String sector) { this.sector = sector; }
            public String getIndustry() { return industry; }
            public void setIndustry(String industry) { this.industry = industry; }
            public Double getMarketCap() { return marketCap; }
            public void setMarketCap(Double marketCap) { this.marketCap = marketCap; }
            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
        }
    }
}
