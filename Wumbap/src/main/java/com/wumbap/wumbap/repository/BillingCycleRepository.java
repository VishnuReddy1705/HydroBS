package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.BillingCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingCycleRepository extends JpaRepository<BillingCycle, Long> {
    List<BillingCycle> findByCommunityId(Long communityId);
    Optional<BillingCycle> findByCommunityIdAndStartDateAndEndDate(Long communityId, LocalDate startDate, LocalDate endDate);
    List<BillingCycle> findByStatus(String status);
}
