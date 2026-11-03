package com.tcet.hms.modeldto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionDTO {
    private Long id;
    private Long appointmentId;
    private String generalInstructions;
    private LocalDateTime createdAt;
    private List<PrescriptionItemDTO> items;
}
