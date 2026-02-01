package com.signalist.stock.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FinnubService {
    private final WebClient webClient;
    private final ParameterizedTypeReference<List<Map<String, Object>>> listTypes =
            new ParameterizedTypeReference<List<Map<String, Object>>>() {};

    @Value("${finnhub.api.key}")
    private String finKey;



    public FinnubService(WebClient.Builder webClientBuilder){
        this.webClient = webClientBuilder.baseUrl("https://finnhub.io/api/v1").build();
    }

    public List<Map<String, Object>> getCompanyNews(String symbol,String from,String to){
        String token = finKey;
        try{
            return webClient.get()
                    .uri(uri -> uri.path("/company-news")
                            .queryParam("symbol",symbol)
                            .queryParam("from",from)
                            .queryParam("to",to)
                            .queryParam("token",token)
                            .build())
                    .retrieve()
                    .bodyToMono(listTypes)
                    .blockOptional(Duration.ofSeconds(20))
                    .orElse(List.of());
        }catch (Exception e) {
            return List.of();
        }
    }

    public List<Map<String,Object>> getGeneralNews(){
        String token = finKey;
        try{
            return webClient.get()
                    .uri(uri -> uri.path("/news")
                            .queryParam("category","general")
                            .queryParam("token", token)
                            .build())
                    .retrieve()
                    .bodyToMono(listTypes)
                    .blockOptional(Duration.ofSeconds(20))
                    .orElse(List.of());
        }catch (Exception e){
            return List.of();
        }
    }

    public List<Map<String,Object>> getNewsForSymbols(List<String> symbols,String from,String to){
        if(symbols == null || symbols.isEmpty()) return getGeneralNews();
        List<Map<String,Object>> out = new ArrayList<>();
        for(String s: symbols){
            out.addAll(getCompanyNews(s,from,to));
        }
        return out;
    }

//    Search stock funtionality
    private final ParameterizedTypeReference<Map<String,Object>> mapType = new ParameterizedTypeReference<>(){};

    private static final List<String> POPULAR_SYMBOLS = List.of("AAPL","MSFT","GOOGL","AMZN","TSLA","NVDA","META");

    public List<Map<String,Object>> searchStocks(String query){
        if(finKey == null || finKey.isBlank()) return List.of();

        try{
            List<Map<String,Object>> results;

            if(query == null || query.trim().isEmpty()){
                results = POPULAR_SYMBOLS.stream()
                        .limit(10)
                        .map(this:: fetchStockProfile)
                        .filter(p -> p != null && p.containsKey("name"))
                        .map(p -> {
                            Map<String,Object> result = new HashMap<>();
                            String ticker = String.valueOf(p.getOrDefault("ticker","")).toUpperCase();
                            result.put("symbol",ticker);
                            result.put("description",p.get("name"));
                            result.put("displaySymbol",ticker);
                            result.put("type","Common Stock");
                            result.put("exchange",p.get("exchange"));
                            return result;
                        })
                        .toList();
            }else{
                Map<String,Object> responce = webClient.get()
                        .uri(uri -> uri.path("/search")
                                .queryParam("q",query.trim())
                                .queryParam("token",finKey)
                                .build())
                        .retrieve()
                        .bodyToMono(mapType)
                        .blockOptional(Duration.ofSeconds(10))
                        .orElse(Map.of());

                results = (List<Map<String,Object>>) responce.getOrDefault("result",List.of());
            }

            return results.stream().limit(15).collect(Collectors.toList());
        }catch (Exception e){
            return List.of();
        }
    }

    private Map<String, Object> fetchStockProfile(String symbol){
        try {
            return webClient.get()
                    .uri(uri -> uri.path("/stock/profile2")
                            .queryParam("symbol",symbol)
                            .queryParam("token",finKey)
                            .build())
                    .retrieve()
                    .bodyToMono(mapType)
                    .blockOptional(Duration.ofSeconds(5))
                    .orElse(null);
        }catch (Exception e){
            return null;
        }
    }

    public Map<String, Object> getStockProfile(String symbol) {
        if (symbol == null || symbol.isBlank() || finKey == null || finKey.isBlank()) {
            return Map.of();
        }

        try {
            return webClient.get()
                    .uri(uri -> uri.path("/stock/profile2")
                            .queryParam("symbol", symbol.toUpperCase())
                            .queryParam("token", finKey)
                            .build())
                    .retrieve()
                    .bodyToMono(mapType)
                    .blockOptional(Duration.ofSeconds(10))
                    .orElse(Map.of());
        } catch (Exception e) {
            return Map.of();
        }
    }
}
