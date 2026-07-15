package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.BillRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillRevisionRepository extends JpaRepository<BillRevision, Long> {
    List<BillRevision> findByBillIdOrderByRevisionNumberDesc(Long billId);
}
