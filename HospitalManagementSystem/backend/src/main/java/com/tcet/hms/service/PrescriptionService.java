package com.tcet.hms.service;

import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Appointment;
import com.tcet.hms.model.Prescription;
import com.tcet.hms.model.PrescriptionItem;
import com.tcet.hms.modeldto.PrescriptionDTO;
import com.tcet.hms.modeldto.PrescriptionItemDTO;
import com.tcet.hms.modeldto.PrescriptionRequestDTO;
import com.tcet.hms.repositorys.AppointmentRepository;
import com.tcet.hms.repositorys.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Creates the prescription for an appointment if none exists yet,
     * or replaces its contents if one does (a doctor revising their
     * own notes/medicines before the visit is finalised).
     */
    public PrescriptionDTO createOrUpdate(Long appointmentId, PrescriptionRequestDTO request) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + appointmentId));

        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    Prescription p = new Prescription();
                    p.setAppointment(appointment);
                    p.setCreatedAt(LocalDateTime.now());
                    return p;
                });

        prescription.setGeneralInstructions(request.getGeneralInstructions());

        List<PrescriptionItem> items = new ArrayList<>();
        if (request.getItems() != null) {
            for (PrescriptionRequestDTO.Item itemReq : request.getItems()) {
                PrescriptionItem item = new PrescriptionItem();
                item.setPrescription(prescription);
                item.setMedicineName(itemReq.getMedicineName());
                item.setDosage(itemReq.getDosage());
                item.setFrequency(itemReq.getFrequency());
                item.setDurationDays(itemReq.getDurationDays());
                items.add(item);
            }
        }

        // Replace the whole items list - orphanRemoval on Prescription.items
        // takes care of deleting any medicines that were removed.
        if (prescription.getItems() == null) {
            prescription.setItems(items);
        } else {
            prescription.getItems().clear();
            prescription.getItems().addAll(items);
        }

        return toDTO(prescriptionRepository.save(prescription));
    }

    public PrescriptionDTO getByAppointment(Long appointmentId) {
        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No prescription found for appointment id: " + appointmentId));
        return toDTO(prescription);
    }

    private PrescriptionDTO toDTO(Prescription p) {
        List<PrescriptionItemDTO> itemDTOs = p.getItems() == null ? List.of() :
                p.getItems().stream()
                        .map(i -> new PrescriptionItemDTO(
                                i.getMedicineName(), i.getDosage(), i.getFrequency(), i.getDurationDays()))
                        .toList();

        return new PrescriptionDTO(
                p.getId(),
                p.getAppointment().getId(),
                p.getGeneralInstructions(),
                p.getCreatedAt(),
                itemDTOs
        );
    }
}
