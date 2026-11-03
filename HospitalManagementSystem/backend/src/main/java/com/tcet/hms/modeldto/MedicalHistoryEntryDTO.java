package com.tcet.hms.modeldto;

import com.tcet.hms.model.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * One row in a patient's medical history timeline: an appointment,
 * enriched with its prescription (if the doctor added one) so the
 * frontend doesn't need a separate call per appointment.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MedicalHistoryEntryDTO {
    private Long appointmentId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String doctorName;
    private String doctorSpecialization;
    private AppointmentStatus status;
    private String reason;
    private String doctorNotes;
    private String prescriptionInstructions;
    private List<PrescriptionItemDTO> prescriptionItems;
}
