package com.pm.portfoliomanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "price_point", uniqueConstraints = {@UniqueConstraint(columnNames = {"ticker", "date"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PricePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticker;
    private String date;
    private double close;
}
