package com.tcet.hms.controller;

import com.tcet.hms.modeldto.DepartmentDTO;
import com.tcet.hms.modeldto.DepartmentRequestDTO;
import com.tcet.hms.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentDTO> create(@Valid @RequestBody DepartmentRequestDTO request) {
        return ResponseEntity.ok(departmentService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getAll() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentDTO> update(
            @PathVariable Long id, @Valid @RequestBody DepartmentRequestDTO request) {
        return ResponseEntity.ok(departmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok("Department deleted successfully");
    }
}
