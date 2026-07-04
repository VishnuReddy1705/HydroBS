package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Community;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityRepository extends JpaRepository<Community, Long> {

    List<Community> findByNameContainingIgnoreCase(String name);

}