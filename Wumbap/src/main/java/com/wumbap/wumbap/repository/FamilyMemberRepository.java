package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByResidentId(Long residentId);
}
