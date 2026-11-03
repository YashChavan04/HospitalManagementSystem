package com.tcet.hms.service;

import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Appointment;
import com.tcet.hms.model.Prescription;
import com.tcet.hms.modeldto.MedicalHistoryEntryDTO;
import com.tcet.hms.modeldto.PrescriptionItemDTO;
import com.tcet.hms.repositorys.AppointmentRepository;
import com.tcet.hms.repositorys.PatientRepository;
import com.tcet.hms.repositorys.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;

    public List<MedicalHistoryEntryDTO> getForPatient(Long patientId) {

        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .sorted(Comparator
                        .comparing(Appointment::getAppointmentDate)
                        .thenComparing(Appointment::getAppointmentTime)
                        .reversed()) // most recent visit first
                .map(this::toEntry)
                .toList();
    }

    private MedicalHistoryEntryDTO toEntry(Appointment a) {

        Optional<Prescription> prescription = prescriptionRepository.findByAppointmentId(a.getId());

        String instructions = prescription.map(Prescription::getGeneralInstructions).orElse(null);

        List<PrescriptionItemDTO> items = prescription
                .map(p -> p.getItems() == null ? List.<PrescriptionItemDTO>of() :
                        p.getItems().stream()
                                .map(i -> new PrescriptionItemDTO(
                                        i.getMedicineName(), i.getDosage(), i.getFrequency(), i.getDurationDays()))
                                .toList())
                .orElse(List.of());

        return new MedicalHistoryEntryDTO(
                a.getId(),
                a.getAppointmentDate(),
                a.getAppointmentTime(),
                a.getDoctor().getName(),
                a.getDoctor().getSpecialization(),
                a.getStatus(),
                a.getReason(),
                a.getDoctorNotes(),
                instructions,
                items
        );
    }
}
