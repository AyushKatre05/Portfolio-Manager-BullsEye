package com.signalist.stock.dto;

import java.time.Instant;

public record WishListResponse(
        String symbol,
        String company,
        Instant addedAt
) {}
