package com.pm.portfoliomanager.dto;

import com.pm.portfoliomanager.model.PricePoint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockHistoryResponse {
    private String ticker;
    private List<PricePoint> prices;
}
