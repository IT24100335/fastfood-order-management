package com.fastfood.demo.controller;

import com.fastfood.demo.model.Promotion;
import com.fastfood.demo.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/promotions")
@CrossOrigin
public class PromotionController {
    @Autowired
    private PromotionService promotionService;

    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionService.getAllPromotions();
    }

    @PostMapping
    public ResponseEntity<?> createPromotion(@RequestBody Promotion promotion) {
        try {
            if (promotion.getCode() != null) {
                promotion.setCode(promotion.getCode().toUpperCase());
            }
            return ResponseEntity.ok(promotionService.savePromotion(promotion));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePromotion(@PathVariable Long id, @RequestBody Promotion promotionDetails) {
        Optional<Promotion> promoOpt = promotionService.getPromotion(id);
        if (promoOpt.isPresent()) {
            Promotion promo = promoOpt.get();
            promo.setName(promotionDetails.getName());
            if (promotionDetails.getCode() != null) {
                promo.setCode(promotionDetails.getCode().toUpperCase());
            }
            promo.setDiscountPercentage(promotionDetails.getDiscountPercentage());
            promo.setExpiryDate(promotionDetails.getExpiryDate());
            promo.setActive(promotionDetails.getActive());
            return ResponseEntity.ok(promotionService.savePromotion(promo));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<Promotion> validatePromoCode(@PathVariable String code) {
        Optional<Promotion> promo = promotionService.validatePromoCode(code);
        return promo.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.badRequest().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok().build();
    }
}
