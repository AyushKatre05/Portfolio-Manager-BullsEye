package com.pm.portfoliomanager.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanyOverview {

    private String symbol;
    private String name;
    private String sector;
    private String industry;
    private String marketCap;
    private String peRatio;
    private String dividendYield;
    private String description;
}
