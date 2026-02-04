package com.signalist.stock.services;

import com.signalist.stock.entity.Holding;
import com.signalist.stock.entity.Transaction;
import com.signalist.stock.repository.HoldingRepository;
import com.signalist.stock.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PortfolioService {

    private final HoldingRepository holdingRepository;
    private final TransactionRepository transactionRepository;
    private final FinnhubService finnhubService;

    public PortfolioService(HoldingRepository holdingRepository,
                            TransactionRepository transactionRepository,
                            FinnhubService finnhubService) {
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
        this.finnhubService = finnhubService;
    }

    @Transactional
    public Holding buyStock(String symbol, String name, int quantity, double price) {
        Holding holding = holdingRepository.findBySymbol(symbol)
                .orElseGet(() -> {
                    Holding h = new Holding();
                    h.setSymbol(symbol);
                    h.setName(name);
                    h.setQuantity(0);
                    h.setAveragePrice(0);
                    return h;
                });

        double totalCost = holding.getAveragePrice() * holding.getQuantity() + price * quantity;
        int newQuantity = holding.getQuantity() + quantity;
        holding.setQuantity(newQuantity);
        holding.setAveragePrice(totalCost / newQuantity);

        // Save transaction
        Transaction tx = new Transaction();
        tx.setSymbol(symbol);
        tx.setName(name);
        tx.setPrice(price);
        tx.setQuantity(quantity);
        tx.setType("BUY");
        transactionRepository.save(tx);

        return holdingRepository.save(holding);
    }

    @Transactional
    public Holding sellStock(String symbol, int quantity, double price) {
        Holding holding = holdingRepository.findBySymbol(symbol)
                .orElseThrow(() -> new RuntimeException("Holding not found"));

        if (quantity > holding.getQuantity()) {
            throw new RuntimeException("Not enough shares to sell");
        }

        holding.setQuantity(holding.getQuantity() - quantity);

        // Calculate profit for this transaction
        double profit = (price - holding.getAveragePrice()) * quantity;
        holding.setProfit(holding.getProfit() + profit);

        // Save transaction
        Transaction tx = new Transaction();
        tx.setSymbol(symbol);
        tx.setName(holding.getName());
        tx.setPrice(price);
        tx.setQuantity(quantity);
        tx.setType("SELL");
        transactionRepository.save(tx);

        return holdingRepository.save(holding);
    }

    public List<Holding> getPortfolio() {
        List<Holding> holdings = holdingRepository.findAll();
        // Update profit based on current price
        for (Holding h : holdings) {
            double currentPrice = finnhubService.getCurrentPrice(h.getSymbol());
            double unrealizedProfit = (currentPrice - h.getAveragePrice()) * h.getQuantity();
            h.setProfit(unrealizedProfit);
        }
        return holdings;
    }

    public List<Transaction> getTransactions(String symbol) {
        return transactionRepository.findBySymbolOrderByCreatedAtDesc(symbol);
    }

    public void resetPortfolio() {
        transactionRepository.deleteAll();
        holdingRepository.deleteAll();
    }
}
