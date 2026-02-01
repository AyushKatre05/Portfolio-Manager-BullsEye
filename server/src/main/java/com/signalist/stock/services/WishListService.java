package com.signalist.stock.services;

import com.signalist.stock.dto.WishListRequest;
import com.signalist.stock.dto.WishListResponse;
import com.signalist.stock.entity.User;
import com.signalist.stock.entity.WishList;
import com.signalist.stock.repository.UserRepository;
import com.signalist.stock.repository.WishListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WishListService {

    private final UserRepository userRepository;
    private final WishListRepository wishListRepository;

    public WishListService(
            UserRepository userRepository,
            WishListRepository wishListRepository
    ) {
        this.userRepository = userRepository;
        this.wishListRepository = wishListRepository;
    }

    // -------------------------
    // ADD TO WISHLIST
    // -------------------------
    public void saveEntity(WishListRequest request) {

        UUID userId = UUID.fromString(request.getUserId());
        if (userId == null) return;

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;

        User user = userOpt.get();

        WishList wishList = WishList.builder()
                .user(user)
                .symbol(request.getSymbol())
                .company(request.getCompany())
                .addedAt(Date.from(Instant.now()).toInstant())
                .build();

        wishListRepository.save(wishList);
    }

    // -------------------------
    // GET SYMBOLS BY EMAIL
    // -------------------------
    public List<String> getSymbolByEmail(String email) {
        if (email == null || email.isBlank()) return List.of();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return List.of();

        return wishListRepository
                .findByUserId(userOpt.get().getId())
                .stream()
                .map(WishList::getSymbol)
                .collect(Collectors.toList());
    }

    // -------------------------
    // GET FULL WISHLIST
    // -------------------------
    public List<WishListResponse> getSymbolByUserId(UUID userId) {
        if (userId == null) return List.of();

        return wishListRepository.findByUserId(userId)
                .stream()
                .map(w -> new WishListResponse(
                        w.getSymbol(),
                        w.getCompany(),
                        w.getAddedAt()
                ))
                .collect(Collectors.toList());
    }

    // -------------------------
    // REMOVE FROM WISHLIST
    // -------------------------
    @Transactional
    public void deleteByUserIdAndSymbol(UUID userId, String symbol) {
        if (userId == null || symbol == null || symbol.isBlank()) return;

        wishListRepository.deleteByUserIdAndSymbol(userId, symbol);
    }
}
