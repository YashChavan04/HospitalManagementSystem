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
public class PatientRequestDTO {

    @NotBlank(message = "Patient name is required")
    private String name;

    @Email
    private String email;

    private String phone;

    @NotNull(message = "Age is required")
    private Integer age;

    private String gender;

    private String address;

    private String bloodGroup;
}
