package com.tcet.hms.service;

import com.tcet.hms.exception.AppointmentConflictException;
import com.tcet.hms.exception.ResourceNotFoundException;
import com.tcet.hms.model.Appointment;
import com.tcet.hms.model.AppointmentPriority;
import com.tcet.hms.model.AppointmentStatus;
import com.tcet.hms.model.Doctor;
import com.tcet.hms.model.Patient;
import com.tcet.hms.modeldto.AppointmentDTO;
import com.tcet.hms.modeldto.AppointmentRequestDTO;
import com.tcet.hms.modeldto.AppointmentStatusUpdateDTO;
import com.tcet.hms.repositorys.AppointmentRepository;
import com.tcet.hms.repositorys.DoctorRepository;
import com.tcet.hms.repositorys.PatientRepository;
import com.tcet.hms.repositorys.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;

    public AppointmentDTO create(AppointmentRequestDTO request) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with id: " + request.getPatientId()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor not found with id: " + request.getDoctorId()));

        // Business rule: a doctor cannot have two active appointments
        // at the same date & time (prevents double booking).
        boolean clash = appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                        doctor.getId(),
                        request.getAppointmentDate(),
                        request.getAppointmentTime(),
                        AppointmentStatus.CANCELLED);

        if (clash) {
            throw new AppointmentConflictException(
                    "Dr. " + doctor.getName() + " already has an appointment at "
                            + request.getAppointmentTime() + " on " + request.getAppointmentDate());
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setPriority(
                request.getPriority() != null ? request.getPriority() : AppointmentPriority.ROUTINE);

        return toDTO(appointmentRepository.save(appointment));
    }

    public List<AppointmentDTO> getAll() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<AppointmentDTO> getByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<AppointmentDTO> getByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<AppointmentDTO> getByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<AppointmentDTO> getByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public AppointmentDTO getById(Long id) {
        return toDTO(findEntity(id));
    }

    public AppointmentDTO updateStatus(Long id, AppointmentStatusUpdateDTO request) {
        Appointment appointment = findEntity(id);
        appointment.setStatus(request.getStatus());
        if (request.getDoctorNotes() != null) {
            appointment.setDoctorNotes(request.getDoctorNotes());
        }
        return toDTO(appointmentRepository.save(appointment));
    }

    public void delete(Long id) {
        Appointment appointment = findEntity(id);
        appointmentRepository.delete(appointment);
    }

    private Appointment findEntity(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + id));
    }

    private AppointmentDTO toDTO(Appointment a) {
        return new AppointmentDTO(
                a.getId(),
                a.getPatient().getId(),
                a.getPatient().getName(),
                a.getDoctor().getId(),
                a.getDoctor().getName(),
                a.getDoctor().getSpecialization(),
                a.getAppointmentDate(),
                a.getAppointmentTime(),
                a.getReason(),
                a.getStatus(),
                a.getPriority(),
                a.getDoctorNotes(),
                prescriptionRepository.existsByAppointmentId(a.getId())
        );
    }
}
