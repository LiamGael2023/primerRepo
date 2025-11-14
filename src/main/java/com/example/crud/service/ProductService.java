package com.example.crud.service;

import com.example.crud.entity.Product;
import com.example.crud.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // CREATE
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    // READ - Get all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // READ - Get product by ID
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    // READ - Search by name
    public List<Product> searchProductsByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    // READ - Get products with stock greater than
    public List<Product> getProductsWithStockGreaterThan(Integer stock) {
        return productRepository.findByStockGreaterThan(stock);
    }

    // UPDATE
    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setStock(productDetails.getStock());

        return productRepository.save(product);
    }

    // DELETE
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        productRepository.delete(product);
    }

    // DELETE ALL
    public void deleteAllProducts() {
        productRepository.deleteAll();
    }
}
