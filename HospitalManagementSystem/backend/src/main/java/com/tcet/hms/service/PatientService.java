package com.tcet.hms.service;

import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Patient;
import com.tcet.hms.modeldto.PatientDTO;
import com.tcet.hms.modeldto.PatientRequestDTO;
import com.tcet.hms.repositorys.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientDTO create(PatientRequestDTO request) {
        Patient patient = new Patient();
        applyRequest(patient, request);
        return toDTO(patientRepository.save(patient));
    }

    public List<PatientDTO> getAll() {
        return patientRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<PatientDTO> searchByName(String name) {
        return patientRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public PatientDTO getById(Long id) {
        return toDTO(findEntity(id));
    }

    public PatientDTO update(Long id, PatientRequestDTO request) {
        Patient patient = findEntity(id);
        applyRequest(patient, request);
        return toDTO(patientRepository.save(patient));
    }

    public void delete(Long id) {
        Patient patient = findEntity(id);
        patientRepository.delete(patient);
    }

    private void applyRequest(Patient patient, PatientRequestDTO request) {
        patient.setName(request.getName());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setBloodGroup(request.getBloodGroup());
    }

    private Patient findEntity(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with id: " + id));
    }

    private PatientDTO toDTO(Patient patient) {
        return new PatientDTO(
                patient.getId(),
                patient.getName(),
                patient.getEmail(),
                patient.getPhone(),
                patient.getAge(),
                patient.getGender(),
                patient.getAddress(),
                patient.getBloodGroup()
        );
    }
}
