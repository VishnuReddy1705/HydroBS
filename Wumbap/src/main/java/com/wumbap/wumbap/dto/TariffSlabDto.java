package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffSlabDto {
    private Long id;
    private BigDecimal rangeStart;
    private BigDecimal rangeEnd;
    private BigDecimal ratePerUnit;
}
