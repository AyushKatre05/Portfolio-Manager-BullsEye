package com.signalist.stock.controller;

import com.signalist.stock.dto.BuySellRequest;
import com.signalist.stock.entity.Holding;
import com.signalist.stock.entity.Transaction;
import com.signalist.stock.services.PortfolioService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/holdings")
    public List<Holding> getHoldings() {
        return portfolioService.getPortfolio();
    }

    @PostMapping("/buy")
    public Holding buyStock(@RequestBody BuySellRequest request) {
        return portfolioService.buyStock(request.getSymbol(), request.getName(), request.getQuantity(), request.getPrice());
    }

    @PostMapping("/sell")
    public Holding sellStock(@RequestBody BuySellRequest request) {
        return portfolioService.sellStock(request.getSymbol(), request.getQuantity(), request.getPrice());
    }

    @GetMapping("/transactions/{symbol}")
    public List<Transaction> getTransactions(@PathVariable String symbol) {
        return portfolioService.getTransactions(symbol);
    }

    @PostMapping("/reset")
    public void resetPortfolio() {
        portfolioService.resetPortfolio();
    }
}
