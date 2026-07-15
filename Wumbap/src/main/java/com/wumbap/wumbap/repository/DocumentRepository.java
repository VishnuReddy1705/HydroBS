package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByResidentId(Long residentId);
}
