package com.tcet.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
@Table(name = "doctor")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Doctor name is required")
    private String name;

    @Email
    private String email;

    private String phone;

    @NotBlank(message = "Specialization is required")
    private String specialization;


    private String qualification;

    private Double consultationFee;


    @ManyToOne
    @JoinColumn(name = "department_id")
    @ToString.Exclude
    private Department department;


    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Appointment> appointments;
}
