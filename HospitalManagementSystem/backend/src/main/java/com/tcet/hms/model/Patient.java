package com.tcet.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "patient")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Patient name is required")
    private String name;

    @Email
    private String email;

    private String phone;

    @NotNull(message = "Age is required")
    private Integer age;

    // MALE, FEMALE, OTHER
    private String gender;

    private String address;

    private String bloodGroup;

    // Excluded from toString/equals to break the Patient <-> Appointment cycle
    // (Appointment.toString includes its Patient).
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Appointment> appointments;
}
