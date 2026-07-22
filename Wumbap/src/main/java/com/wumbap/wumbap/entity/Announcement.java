package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community; // If null, it's global (Super Admin only). Otherwise, specific to this community

    @Column(name = "publish_date", nullable = false)
    private LocalDateTime publishDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @Column(name = "priority", length = 50)
    @Builder.Default
    private String priority = "NORMAL";

    @Column(name = "audience", length = 100)
    @Builder.Default
    private String audience = "Entire Community";

    @Column(name = "target_buildings", length = 255)
    private String targetBuildings;

    @Column(name = "target_flats", length = 255)
    private String targetFlats;

    @Column(name = "target_residents", length = 255)
    private String targetResidents;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (publishDate == null) {
            publishDate = LocalDateTime.now();
        }
    }
}
