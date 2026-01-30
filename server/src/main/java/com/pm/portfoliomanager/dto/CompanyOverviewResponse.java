package com.pm.portfoliomanager.dto;

import com.pm.portfoliomanager.model.CompanyOverview;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompanyOverviewResponse {
    private CompanyOverview company;
}
