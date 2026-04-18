package com.fastfood.demo.service;

import com.fastfood.demo.model.Promotion;
import com.fastfood.demo.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionService {
    @Autowired
    private PromotionRepository promotionRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Promotion savePromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    public Optional<Promotion> validatePromoCode(String code) {
        Optional<Promotion> promo = promotionRepository.findByCode(code.toUpperCase());
        if (promo.isPresent() && Boolean.TRUE.equals(promo.get().getActive())) {
            return promo;
        }
        return Optional.empty();
    }

    public void deletePromotion(Long id) {
        promotionRepository.deleteById(id);
    }

    public Optional<Promotion> getPromotion(Long id) {
        return promotionRepository.findById(id);
    }
}
