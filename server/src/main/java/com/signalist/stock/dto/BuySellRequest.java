package com.signalist.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuySellRequest {
    private String symbol;
    private String name;
    private int quantity;
    private double price;
}