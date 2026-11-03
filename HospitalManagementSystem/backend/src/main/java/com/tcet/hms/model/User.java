package com.tcet.hms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    // ADMIN, DOCTOR, RECEPTIONIST
    private String role;

    /**
     * Optional link from a login account to a Doctor profile.
     * Only set when role = DOCTOR, so a doctor can log in and see
     * only their own appointments.
     */
    private Long doctorId;
}
