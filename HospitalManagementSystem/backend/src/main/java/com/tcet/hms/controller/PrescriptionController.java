package com.tcet.hms.controller;

import com.tcet.hms.modeldto.PrescriptionDTO;
import com.tcet.hms.modeldto.PrescriptionRequestDTO;
import com.tcet.hms.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments/{appointmentId}/prescription")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<PrescriptionDTO> createOrUpdate(
            @PathVariable Long appointmentId,
            @Valid @RequestBody PrescriptionRequestDTO request) {
        return ResponseEntity.ok(prescriptionService.createOrUpdate(appointmentId, request));
    }

    @GetMapping
    public ResponseEntity<PrescriptionDTO> getByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(prescriptionService.getByAppointment(appointmentId));
    }
}
