package com.tcet.hms.modeldto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorRequestDTO {

    @NotBlank(message = "Doctor name is required")
    private String name;

    @Email
    private String email;

    private String phone;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String qualification;

    private Double consultationFee;

    @NotNull(message = "Department id is required")
    private Long departmentId;
}
