package com.signalist.stock.controller;

import com.signalist.stock.dto.AuthResponse;
import com.signalist.stock.dto.LoginRequest;
import com.signalist.stock.dto.SignUpRequest;
import com.signalist.stock.entity.User;
import com.signalist.stock.repository.UserRepository;
import com.signalist.stock.security.CustomUserDetailsService;
import com.signalist.stock.services.UserService;
import com.signalist.stock.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    public UserController(
            UserRepository userRepository,
            UserService userService,
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    // -------------------------
    // SIGN UP
    // -------------------------
    @PostMapping("/sign-up")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest request) throws Exception {

        // Validate required fields
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body("Full Name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Password is required");
        }

        // Save user
        userService.saveEntry(request);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }


    // -------------------------
    // SIGN IN
    // -------------------------
    @PostMapping("/sign-in")
    public ResponseEntity<?> signIn(@RequestBody LoginRequest request) {

        try {
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    );

            authenticationManager.authenticate(authToken);

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(request.getEmail());

            String token = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok(new AuthResponse(token, "Bearer"));

        } catch (AuthenticationException ex) {

            Optional<User> userOpt =
                    userRepository.findByEmail(request.getEmail());

            if (userOpt.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Email does not exist");
            }

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Incorrect password");
        }
    }
}
