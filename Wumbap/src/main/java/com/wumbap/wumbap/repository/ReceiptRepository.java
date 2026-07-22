package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Receipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByPaymentId(Long paymentId);
    Optional<Receipt> findByReceiptNumber(String receiptNumber);
    List<Receipt> findByBillId(Long billId);
    Page<Receipt> findByResidentId(Long residentId, Pageable pageable);
    Page<Receipt> findByCommunityId(Long communityId, Pageable pageable);
}
