package com.tcet.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "prescription_item")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Prescription prescription;

    private String medicineName;

    // e.g. "500mg"
    private String dosage;

    // e.g. "Twice a day"
    private String frequency;

    private Integer durationDays;
}
