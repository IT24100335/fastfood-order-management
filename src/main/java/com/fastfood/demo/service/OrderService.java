package com.fastfood.demo.service;

import com.fastfood.demo.model.CustomerOrder;
import com.fastfood.demo.repository.CustomerOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private CustomerOrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<CustomerOrder> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public CustomerOrder createOrder(CustomerOrder order) {
        order.setOrderTime(LocalDateTime.now());
        order.setStatus("Pending");

        // Standardize Order Number: ORD-YYYYMMDD-Random
        String datePart = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
        String randomPart = String.format("%04d", new java.util.Random().nextInt(10000));
        order.setOrderNumber("ORD-" + datePart + "-" + randomPart);

        CustomerOrder savedOrder = orderRepository.save(order);

        // Deduct stock for each item
        if (order.getItems() != null) {
            order.getItems().forEach(item -> {
                inventoryService.deductStock(item.getMenuItemId(), item.getQuantity());
            });
        }

        return savedOrder;
    }

    public CustomerOrder updateOrderStatus(Long orderId, String newStatus) {
        Optional<CustomerOrder> optOrder = orderRepository.findById(orderId);
        if (optOrder.isPresent()) {
            CustomerOrder order = optOrder.get();
            order.setStatus(newStatus);
            return orderRepository.save(order);
        }
        return null;
    }

    public CustomerOrder updateOrder(Long id, CustomerOrder orderDetails) {
        return orderRepository.findById(id).map(order -> {
            order.setDeliveryAddress(orderDetails.getDeliveryAddress());
            order.setTotalAmount(orderDetails.getTotalAmount());
            order.setStatus(orderDetails.getStatus());
            // You can add more fields here if needed
            return orderRepository.save(order);
        }).orElse(null);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}
