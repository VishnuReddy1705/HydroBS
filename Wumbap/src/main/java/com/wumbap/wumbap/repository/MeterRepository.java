package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Meter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeterRepository extends JpaRepository<Meter, Long> {
    Optional<Meter> findByMeterNumber(String meterNumber);
    List<Meter> findByCommunityId(Long communityId);
    List<Meter> findByResidentId(Long residentId);
    Optional<Meter> findByResidentIdAndStatus(Long residentId, String status);
}
