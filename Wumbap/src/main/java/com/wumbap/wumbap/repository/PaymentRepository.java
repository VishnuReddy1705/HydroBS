package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBillId(Long billId);
    List<Payment> findByBillResidentId(Long residentId);
    List<Payment> findByBillCommunityId(Long communityId);
}
