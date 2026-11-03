package com.tcet.hms.modeldto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sent back to the frontend after a successful login so it can store
 * the token AND immediately know the user's role (to show/hide UI)
 * without decoding the JWT on the client.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String username;
    private String role;
    private Long doctorId;
}
