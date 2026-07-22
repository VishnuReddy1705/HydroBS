package com.wumbap.wumbap.config;

import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.email:admin@gmail.com}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:admin}")
    private String superAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Bootstrap a single Super Admin if none exists. Credentials are configurable via
        // SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars; the password is never logged.
        if (userRepository.findByEmail(superAdminEmail).isEmpty()) {
            User superAdmin = User.builder()
                    .fullName("Super Admin")
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode(superAdminPassword))
                    .role(Role.SUPER_ADMIN)
                    .build();

            userRepository.save(superAdmin);

            log.info("Bootstrap SUPER_ADMIN created for email {}. " +
                    "Change this password immediately if the default was used.", superAdminEmail);
        }
    }
}