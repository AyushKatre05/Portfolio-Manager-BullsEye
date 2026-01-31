package com.pm.portfoliomanager.repository;

import com.pm.portfoliomanager.model.CompanyOverview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyOverviewRepository extends JpaRepository<CompanyOverview, String> {
    // you can add custom queries if needed
}
