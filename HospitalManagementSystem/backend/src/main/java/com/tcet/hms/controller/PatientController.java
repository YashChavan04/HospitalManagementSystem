package com.tcet.hms.controller;

import com.tcet.hms.modeldto.MedicalHistoryEntryDTO;
import com.tcet.hms.modeldto.PatientDTO;
import com.tcet.hms.modeldto.PatientRequestDTO;
import com.tcet.hms.service.MedicalHistoryService;
import com.tcet.hms.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final MedicalHistoryService medicalHistoryService;

    @PostMapping
    public ResponseEntity<PatientDTO> create(@Valid @RequestBody PatientRequestDTO request) {
        return ResponseEntity.ok(patientService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<PatientDTO>> getAll(
            @RequestParam(required = false) String name) {

        if (name != null && !name.isBlank()) {
            return ResponseEntity.ok(patientService.searchByName(name));
        }
        return ResponseEntity.ok(patientService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO> update(
            @PathVariable Long id, @Valid @RequestBody PatientRequestDTO request) {
        return ResponseEntity.ok(patientService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.ok("Patient deleted successfully");
    }

    @GetMapping("/{id}/medical-history")
    public ResponseEntity<List<MedicalHistoryEntryDTO>> getMedicalHistory(@PathVariable Long id) {
        return ResponseEntity.ok(medicalHistoryService.getForPatient(id));
    }
}
