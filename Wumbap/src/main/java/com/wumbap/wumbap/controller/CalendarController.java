package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.CalendarEvent;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CalendarEventRepository;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/water/calendar-events")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getCalendarEvents(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCommunity() == null) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        Long communityId = user.getCommunity().getId();
        List<CalendarEvent> events;

        if (start != null && end != null) {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            events = calendarEventRepository.findByCommunityIdAndEventDateBetween(communityId, startDate, endDate);
        } else {
            events = calendarEventRepository.findByCommunityId(communityId);
        }

        List<Map<String, Object>> response = events.stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("title", e.getTitle());
                    map.put("description", e.getDescription());
                    map.put("eventDate", e.getEventDate().toString());
                    map.put("eventType", e.getEventType());
                    map.put("referenceId", e.getReferenceId());
                    return map;
                })
                .toList();

        return ResponseEntity.ok(response);
    }
}
