package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Refund;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    Optional<Refund> findByRefundNumber(String refundNumber);
    Optional<Refund> findByPaymentId(Long paymentId);
    List<Refund> findByBillId(Long billId);
    List<Refund> findByStatus(String status);
    Page<Refund> findByBillCommunityId(Long communityId, Pageable pageable);
}
