package com.tcet.hms.modeldto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionItemDTO {
    private String medicineName;
    private String dosage;
    private String frequency;
    private Integer durationDays;
}
