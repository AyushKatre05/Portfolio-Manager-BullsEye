package com.signalist.stock.dto;

import lombok.Data;

@Data
public class SignUpRequest {
    private String fullName;
    private String email;
    private String password;
    private String country;
    private String investmentGoals;
    private String preferredIndustry;
}
