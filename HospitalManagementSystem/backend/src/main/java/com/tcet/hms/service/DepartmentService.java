package com.tcet.hms.service;

import com.tcet.hms.exception.DuplicateResourceException;
import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Department;
import com.tcet.hms.modeldto.DepartmentDTO;
import com.tcet.hms.modeldto.DepartmentRequestDTO;
import com.tcet.hms.repositorys.DepartmentRepository;
import com.tcet.hms.repositorys.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;

    public DepartmentDTO create(DepartmentRequestDTO request) {

        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException(
                    "Department '" + request.getName() + "' already exists");
        }

        Department department = new Department();
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setLocation(request.getLocation());

        return toDTO(departmentRepository.save(department));
    }

    public List<DepartmentDTO> getAll() {
        return departmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public DepartmentDTO getById(Long id) {
        Department department = findEntity(id);
        return toDTO(department);
    }

    public DepartmentDTO update(Long id, DepartmentRequestDTO request) {

        Department department = findEntity(id);
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setLocation(request.getLocation());

        return toDTO(departmentRepository.save(department));
    }

    public void delete(Long id) {
        Department department = findEntity(id);
        departmentRepository.delete(department);
    }

    private Department findEntity(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + id));
    }

    private DepartmentDTO toDTO(Department department) {
        long doctorCount = doctorRepository.findByDepartmentId(department.getId()).size();
        return new DepartmentDTO(
                department.getId(),
                department.getName(),
                department.getDescription(),
                department.getLocation(),
                doctorCount
        );
    }
}
