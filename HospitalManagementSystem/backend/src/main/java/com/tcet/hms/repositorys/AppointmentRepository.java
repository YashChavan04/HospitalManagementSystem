package com.tcet.hms.repositorys;

import com.tcet.hms.model.Appointment;
import com.tcet.hms.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByAppointmentDate(LocalDate date);

    long countByAppointmentDate(LocalDate date);

    long countByStatus(AppointmentStatus status);

    // Used to detect double-booking: same doctor, same date & time,
    // excluding cancelled appointments.
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime, AppointmentStatus status);
}
