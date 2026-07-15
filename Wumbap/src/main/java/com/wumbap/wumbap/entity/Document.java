package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"community", "password", "verificationToken", "resetPasswordToken"})
    private User resident;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // GOVERNMENT_ID, PROOF_OF_ADDRESS, RENTAL_AGREEMENT, OWNERSHIP_DOCUMENT, PROFILE_PHOTO

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    public void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
