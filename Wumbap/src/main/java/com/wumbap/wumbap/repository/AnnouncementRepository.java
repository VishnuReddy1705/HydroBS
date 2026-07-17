package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByCommunityIdAndIsArchivedOrderByPublishDateDesc(Long communityId, boolean isArchived);

    List<Announcement> findByCommunityIsNullAndIsArchivedOrderByPublishDateDesc(boolean isArchived);

    List<Announcement> findByIsArchivedOrderByPublishDateDesc(boolean isArchived);
}
