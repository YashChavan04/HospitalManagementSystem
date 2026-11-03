package com.tcet.hms.controller;

import com.tcet.hms.model.AppointmentStatus;
import com.tcet.hms.modeldto.AppointmentDTO;
import com.tcet.hms.modeldto.AppointmentRequestDTO;
import com.tcet.hms.modeldto.AppointmentStatusUpdateDTO;
import com.tcet.hms.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentDTO> create(@Valid @RequestBody AppointmentRequestDTO request) {
        return ResponseEntity.ok(appointmentService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentDTO>> getAll(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (doctorId != null) {
            return ResponseEntity.ok(appointmentService.getByDoctor(doctorId));
        }
        if (patientId != null) {
            return ResponseEntity.ok(appointmentService.getByPatient(patientId));
        }
        if (status != null) {
            return ResponseEntity.ok(appointmentService.getByStatus(status));
        }
        if (date != null) {
            return ResponseEntity.ok(appointmentService.getByDate(date));
        }
        return ResponseEntity.ok(appointmentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AppointmentDTO> updateStatus(
            @PathVariable Long id, @Valid @RequestBody AppointmentStatusUpdateDTO request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.ok("Appointment deleted successfully");
    }
}
