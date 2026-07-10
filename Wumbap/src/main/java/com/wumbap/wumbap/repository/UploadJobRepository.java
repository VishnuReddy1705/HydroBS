package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.UploadJob;
import com.wumbap.wumbap.entity.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UploadJobRepository
        extends JpaRepository<UploadJob, Long> {

    List<UploadJob> findByCommunityIdOrderByUploadStartedAtDesc(
            Long communityId
    );

    List<UploadJob> findByUploadStatus(
            UploadStatus status
    );

}