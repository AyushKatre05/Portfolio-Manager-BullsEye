package com.signalist.stock.controller;

import com.signalist.stock.dto.WishListRequest;
import com.signalist.stock.dto.WishListResponse;
import com.signalist.stock.services.WishListService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
public class WishListController {

    private final WishListService wishListService;

    public WishListController(WishListService wishListService) {
        this.wishListService = wishListService;
    }

    // -------------------------
    // ADD TO WATCHLIST
    // POST /api/watchlist
    // -------------------------
    @PostMapping
    public ResponseEntity<Void> addToWatchlist(
            @RequestBody WishListRequest request
    ) {
        System.out.println("🔥 HIT /api/watchlist POST");
        wishListService.addToWishList(request);
        return ResponseEntity.ok().build();
    }

    // -------------------------
    // GET USER WATCHLIST
    // GET /api/watchlist?userId=email
    // -------------------------
    @GetMapping
    public ResponseEntity<List<WishListResponse>> getWatchlist(
            @RequestParam String userId // email
    ) {
        return ResponseEntity.ok(
                wishListService.getByEmail(userId)
        );
    }

    // -------------------------
    // REMOVE FROM WATCHLIST
    // DELETE /api/watchlist?userId=email&symbol=MSFT
    // -------------------------
    @DeleteMapping
    public ResponseEntity<Void> removeFromWatchlist(
            @RequestParam String userId, // email
            @RequestParam String symbol
    ) {
        wishListService.deleteByEmailAndSymbol(userId, symbol);
        return ResponseEntity.noContent().build();
    }
}
