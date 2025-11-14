package com.example.crud.repository;

import com.example.crud.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Custom query methods
    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByStockGreaterThan(Integer stock);
}
