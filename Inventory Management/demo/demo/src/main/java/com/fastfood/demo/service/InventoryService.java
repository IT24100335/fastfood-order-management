package com.fastfood.demo.service;

import com.fastfood.demo.model.MenuItem;
import com.fastfood.demo.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private com.fastfood.demo.repository.InventoryItemRepository inventoryItemRepository;

    // Special Feature: Deduct stock after order
    public boolean deductStock(Long menuItemId, int quantity) {
        Optional<MenuItem> optItem = menuItemRepository.findById(menuItemId);
        if (optItem.isPresent()) {
            MenuItem item = optItem.get();
            if (item.getStock() >= quantity) {
                item.setStock(item.getStock() - quantity);
                menuItemRepository.save(item);
                return true;
            }
        }
        return false;
    }

    // Special Feature: Manual Stock Update via Admin Dashboard
    public MenuItem updateStock(Long menuItemId, int newStock) {
        Optional<MenuItem> optItem = menuItemRepository.findById(menuItemId);
        if (optItem.isPresent()) {
            MenuItem item = optItem.get();
            item.setStock(newStock);
            return menuItemRepository.save(item);
        }
        return null;
    }

    // Pantry Management CRUD
    public java.util.List<com.fastfood.demo.model.InventoryItem> getAllPantryItems() {
        return inventoryItemRepository.findAll();
    }

    public com.fastfood.demo.model.InventoryItem savePantryItem(com.fastfood.demo.model.InventoryItem item) {
        return inventoryItemRepository.save(item);
    }

    public void deletePantryItem(Long id) {
        inventoryItemRepository.deleteById(id);
    }
}
