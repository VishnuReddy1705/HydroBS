package com.wumbap.wumbap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tariff_slabs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffSlab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tariff_id")
    @JsonIgnore
    private Tariff tariff;

    @Column(name = "range_start", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal rangeStart = BigDecimal.ZERO;

    @Column(name = "range_end", precision = 12, scale = 2)
    private BigDecimal rangeEnd; // null represents infinity

    @Column(name = "rate_per_unit", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ratePerUnit = BigDecimal.ZERO;
}
