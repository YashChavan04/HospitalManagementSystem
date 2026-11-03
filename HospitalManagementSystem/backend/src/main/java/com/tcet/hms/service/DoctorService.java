package com.tcet.hms.service;

import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Department;
import com.tcet.hms.model.Doctor;
import com.tcet.hms.modeldto.DoctorDTO;
import com.tcet.hms.modeldto.DoctorRequestDTO;
import com.tcet.hms.repositorys.DepartmentRepository;
import com.tcet.hms.repositorys.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    public DoctorDTO create(DoctorRequestDTO request) {

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + request.getDepartmentId()));

        Doctor doctor = new Doctor();
        applyRequest(doctor, request, department);

        return toDTO(doctorRepository.save(doctor));
    }

    public List<DoctorDTO> getAll() {
        return doctorRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<DoctorDTO> getByDepartment(Long departmentId) {
        return doctorRepository.findByDepartmentId(departmentId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<DoctorDTO> searchBySpecialization(String specialization) {
        return doctorRepository.findBySpecializationIgnoreCaseContaining(specialization)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public DoctorDTO getById(Long id) {
        return toDTO(findEntity(id));
    }

    public DoctorDTO update(Long id, DoctorRequestDTO request) {

        Doctor doctor = findEntity(id);
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + request.getDepartmentId()));

        applyRequest(doctor, request, department);

        return toDTO(doctorRepository.save(doctor));
    }

    public void delete(Long id) {
        Doctor doctor = findEntity(id);
        doctorRepository.delete(doctor);
    }

    private void applyRequest(Doctor doctor, DoctorRequestDTO request, Department department) {
        doctor.setName(request.getName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setDepartment(department);
    }

    private Doctor findEntity(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor not found with id: " + id));
    }

    private DoctorDTO toDTO(Doctor doctor) {
        return new DoctorDTO(
                doctor.getId(),
                doctor.getName(),
                doctor.getEmail(),
                doctor.getPhone(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getConsultationFee(),
                doctor.getDepartment() != null ? doctor.getDepartment().getId() : null,
                doctor.getDepartment() != null ? doctor.getDepartment().getName() : null
        );
    }
}
