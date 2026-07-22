package com.wumbap.wumbap.config;

import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            com.wumbap.wumbap.entity.User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider;
        try {
            // Spring Security 7 constructor: DaoAuthenticationProvider(UserDetailsService)
            java.lang.reflect.Constructor<DaoAuthenticationProvider> constructor = 
                    DaoAuthenticationProvider.class.getConstructor(UserDetailsService.class);
            authProvider = constructor.newInstance(userDetailsService());
        } catch (Exception e) {
            // Spring Security 5/6 fallback: DaoAuthenticationProvider()
            try {
                authProvider = DaoAuthenticationProvider.class.getDeclaredConstructor().newInstance();
                authProvider.setUserDetailsService(userDetailsService());
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to instantiate DaoAuthenticationProvider", ex);
            }
        }
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}