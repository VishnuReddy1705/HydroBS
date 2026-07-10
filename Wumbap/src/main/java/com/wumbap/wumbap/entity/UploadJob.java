package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "upload_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id")
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Enumerated(EnumType.STRING)
    @Column(name = "upload_status", nullable = false)
    private UploadStatus uploadStatus;

    @Column(name = "total_rows")
    private Integer totalRows;

    @Column(name = "successful_rows")
    private Integer successfulRows;

    @Column(name = "failed_rows")
    private Integer failedRows;

    @Column(name = "upload_started_at")
    private LocalDateTime uploadStartedAt;

    @Column(name = "upload_completed_at")
    private LocalDateTime uploadCompletedAt;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @PrePersist
    public void prePersist() {

        uploadStartedAt = LocalDateTime.now();

        if (uploadStatus == null) {
            uploadStatus = UploadStatus.PROCESSING;
        }

        if (totalRows == null) totalRows = 0;
        if (successfulRows == null) successfulRows = 0;
        if (failedRows == null) failedRows = 0;
    }

}