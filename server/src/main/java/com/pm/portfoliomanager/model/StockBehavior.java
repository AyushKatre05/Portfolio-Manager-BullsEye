package com.pm.portfoliomanager.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class StockBehavior {

    @Id
    private String ticker; // primary key

    private String volatilityType;
    private String trendNature;
    private String suitability;
    private double confidenceScore;
}
