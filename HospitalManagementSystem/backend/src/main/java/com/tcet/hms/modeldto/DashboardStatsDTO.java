package com.tcet.hms.modeldto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDTO {
    private long totalPatients;
    private long totalDoctors;
    private long totalDepartments;
    private long totalAppointments;
    private long appointmentsToday;
    private Map<String, Long> appointmentsByStatus;

    // ---- analytics additions ----

    // Ordered oldest -> newest, last 7 days including today. Key = "yyyy-MM-dd".
    private Map<String, Long> appointmentsLast7Days;

    // Top 5 doctors by appointment count, busiest first.
    private List<NamedCount> topDoctors;

    // Appointment count per department (via the doctor's department).
    private Map<String, Long> appointmentsByDepartment;

    // Patient gender split.
    private Map<String, Long> patientsByGender;

    // Appointment count per hour of day (0-23), only hours with data included,
    // ordered by hour ascending. Key = hour as a 2-digit string, e.g. "09".
    private Map<String, Long> peakHours;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class NamedCount {
        private String name;
        private long count;
    }
}
