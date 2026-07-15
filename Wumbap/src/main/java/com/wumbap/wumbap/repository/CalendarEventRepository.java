package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByCommunityIdAndEventDateBetween(Long communityId, LocalDate start, LocalDate end);
    List<CalendarEvent> findByCommunityId(Long communityId);
}
