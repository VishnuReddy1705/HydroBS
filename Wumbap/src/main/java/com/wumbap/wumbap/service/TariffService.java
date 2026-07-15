package com.wumbap.wumbap.service;

import com.wumbap.wumbap.dto.TariffRequest;
import com.wumbap.wumbap.dto.TariffResponse;
import com.wumbap.wumbap.dto.TariffSlabDto;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Tariff;
import com.wumbap.wumbap.entity.TariffSlab;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.TariffRepository;
import com.wumbap.wumbap.repository.TariffSlabRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TariffService {

    private final TariffRepository tariffRepository;
    private final TariffSlabRepository tariffSlabRepository;
    private final CommunityRepository communityRepository;

    @Transactional(readOnly = true)
    public List<TariffResponse> getTariffsByCommunity(Long communityId) {
        return tariffRepository.findByCommunityId(communityId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TariffResponse> getActiveTariffByCommunity(Long communityId) {
        return tariffRepository.findByCommunityIdAndIsActiveTrue(communityId)
                .map(this::mapToResponse);
    }

    @Transactional
    public TariffResponse createTariff(Long communityId, TariffRequest request) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new IllegalArgumentException("Community not found with ID: " + communityId));

        // If this tariff is set to active, deactivate all other tariffs in this community
        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateAllTariffsForCommunity(communityId);
        }

        Tariff tariff = Tariff.builder()
                .community(community)
                .name(request.getName())
                .model(request.getModel())
                .baseCharge(request.getBaseCharge())
                .unitPrice(request.getUnitPrice())
                .minimumCharge(request.getMinimumCharge())
                .serviceCharge(request.getServiceCharge())
                .maintenanceCharge(request.getMaintenanceCharge())
                .sewageCharge(request.getSewageCharge())
                .taxPercentage(request.getTaxPercentage())
                .lateFee(request.getLateFee())
                .penalty(request.getPenalty())
                .discount(request.getDiscount())
                .subsidy(request.getSubsidy())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .billingCycle(request.getBillingCycle() != null ? request.getBillingCycle() : "MONTHLY")
                .dueDays(request.getDueDays() != null ? request.getDueDays() : 15)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .fallbackMethod(request.getFallbackMethod() != null ? request.getFallbackMethod() : "OCCUPANCY")
                .sharedAreaPercentage(request.getSharedAreaPercentage() != null ? request.getSharedAreaPercentage() : new BigDecimal("10.00"))
                .build();

        Tariff savedTariff = tariffRepository.save(tariff);

        if (request.getSlabs() != null && !request.getSlabs().isEmpty()) {
            List<TariffSlab> slabs = request.getSlabs().stream()
                    .map(slabDto -> TariffSlab.builder()
                            .tariff(savedTariff)
                            .rangeStart(slabDto.getRangeStart())
                            .rangeEnd(slabDto.getRangeEnd())
                            .ratePerUnit(slabDto.getRatePerUnit())
                            .build())
                    .collect(Collectors.toList());
            tariffSlabRepository.saveAll(slabs);
            savedTariff.setSlabs(slabs);
        }

        log.info("Created new tariff: {} for community: {}", savedTariff.getName(), community.getName());
        return mapToResponse(savedTariff);
    }

    @Transactional
    public TariffResponse updateTariff(Long communityId, Long tariffId, TariffRequest request) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found with ID: " + tariffId));

        if (!tariff.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Tariff does not belong to this community");
        }

        if (Boolean.TRUE.equals(request.getIsActive()) && !Boolean.TRUE.equals(tariff.getIsActive())) {
            deactivateAllTariffsForCommunity(communityId);
        }

        tariff.setName(request.getName());
        tariff.setModel(request.getModel());
        tariff.setBaseCharge(request.getBaseCharge());
        tariff.setUnitPrice(request.getUnitPrice());
        tariff.setMinimumCharge(request.getMinimumCharge());
        tariff.setServiceCharge(request.getServiceCharge());
        tariff.setMaintenanceCharge(request.getMaintenanceCharge());
        tariff.setSewageCharge(request.getSewageCharge());
        tariff.setTaxPercentage(request.getTaxPercentage());
        tariff.setLateFee(request.getLateFee());
        tariff.setPenalty(request.getPenalty());
        tariff.setDiscount(request.getDiscount());
        tariff.setSubsidy(request.getSubsidy());
        tariff.setCurrency(request.getCurrency());
        tariff.setBillingCycle(request.getBillingCycle());
        tariff.setDueDays(request.getDueDays());
        tariff.setIsActive(request.getIsActive());
        if (request.getFallbackMethod() != null) tariff.setFallbackMethod(request.getFallbackMethod());
        if (request.getSharedAreaPercentage() != null) tariff.setSharedAreaPercentage(request.getSharedAreaPercentage());

        // Update slabs: clear old, insert new
        tariffSlabRepository.deleteAll(tariff.getSlabs());
        tariff.getSlabs().clear();

        if (request.getSlabs() != null && !request.getSlabs().isEmpty()) {
            List<TariffSlab> slabs = request.getSlabs().stream()
                    .map(slabDto -> TariffSlab.builder()
                            .tariff(tariff)
                            .rangeStart(slabDto.getRangeStart())
                            .rangeEnd(slabDto.getRangeEnd())
                            .ratePerUnit(slabDto.getRatePerUnit())
                            .build())
                    .collect(Collectors.toList());
            tariffSlabRepository.saveAll(slabs);
            tariff.setSlabs(slabs);
        }

        Tariff updatedTariff = tariffRepository.save(tariff);
        log.info("Updated tariff: {} for community ID: {}", updatedTariff.getName(), communityId);
        return mapToResponse(updatedTariff);
    }

    @Transactional
    public void deleteTariff(Long communityId, Long tariffId) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found with ID: " + tariffId));

        if (!tariff.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("Tariff does not belong to this community");
        }

        tariffRepository.delete(tariff);
        log.info("Deleted tariff ID: {}", tariffId);
    }

    private void deactivateAllTariffsForCommunity(Long communityId) {
        List<Tariff> tariffs = tariffRepository.findByCommunityId(communityId);
        for (Tariff t : tariffs) {
            t.setIsActive(false);
        }
        tariffRepository.saveAll(tariffs);
    }

    private TariffResponse mapToResponse(Tariff tariff) {
        List<TariffSlabDto> slabDtos = new ArrayList<>();
        if (tariff.getSlabs() != null) {
            slabDtos = tariff.getSlabs().stream()
                    .map(slab -> TariffSlabDto.builder()
                            .id(slab.getId())
                            .rangeStart(slab.getRangeStart())
                            .rangeEnd(slab.getRangeEnd())
                            .ratePerUnit(slab.getRatePerUnit())
                            .build())
                    .collect(Collectors.toList());
        }

        return TariffResponse.builder()
                .id(tariff.getId())
                .communityId(tariff.getCommunity().getId())
                .communityName(tariff.getCommunity().getName())
                .name(tariff.getName())
                .model(tariff.getModel())
                .baseCharge(tariff.getBaseCharge())
                .unitPrice(tariff.getUnitPrice())
                .minimumCharge(tariff.getMinimumCharge())
                .serviceCharge(tariff.getServiceCharge())
                .maintenanceCharge(tariff.getMaintenanceCharge())
                .sewageCharge(tariff.getSewageCharge())
                .taxPercentage(tariff.getTaxPercentage())
                .lateFee(tariff.getLateFee())
                .penalty(tariff.getPenalty())
                .discount(tariff.getDiscount())
                .subsidy(tariff.getSubsidy())
                .currency(tariff.getCurrency())
                .billingCycle(tariff.getBillingCycle())
                .dueDays(tariff.getDueDays())
                .isActive(tariff.getIsActive())
                .fallbackMethod(tariff.getFallbackMethod())
                .sharedAreaPercentage(tariff.getSharedAreaPercentage())
                .slabs(slabDtos)
                .build();
    }
}
