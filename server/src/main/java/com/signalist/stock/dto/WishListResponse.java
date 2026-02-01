package com.signalist.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class WishListResponse {
    private String symbol;
    private String company;
    private Date addedAt;

    public WishListResponse(String symbol, String company, Instant addedAt) {

    }
}
