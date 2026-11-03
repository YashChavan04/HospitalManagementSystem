package com.tcet.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

/**
 * One prescription per appointment (1:1). Holds general instructions;
 * the actual medicines are in PrescriptionItem so a single prescription
 * can list several drugs.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "prescription")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    @ToString.Exclude
    private Appointment appointment;

    // e.g. "Take with food. Avoid alcohol. Return if symptoms persist beyond 5 days."
    private String generalInstructions;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PrescriptionItem> items;
}
