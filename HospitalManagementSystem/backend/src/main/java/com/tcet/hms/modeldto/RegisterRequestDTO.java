package com.tcet.hms.modeldto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequestDTO {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    // ADMIN, DOCTOR, RECEPTIONIST
    @NotBlank
    private String role;

    // Required only when role = DOCTOR: links the login account to an
    // existing Doctor profile so the doctor sees only their own appointments.
    private Long doctorId;
}
