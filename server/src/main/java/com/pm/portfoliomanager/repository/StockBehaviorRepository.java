package com.pm.portfoliomanager.repository;

import com.pm.portfoliomanager.model.StockBehavior;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockBehaviorRepository extends JpaRepository<StockBehavior, Long> {
    StockBehavior findByTicker(String ticker);
}
