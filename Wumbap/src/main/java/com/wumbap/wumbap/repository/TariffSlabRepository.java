package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.TariffSlab;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TariffSlabRepository extends JpaRepository<TariffSlab, Long> {
    List<TariffSlab> findByTariffId(Long tariffId);
}
