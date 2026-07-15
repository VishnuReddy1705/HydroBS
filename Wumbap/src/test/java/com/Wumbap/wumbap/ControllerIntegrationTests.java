package com.wumbap.wumbap;

import com.wumbap.wumbap.controller.BillingCycleController;
import com.wumbap.wumbap.controller.BulkWaterPurchaseController;
import com.wumbap.wumbap.entity.BillingCycle;
import com.wumbap.wumbap.entity.BulkWaterPurchase;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.BillingCycleRepository;
import com.wumbap.wumbap.repository.BulkWaterPurchaseRepository;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ControllerIntegrationTests {

    private MockMvc billingCycleMockMvc;
    private MockMvc bulkPurchaseMockMvc;

    @Mock
    private BillingCycleRepository billingCycleRepository;
    @Mock
    private CommunityRepository communityRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private BulkWaterPurchaseRepository bulkWaterPurchaseRepository;

    @InjectMocks
    private BillingCycleController billingCycleController;

    @InjectMocks
    private BulkWaterPurchaseController bulkWaterPurchaseController;

    private UsernamePasswordAuthenticationToken principal;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        billingCycleMockMvc = MockMvcBuilders.standaloneSetup(billingCycleController).build();
        bulkPurchaseMockMvc = MockMvcBuilders.standaloneSetup(bulkWaterPurchaseController).build();

        // Setup mock authentication
        User caller = User.builder()
                .id(100L)
                .email("admin@hydrobs.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .community(Community.builder().id(1L).name("Test Comm").build())
                .build();
        when(userRepository.findByEmail("admin@hydrobs.com")).thenReturn(Optional.of(caller));

        principal = new UsernamePasswordAuthenticationToken("admin@hydrobs.com", "password", Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(principal);
    }

    @Test
    public void testCreateBillingCycle() throws Exception {
        // Arrange
        String json = "{\"communityId\":1,\"name\":\"July 2026 Cycle\",\"startDate\":\"2026-07-01\",\"endDate\":\"2026-07-31\"}";

        Community community = Community.builder().id(1L).name("Test Comm").build();
        when(communityRepository.findById(1L)).thenReturn(Optional.of(community));

        // Act & Assert
        billingCycleMockMvc.perform(post("/api/billing-cycles")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("July 2026 Cycle"))
                .andExpect(jsonPath("$.status").value("OPEN"));

        verify(billingCycleRepository, times(1)).save(any(BillingCycle.class));
    }

    @Test
    public void testBillingCycleTransitionStatus() throws Exception {
        // Arrange
        Community community = Community.builder().id(1L).name("Test Comm").build();
        BillingCycle cycle = BillingCycle.builder()
                .id(1L)
                .community(community)
                .name("July 2026 Cycle")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 31))
                .status("OPEN")
                .build();
        
        when(billingCycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

        // Act & Assert
        billingCycleMockMvc.perform(post("/api/billing-cycles/1/transition")
                        .principal(principal)
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(billingCycleRepository, times(1)).save(cycle);
    }

    @Test
    public void testCreateBulkWaterPurchase() throws Exception {
        // Arrange
        String json = "{\"communityId\":1,\"supplier\":\"Municipal Supply\",\"purchaseDate\":\"2026-07-05\",\"volumeLitres\":5000,\"unitCost\":1.50,\"invoiceReference\":\"INV-BULK-001\",\"remarks\":\"Good quality municipal water\"}";

        Community community = Community.builder().id(1L).name("Test Comm").build();
        when(communityRepository.findById(1L)).thenReturn(Optional.of(community));

        // Act & Assert
        bulkPurchaseMockMvc.perform(post("/api/bulk-purchases")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplier").value("Municipal Supply"))
                .andExpect(jsonPath("$.invoiceReference").value("INV-BULK-001"));

        verify(bulkWaterPurchaseRepository, times(1)).save(any(BulkWaterPurchase.class));
    }
}
