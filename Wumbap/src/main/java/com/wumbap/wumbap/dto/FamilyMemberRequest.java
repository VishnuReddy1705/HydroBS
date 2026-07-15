package com.wumbap.wumbap.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberRequest {
    private String name;
    private String relationship;
    private Integer age;
    private String contactNumber;
    private String status;
}
