package com.signalist.stock.services;

import com.signalist.stock.dto.WishListRequest;
import com.signalist.stock.dto.WishListResponse;
import com.signalist.stock.entity.User;
import com.signalist.stock.entity.WishList;
import com.signalist.stock.repository.UserRepository;
import com.signalist.stock.repository.WishListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WishListService {

    private final WishListRepository wishListRepository;
    private final UserRepository userRepository;

    public WishListService(
            WishListRepository wishListRepository,
            UserRepository userRepository
    ) {
        this.wishListRepository = wishListRepository;
        this.userRepository = userRepository;
    }

    // -------------------------
    // ADD TO WISHLIST
    // -------------------------
    public void addToWishList(WishListRequest request) {

        User user = userRepository.findByEmail(request.getUserId())
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found: " + request.getUserId())
                );

        boolean exists = wishListRepository.existsByUser_EmailAndSymbol(
                user.getEmail(),
                request.getSymbol()
        );

        if (exists) {
            return; // silently ignore duplicate (or throw 409 if you want)
        }

        WishList wishList = WishList.builder()
                .user(user)
                .symbol(request.getSymbol())
                .company(request.getCompany())
                .build();

        wishListRepository.save(wishList);
    }

    // -------------------------
    // GET USER WISHLIST
    // -------------------------
    @Transactional(readOnly = true)
    public List<WishListResponse> getByEmail(String email) {

        return wishListRepository.findByUser_Email(email)
                .stream()
                .map(w -> new WishListResponse(
                        w.getSymbol(),
                        w.getCompany(),
                        w.getAddedAt()
                ))
                .toList();
    }

    // -------------------------
    // REMOVE FROM WISHLIST
    // -------------------------
    public void deleteByEmailAndSymbol(String email, String symbol) {

        wishListRepository.deleteByUser_EmailAndSymbol(email, symbol);
    }
}
