package com.tcet.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
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
@Table(name = "department")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Department name is required")
    @Column(unique = true)
    private String name;

    private String description;

    // Floor / location, e.g. "Block A - 2nd Floor"
    private String location;

    // Excluded from toString/equals: Doctor also references Department, and
    // Doctor's own toString includes Appointment which includes Doctor again -
    // without this exclusion, printing/comparing entities recurses forever.
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Doctor> doctors;
}
