package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.UsageArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsageArchiveRepository extends JpaRepository<UsageArchive, Long> {
    List<UsageArchive> findByCommunityIdAndResidentIdAndPeriodType(Long communityId, Long residentId, String periodType);
    List<UsageArchive> findByCommunityIdAndPeriodType(Long communityId, String periodType);
    Optional<UsageArchive> findByCommunityIdAndResidentIdAndPeriodTypeAndPeriodIdentifier(
            Long communityId, Long residentId, String periodType, String periodIdentifier);
}
