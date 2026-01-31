package com.pm.portfoliomanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockBehaviorResponse {

    private String ticker;
    private String volatilityType;
    private String trendNature;
    private String suitability;
    private int confidenceScore;
}
