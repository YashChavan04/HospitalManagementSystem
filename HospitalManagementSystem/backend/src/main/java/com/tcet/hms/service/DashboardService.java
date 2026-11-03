package com.tcet.hms.service;

import com.tcet.hms.model.Appointment;
import com.tcet.hms.model.AppointmentStatus;
import com.tcet.hms.model.Doctor;
import com.tcet.hms.model.Patient;
import com.tcet.hms.modeldto.DashboardStatsDTO;
import com.tcet.hms.repositorys.AppointmentRepository;
import com.tcet.hms.repositorys.DepartmentRepository;
import com.tcet.hms.repositorys.DoctorRepository;
import com.tcet.hms.repositorys.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;

    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public DashboardStatsDTO getStats() {

        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Patient> allPatients = patientRepository.findAll();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (AppointmentStatus status : AppointmentStatus.values()) {
            byStatus.put(status.name(), appointmentRepository.countByStatus(status));
        }

        return new DashboardStatsDTO(
                allPatients.size(),
                doctorRepository.count(),
                departmentRepository.count(),
                allAppointments.size(),
                appointmentRepository.countByAppointmentDate(LocalDate.now()),
                byStatus,
                appointmentsLast7Days(allAppointments),
                topDoctors(allAppointments),
                appointmentsByDepartment(allAppointments),
                patientsByGender(allPatients),
                peakHours(allAppointments)
        );
    }

    /** Appointment count per day for the last 7 days (including today), oldest first. */
    private Map<String, Long> appointmentsLast7Days(List<Appointment> appointments) {

        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);

        Map<String, Long> counts = new LinkedHashMap<>();
        // Pre-fill every day with 0 so the chart doesn't have gaps.
        for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
            counts.put(d.format(DAY_KEY), 0L);
        }

        for (Appointment a : appointments) {
            LocalDate date = a.getAppointmentDate();
            if (date != null && !date.isBefore(start) && !date.isAfter(today)) {
                String key = date.format(DAY_KEY);
                counts.merge(key, 1L, Long::sum);
            }
        }
        return counts;
    }

    /** Top 5 busiest doctors by total appointment count. */
    private List<DashboardStatsDTO.NamedCount> topDoctors(List<Appointment> appointments) {

        Map<String, Long> countsByDoctor = appointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDoctor().getName(), Collectors.counting()));

        return countsByDoctor.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new DashboardStatsDTO.NamedCount(e.getKey(), e.getValue()))
                .toList();
    }

    /** Appointment count grouped by the doctor's department. */
    private Map<String, Long> appointmentsByDepartment(List<Appointment> appointments) {

        return appointments.stream()
                .map(Appointment::getDoctor)
                .filter(d -> d.getDepartment() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getDepartment().getName(),
                        LinkedHashMap::new,
                        Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));
    }

    private Map<String, Long> patientsByGender(List<Patient> patients) {
        return patients.stream()
                .map(p -> p.getGender() == null || p.getGender().isBlank() ? "Unspecified" : p.getGender())
                .collect(Collectors.groupingBy(g -> g, LinkedHashMap::new, Collectors.counting()));
    }

    /** Appointment count per hour of day (00-23), only hours that have at least one appointment. */
    private Map<String, Long> peakHours(List<Appointment> appointments) {

        return appointments.stream()
                .filter(a -> a.getAppointmentTime() != null)
                .collect(Collectors.groupingBy(
                        a -> String.format("%02d", a.getAppointmentTime().getHour()),
                        Collectors.counting()))
                .entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .collect(Collectors.toMap(
                        Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));
    }
}
