package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.MeResponse;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public MeResponse me(Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new MeResponse(
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCommunity() != null ? user.getCommunity().getId() : null,
                user.getCommunity() != null ? user.getCommunity().getName() : null,
                user.getFlatNumber()
        );
    }
}