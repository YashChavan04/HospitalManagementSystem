package com.tcet.hms.modeldto;

import com.tcet.hms.model.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentStatusUpdateDTO {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    private String doctorNotes;
}
