package com.tcet.hms.service;

import com.tcet.hms.exception.DuplicateResourceException;
import com.tcet.hms.model.User;
import com.tcet.hms.modeldto.AuthResponseDTO;
import com.tcet.hms.modeldto.LoginRequestDTO;
import com.tcet.hms.modeldto.RegisterRequestDTO;
import com.tcet.hms.repositorys.UserRepository;
import com.tcet.hms.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public String register(RegisterRequestDTO request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException(
                    "Username '" + request.getUsername() + "' is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole().toUpperCase());
        user.setDoctorId(request.getDoctorId());

        userRepository.save(user);
        return "User registered successfully";
    }

    public AuthResponseDTO login(LoginRequestDTO request) {

        // Throws BadCredentialsException (handled globally) if invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername());
        String token = jwtService.generateToken(user.getUsername());

        return new AuthResponseDTO(
                token, user.getUsername(), user.getRole(), user.getDoctorId());
    }
}
