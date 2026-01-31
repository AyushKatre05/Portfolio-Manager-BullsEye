package com.pm.portfoliomanager.repository;

import com.pm.portfoliomanager.model.PricePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PricePointRepository extends JpaRepository<PricePoint, Long> {
    // you can add custom queries if needed
}
