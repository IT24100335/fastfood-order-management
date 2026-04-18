package com.fastfood.demo.controller;

import com.fastfood.demo.model.AppUser;
import com.fastfood.demo.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 6. User Management and Admin Dashboard Component
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private AppUserRepository userRepository;

    @GetMapping
    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody AppUser userDetails) {
        AppUser user = userRepository.findByUsername(userDetails.getUsername());
        if (user == null) {
            user = userRepository.findByEmail(userDetails.getUsername());
        }

        if (user != null && user.getPassword().equals(userDetails.getPassword())) {
            user.setLastLogin(java.time.LocalDateTime.now());
            userRepository.save(user); // Update last login
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AppUser user) {
        if (userRepository.findByUsername(user.getUsername()) != null) {
            return ResponseEntity.status(400).body("Username already exists");
        }
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.status(400).body("Email already exists");
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.status(400).body("Password must be at least 6 characters");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("CUSTOMER");
        }
        AppUser savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @Autowired
    private com.fastfood.demo.repository.CustomerOrderRepository orderRepository;

    @Autowired
    private com.fastfood.demo.repository.FeedbackRepository feedbackRepository;

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("User removed");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody AppUser userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                if (userDetails.getPassword().length() < 6) {
                    return ResponseEntity.status(400).body("Password must be at least 6 characters");
                }
                user.setPassword(userDetails.getPassword());
            }
            user.setRole(userDetails.getRole());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        java.util.Optional<AppUser> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            java.util.List<com.fastfood.demo.model.CustomerOrder> orders = orderRepository.findByUserId(id);
            java.util.List<com.fastfood.demo.model.Feedback> feedbacks = feedbackRepository.findByUserId(id);

            java.util.Map<String, Object> profile = new java.util.HashMap<>();
            profile.put("user", user);
            profile.put("orders", orders);
            profile.put("feedbacks", feedbacks);
            profile.put("totalItemsPurchased", orders.stream()
                    .mapToLong(o -> o.getItems() != null ? o.getItems().size() : 0).sum());

            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.notFound().build();
    }
}
