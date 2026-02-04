package com.signalist.stock.repository;

import com.signalist.stock.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySymbolOrderByCreatedAtDesc(String symbol);
}
