package com.signalist.stock.services;

import com.signalist.stock.dto.SignUpRequest;
import com.signalist.stock.entity.User;
import com.signalist.stock.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalizedEmailService personalizedEmailService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PersonalizedEmailService personalizedEmailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.personalizedEmailService = personalizedEmailService;
    }

    // -------------------------
    // REGISTER USER USING DTO
    // -------------------------
    public void saveEntry(SignUpRequest request) throws Exception {

        // Optional: additional server-side validation
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full Name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Build User entity
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .country(request.getCountry())
                .investmentGoals(request.getInvestmentGoals())
                .preferredIndustry(request.getPreferredIndustry())
                .build();

        // Save to database
        userRepository.save(user);

        // Send welcome email asynchronously
        personalizedEmailService.generateAndSendWelcomeEmail(user);
    }

    // -------------------------
    // VALIDATE USER (OPTIONAL)
    // -------------------------
    public User checkUser(String email, String rawPassword) {

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return null;
        }

        User user = userOpt.get();

        return passwordEncoder.matches(rawPassword, user.getPassword())
                ? user
                : null;
    }
}
