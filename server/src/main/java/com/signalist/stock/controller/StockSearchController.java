package com.signalist.stock.controller;

import com.signalist.stock.dto.StockWithWatchlistStatus;
import com.signalist.stock.services.FinnubService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stocks")
public class StockSearchController {
    private final FinnubService finnubService;
    
    public StockSearchController(FinnubService finnubService){
        this.finnubService = finnubService;
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile(@RequestParam String symbol) {
        return finnubService.getStockProfile(symbol);
    }

    
    @GetMapping("/search")
    public List<StockWithWatchlistStatus> search(@RequestParam(required = false) String query){
        List<Map<String,Object>> raw = finnubService.searchStocks(query);
        
        return raw.stream()
                .map(r -> {
                    String symbol = String.valueOf(r.getOrDefault("symbol","")).toUpperCase();
                    String name = String.valueOf(r.getOrDefault("description",symbol));
                    String exchange = String.valueOf(r.getOrDefault("exchange","NASDAQ"));
                    String type = String.valueOf(r.getOrDefault("type","Stock"));
                    return new StockWithWatchlistStatus(symbol,name,exchange,type,false);
                })
                .filter(s -> !s.getSymbol().isBlank())
                .collect(Collectors.toList());
    }
}
