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
public class CompanyOverview {

    @Id
    private String symbol; // primary key

    private String name;
    private String sector;
    private String industry;
    private String marketCap;
    private String peRatio;
    private String dividendYield;
    private String description;
}
