package com.signalist.stock.repository;

import com.signalist.stock.entity.WishList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface WishListRepository extends JpaRepository<WishList, Long> {
    List<WishList> findByUserId(UUID userId);
    void deleteByUserIdAndSymbol(UUID userId, String symbol);
}
