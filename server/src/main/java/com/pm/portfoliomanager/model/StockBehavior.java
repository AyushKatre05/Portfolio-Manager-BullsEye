package com.pm.portfoliomanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_behavior")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockBehavior {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String ticker;

    private String volatilityType;
    private String trendNature;
    private String suitability;
    private int confidenceScore;

    public StockBehavior(String ticker, String volatilityType, String trendNature, String suitability, int confidenceScore) {
        this.ticker = ticker;
        this.volatilityType = volatilityType;
        this.trendNature = trendNature;
        this.suitability = suitability;
        this.confidenceScore = confidenceScore;
    }
}
