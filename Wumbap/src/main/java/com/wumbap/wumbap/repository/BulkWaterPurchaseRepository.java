package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.BulkWaterPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkWaterPurchaseRepository extends JpaRepository<BulkWaterPurchase, Long>, JpaSpecificationExecutor<BulkWaterPurchase> {
    List<BulkWaterPurchase> findByCommunityId(Long communityId);
    List<BulkWaterPurchase> findByBillingCycleId(Long billingCycleId);
}
