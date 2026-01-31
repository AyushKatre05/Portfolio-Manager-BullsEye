package com.pm.portfoliomanager.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "company_overview")
public class CompanyOverview {

    @Id
    private String symbol;

    @Column(length = 1000)
    private String name;

    @Column(length = 255)
    private String sector;

    @Column(length = 255)
    private String industry;

    @Column(length = 255)
    private String marketCap;

    @Lob
    private String description;
}
