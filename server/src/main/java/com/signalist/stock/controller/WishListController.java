package com.signalist.stock.controller;

import com.signalist.stock.dto.WishListRequest;
import com.signalist.stock.dto.WishListResponse;
import com.signalist.stock.services.WishListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
public class WishListController {

    private final WishListService wishListService;

    public WishListController(WishListService wishListService) {
        this.wishListService = wishListService;
    }

    // -------------------------
    // ADD TO WISHLIST
    // -------------------------
    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody WishListRequest request) {
        wishListService.saveEntity(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // -------------------------
    // GET USER WISHLIST
    // -------------------------
    @GetMapping
    public ResponseEntity<List<WishListResponse>> getFromWishList(
            @RequestParam UUID userId
    ) {
        return ResponseEntity.ok(
                wishListService.getSymbolByUserId(userId)
        );
    }

    // -------------------------
    // REMOVE FROM WISHLIST
    // -------------------------
    @DeleteMapping
    public ResponseEntity<?> removeFromWishlist(
            @RequestParam UUID userId,
            @RequestParam String symbol
    ) {
        wishListService.deleteByUserIdAndSymbol(userId, symbol);
        return ResponseEntity.noContent().build();
    }
}
