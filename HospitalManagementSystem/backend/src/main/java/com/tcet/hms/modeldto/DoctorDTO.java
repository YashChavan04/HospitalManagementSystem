package com.tcet.hms.modeldto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String qualification;
    private Double consultationFee;
    private Long departmentId;
    private String departmentName;
}
