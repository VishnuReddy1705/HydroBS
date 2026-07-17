package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.Announcement;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public Announcement createAnnouncement(String title, String content, User author, Community community, LocalDateTime expiryDate) {
        Announcement announcement = Announcement.builder()
                .title(title)
                .content(content)
                .author(author)
                .community(community)
                .publishDate(LocalDateTime.now())
                .expiryDate(expiryDate)
                .isArchived(false)
                .build();
        return announcementRepository.save(announcement);
    }

    public List<Announcement> getGlobalAnnouncements() {
        return announcementRepository.findByCommunityIsNullAndIsArchivedOrderByPublishDateDesc(false);
    }

    public List<Announcement> getCommunityAnnouncements(Long communityId) {
        return announcementRepository.findByCommunityIdAndIsArchivedOrderByPublishDateDesc(communityId, false);
    }

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findByIsArchivedOrderByPublishDateDesc(false);
    }

    public void archiveAnnouncement(Long id) {
        announcementRepository.findById(id).ifPresent(announcement -> {
            announcement.setArchived(true);
            announcementRepository.save(announcement);
        });
    }
}
