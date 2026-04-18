package com.fastfood.demo.controller;

import com.fastfood.demo.model.MenuItem;
import com.fastfood.demo.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

// 4. Menu Management Component
@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuService menuService;

    private final String UPLOAD_DIR = "uploads/menu/";

    @GetMapping
    public List<MenuItem> getAllMenuItems() {
        return menuService.getAllMenuItems();
    }

    @GetMapping("/recommended")
    public List<MenuItem> getRecommendedMenuItems() {
        return menuService.getRecommendedMenuItems();
    }

    @PostMapping
    public MenuItem saveMenuItem(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("stock") Integer stock,
            @RequestParam("available") Boolean available,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "imageUrl", required = false) String imageUrl) {

        MenuItem item = new MenuItem();
        if (id != null) {
            item = menuService.getMenuItem(id).orElse(new MenuItem());
        }

        item.setName(name);
        item.setPrice(price);
        item.setCategory(category);
        item.setDescription(description);
        item.setStock(stock);
        item.setAvailable(available);

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                // Ensure directory exists
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(imageFile.getInputStream(), filePath);
                item.setImageUrl("/uploads/menu/" + fileName);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else if (imageUrl != null && !imageUrl.isEmpty()) {
            item.setImageUrl(imageUrl);
        }

        return menuService.saveMenuItem(item);
    }

    // Special Feature: Availability auto-hide toggle
    @PutMapping("/{id}/toggle-availability")
    public ResponseEntity<MenuItem> toggleAvailability(@PathVariable Long id) {
        Optional<MenuItem> itemOpt = menuService.getMenuItem(id);
        if (itemOpt.isPresent()) {
            MenuItem item = itemOpt.get();
            item.setAvailable(!item.getAvailable());
            return ResponseEntity.ok(menuService.saveMenuItem(item));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.ok().build();
    }
}
