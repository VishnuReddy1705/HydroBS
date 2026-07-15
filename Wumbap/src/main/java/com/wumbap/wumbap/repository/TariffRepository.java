package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TariffRepository extends JpaRepository<Tariff, Long> {
    List<Tariff> findByCommunityId(Long communityId);
    Optional<Tariff> findByCommunityIdAndIsActiveTrue(Long communityId);
}
