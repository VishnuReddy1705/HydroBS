package com.wumbap.wumbap.config;

import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SuperAdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String EMAIL = "adminvishnu@gmail.com";
    private static final String PASSWORD = "admin";

    @Override
    public void run(String... args) {

        if (userRepository.existsByEmail(EMAIL)) {
            return;
        }

        User admin = User.builder()
                .fullName("Platform Owner")
                .email(EMAIL)
                .password(passwordEncoder.encode(PASSWORD))
                .role(Role.SUPER_ADMIN)
                .build();

        userRepository.save(admin);

        System.out.println("=========================================");
        System.out.println("SUPER ADMIN CREATED");
        System.out.println("Email : " + EMAIL);
        System.out.println("=========================================");
    }
}