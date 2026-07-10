package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.MeterImportError;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeterImportErrorRepository
        extends JpaRepository<MeterImportError, Long> {

    List<MeterImportError> findByUploadJobId(
            Long uploadJobId
    );

}