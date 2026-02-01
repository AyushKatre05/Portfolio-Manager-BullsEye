package com.signalist.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockWithWatchlistStatus {
    private String symbol;
    private String name;
    private String exchange;
    private String type;
    private boolean isInWatchlist;
}
