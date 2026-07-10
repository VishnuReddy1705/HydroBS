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
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create Super Admin if it does not already exist
        if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
            User superAdmin = User.builder()
                    .fullName("Super Admin")
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.SUPER_ADMIN)
                    .build();

            userRepository.save(superAdmin);

            System.out.println("=========================================");
            System.out.println("SUPER ADMIN CREATED successfully.");
            System.out.println("Email: admin@gmail.com");
            System.out.println("Password: admin");
            System.out.println("=========================================");
        }
    }
}