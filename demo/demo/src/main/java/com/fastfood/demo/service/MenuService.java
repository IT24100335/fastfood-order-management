package com.fastfood.demo.service;

import com.fastfood.demo.model.MenuItem;
import com.fastfood.demo.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    public List<MenuItem> getRecommendedMenuItems() {
        return menuItemRepository.findByStockGreaterThanOrderByRatingDesc(0);
    }

    public MenuItem saveMenuItem(MenuItem item) {
        return menuItemRepository.save(item);
    }

    public void deleteMenuItem(Long id) {
        menuItemRepository.deleteById(id);
    }

    public Optional<MenuItem> getMenuItem(Long id) {
        return menuItemRepository.findById(id);
    }
}
