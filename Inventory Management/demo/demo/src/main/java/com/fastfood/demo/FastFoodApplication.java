package com.fastfood.demo;

import com.fastfood.demo.model.AppUser;
import com.fastfood.demo.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class FastFoodApplication {
    public static void main(String[] args) {
        System.out.println("Starting Fast Food System Admin and Customer Dashboard...");
        SpringApplication.run(FastFoodApplication.class, args);
    }

    @Bean
    public CommandLineRunner initUsers(AppUserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                userRepository.saveAll(List.of(
                        new AppUser(null, "admin", null, "admin123", "ADMIN", null),
                        new AppUser(null, "menu_mgr", null, "menu123", "MENU_MANAGER", null),
                        new AppUser(null, "order_mgr", null, "order123", "ORDER_MANAGER", null),
                        new AppUser(null, "inventory_mgr", null, "inventory123", "INVENTORY_MANAGER", null),
                        new AppUser(null, "promo_mgr", null, "promo123", "PROMOTION_MANAGER", null),
                        new AppUser(null, "feedback_mgr", null, "feedback123", "FEEDBACK_MANAGER", null)));
                System.out.println("Initialized default manager accounts.");
            }
        };
    }
}
