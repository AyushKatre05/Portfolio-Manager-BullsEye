package com.pm.portfoliomanager.repository;

import com.pm.portfoliomanager.model.PricePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricePointRepository extends JpaRepository<PricePoint, Long> {
    List<PricePoint> findByTicker(String ticker);
}
