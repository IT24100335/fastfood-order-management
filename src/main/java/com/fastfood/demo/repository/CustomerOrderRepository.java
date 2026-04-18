package com.fastfood.demo.repository;

import com.fastfood.demo.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    java.util.List<CustomerOrder> findByUserId(Long userId);
}
