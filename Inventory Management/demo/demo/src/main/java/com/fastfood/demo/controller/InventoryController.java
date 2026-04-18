package com.fastfood.demo.controller;

import com.fastfood.demo.model.MenuItem;
import com.fastfood.demo.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// 4. Inventory Management Component (Shares logic context with Menu)
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    // Pantry Management (Raw ingredients like carrot, maida)
    @GetMapping("/pantry")
    public java.util.List<com.fastfood.demo.model.InventoryItem> getAllPantryItems() {
        return inventoryService.getAllPantryItems();
    }

    @PostMapping("/pantry")
    public com.fastfood.demo.model.InventoryItem createPantryItem(@RequestBody com.fastfood.demo.model.InventoryItem item) {
        return inventoryService.savePantryItem(item);
    }

    @DeleteMapping("/pantry/{id}")
    public ResponseEntity<Void> deletePantryItem(@PathVariable Long id) {
        inventoryService.deletePantryItem(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/pantry/{id}")
    public com.fastfood.demo.model.InventoryItem updatePantryItem(@PathVariable Long id, @RequestBody com.fastfood.demo.model.InventoryItem item) {
        item.setId(id);
        return inventoryService.savePantryItem(item);
    }

    // Special Feature: Manual Stock Update via Admin Dashboard
    @PutMapping("/{id}/stock")
    public ResponseEntity<MenuItem> updateStock(@PathVariable Long id, @RequestParam int newStock) {
        MenuItem item = inventoryService.updateStock(id, newStock);
        if (item != null) {
            return ResponseEntity.ok(item);
        }
        return ResponseEntity.notFound().build();
    }
}
