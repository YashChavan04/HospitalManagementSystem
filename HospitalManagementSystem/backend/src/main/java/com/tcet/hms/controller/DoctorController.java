package com.tcet.hms.controller;

import com.tcet.hms.modeldto.DoctorDTO;
import com.tcet.hms.modeldto.DoctorRequestDTO;
import com.tcet.hms.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping
    public ResponseEntity<DoctorDTO> create(@Valid @RequestBody DoctorRequestDTO request) {
        return ResponseEntity.ok(doctorService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<DoctorDTO>> getAll(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String specialization) {

        if (departmentId != null) {
            return ResponseEntity.ok(doctorService.getByDepartment(departmentId));
        }
        if (specialization != null && !specialization.isBlank()) {
            return ResponseEntity.ok(doctorService.searchBySpecialization(specialization));
        }
        return ResponseEntity.ok(doctorService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DoctorDTO> update(
            @PathVariable Long id, @Valid @RequestBody DoctorRequestDTO request) {
        return ResponseEntity.ok(doctorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        doctorService.delete(id);
        return ResponseEntity.ok("Doctor deleted successfully");
    }
}
