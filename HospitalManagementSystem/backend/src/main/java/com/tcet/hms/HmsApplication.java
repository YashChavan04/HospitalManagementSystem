package com.tcet.hms;

import com.tcet.hms.model.User;
import com.tcet.hms.repositorys.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class HmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(HmsApplication.class, args);
	}

	@Bean
	CommandLineRunner bootstrapAdmin(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			@Value("${app.bootstrap.admin-username}") String adminUsername,
			@Value("${app.bootstrap.admin-password}") String adminPassword) {

		return args -> {
			if (userRepository.findByUsername(adminUsername) == null) {
				User admin = new User();
				admin.setUsername(adminUsername);
				admin.setPassword(passwordEncoder.encode(adminPassword));
				admin.setRole("ADMIN");
				userRepository.save(admin);
				System.out.println(
						"Default admin created -> username: " + adminUsername
								+ " | password: " + adminPassword
								+ " (change this in production!)");
			}
		};
	}
}
