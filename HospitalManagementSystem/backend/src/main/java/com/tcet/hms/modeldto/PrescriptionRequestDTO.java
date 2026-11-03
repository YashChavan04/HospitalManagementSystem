package com.tcet.hms.modeldto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionRequestDTO {

    private String generalInstructions;

    @Valid
    private List<Item> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Item {

        @NotBlank(message = "Medicine name is required")
        private String medicineName;

        private String dosage;

        private String frequency;

        private Integer durationDays;
    }
}
