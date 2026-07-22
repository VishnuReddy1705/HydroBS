package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBillId(Long billId);
    List<Payment> findByBillIdAndStatus(Long billId, String status);
    List<Payment> findByBillResidentId(Long residentId);
    Page<Payment> findByBillResidentId(Long residentId, Pageable pageable);
    List<Payment> findByBillCommunityId(Long communityId);
    Page<Payment> findByBillCommunityId(Long communityId, Pageable pageable);
    List<Payment> findByBillCommunityIdAndPaidAtBetween(Long communityId, LocalDateTime from, LocalDateTime to);
}
