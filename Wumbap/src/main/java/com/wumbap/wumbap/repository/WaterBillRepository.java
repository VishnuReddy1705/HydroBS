package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.WaterBill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WaterBillRepository extends JpaRepository<WaterBill, Long> {

    List<WaterBill> findByResidentId(Long residentId);

    List<WaterBill> findByCommunityId(Long communityId);

    List<WaterBill> findByCommunityIdAndBillingMonth(Long communityId, LocalDate billingMonth);

    Optional<WaterBill> findByResidentIdAndBillingMonth(Long residentId, LocalDate billingMonth);

    long countByCommunityIdAndStatus(Long communityId, String status);
}
