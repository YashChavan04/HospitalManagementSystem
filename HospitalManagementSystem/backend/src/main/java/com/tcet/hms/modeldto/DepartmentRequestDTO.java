package com.tcet.hms.modeldto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentRequestDTO {

    @NotBlank(message = "Department name is required")
    private String name;

    private String description;

    private String location;
}
