package com.signalist.stock.repository;

import com.signalist.stock.entity.WishList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WishListRepository extends JpaRepository<WishList, UUID> {

    List<WishList> findByUser_Email(String email);

    Optional<WishList> findByUser_EmailAndSymbol(String email, String symbol);

    void deleteByUser_EmailAndSymbol(String email, String symbol);

    boolean existsByUser_EmailAndSymbol(String email, String symbol);
}
