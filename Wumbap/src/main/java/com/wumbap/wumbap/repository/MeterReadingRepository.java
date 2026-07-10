package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MeterReadingRepository
        extends JpaRepository<MeterReading, Long> {

    Optional<MeterReading> findByResidentIdAndReadingDate(
            Long residentId,
            LocalDate readingDate
    );

    List<MeterReading> findByCommunityIdAndReadingDate(
            Long communityId,
            LocalDate readingDate
    );

    List<MeterReading> findByCommunityId(Long communityId);

    List<MeterReading> findByResidentIdOrderByReadingDateDesc(
            Long residentId
    );

}