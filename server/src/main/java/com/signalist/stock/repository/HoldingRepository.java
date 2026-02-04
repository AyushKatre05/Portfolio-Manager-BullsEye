package com.signalist.stock.repository;

import com.signalist.stock.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    Optional<Holding> findBySymbol(String symbol);
}
