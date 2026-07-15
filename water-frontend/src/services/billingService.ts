import { api } from "@/lib/axios";

export interface TariffSlab {
  id?: number;
  rangeStart: number;
  rangeEnd: number | null;
  ratePerUnit: number;
}

export interface Tariff {
  id?: number;
  communityId?: number;
  communityName?: string;
  name: string;
  model: string; // FIXED, PER_UNIT, SLAB
  baseCharge: number;
  unitPrice: number;
  minimumCharge: number;
  serviceCharge: number;
  maintenanceCharge: number;
  sewageCharge: number;
  taxPercentage: number;
  lateFee: number;
  penalty: number;
  discount: number;
  subsidy: number;
  currency: string;
  billingCycle: string;
  dueDays: number;
  isActive: boolean;
  slabs: TariffSlab[];
}

export interface BillRevision {
  id: number;
  revisionNumber: number;
  amount: number;
  taxAmount: number;
  lateFee: number;
  penalty: number;
  discountAmount: number;
  subsidyAmount: number;
  revisedBy: string;
  reason: string;
  revisedAt: string;
}

export interface Bill {
  id: number;
  billNumber: string;
  invoiceNumber: string;
  billingMonth: string;
  totalUsage: number;
  tariffRate: number;
  taxAmount: number;
  lateFee: number;
  discountAmount: number;
  amount: number;
  status: string; // DRAFT, GENERATED, SENT, VIEWED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
  generatedAt: string;
  dueDate: string;
  paidAt: string | null;
  residentId: number;
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  communityId: number;
  communityName: string;
  building: string;
  block: string;
  floor: string;
  flatNumber: string;
  previousReading: number;
  currentReading: number;
  serviceCharge: number;
  maintenanceCharge: number;
  sewageCharge: number;
  penalty: number;
  subsidyAmount: number;
  tariffModel: string;
  notes: string;
  revisionCount: number;
  generatedBy: string;
  revisions: BillRevision[];
}

export interface BillingCycle {
  id?: number;
  communityId?: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string; // OPEN, ACTIVE, FINALIZED, ARCHIVED
}

export interface BulkWaterPurchase {
  id?: number;
  communityId?: number;
  supplier: string;
  purchaseDate: string;
  volumeLitres: number;
  unitCost: number;
  totalCost: number;
  invoiceReference: string;
  billingCycleId?: number | null;
  billingCycleName?: string;
  remarks?: string;
}

export interface BillGenerationPayload {
  scope: "SINGLE_RESIDENT" | "BUILDING" | "COMMUNITY" | "SYSTEM";
  communityId?: number;
  residentId?: number;
  building?: string;
  billingMonth: string; // yyyy-MM
  notes?: string;
  billingCycleId?: number;
}

export interface BillRevisionPayload {
  reason: string;
  amount?: number;
  taxAmount?: number;
  lateFee?: number;
  penalty?: number;
  discountAmount?: number;
  subsidyAmount?: number;
  serviceCharge?: number;
  maintenanceCharge?: number;
  sewageCharge?: number;
  status?: string;
  notes?: string;
}

export const billingService = {
  // Tariff Configurations
  getTariffs: async (communityId: number): Promise<Tariff[]> => {
    const res = await api.get(`/communities/${communityId}/tariffs`);
    return res.data;
  },

  getActiveTariff: async (communityId: number): Promise<Tariff> => {
    const res = await api.get(`/communities/${communityId}/tariffs/active`);
    return res.data;
  },

  createTariff: async (communityId: number, tariff: Partial<Tariff>): Promise<Tariff> => {
    const res = await api.post(`/communities/${communityId}/tariffs`, tariff);
    return res.data;
  },

  updateTariff: async (communityId: number, tariffId: number, tariff: Partial<Tariff>): Promise<Tariff> => {
    const res = await api.put(`/communities/${communityId}/tariffs/${tariffId}`, tariff);
    return res.data;
  },

  deleteTariff: async (communityId: number, tariffId: number): Promise<void> => {
    await api.delete(`/communities/${communityId}/tariffs/${tariffId}`);
  },

  // Bill Actions
  generateBills: async (payload: BillGenerationPayload): Promise<Bill[]> => {
    const res = await api.post("/billing/generate", payload);
    return res.data;
  },

  reviseBill: async (billId: number, payload: BillRevisionPayload): Promise<Bill> => {
    const res = await api.post(`/billing/${billId}/revise`, payload);
    return res.data;
  },

  getBillDetails: async (billId: number): Promise<Bill> => {
    const res = await api.get(`/billing/${billId}`);
    return res.data;
  },

  searchBills: async (params: {
    communityId?: number;
    residentId?: number;
    billNumber?: string;
    status?: string;
    billingMonth?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: Bill[]; totalElements: number; totalPages: number }> => {
    const res = await api.get("/billing/search", { params });
    return res.data;
  },

  getAnalytics: async (communityId?: number): Promise<any> => {
    const res = await api.get("/billing/analytics", { params: { communityId } });
    return res.data;
  },

  getSuperAdminAnalytics: async (): Promise<any> => {
    const res = await api.get("/billing/super-admin/analytics");
    return res.data;
  },

  downloadPdfUrl: (billId: number): string => {
    const baseURL = api.defaults.baseURL || "";
    return `${baseURL}/billing/${billId}/pdf`;
  },

  triggerEmail: async (billId: number): Promise<void> => {
    await api.post(`/billing/${billId}/email`);
  },

  // Billing Cycle lifecycle actions
  getBillingCycles: async (communityId?: number): Promise<BillingCycle[]> => {
    const res = await api.get("/billing-cycles", { params: { communityId } });
    return res.data;
  },

  createBillingCycle: async (cycle: Partial<BillingCycle>): Promise<BillingCycle> => {
    const res = await api.post("/billing-cycles", cycle);
    return res.data;
  },

  updateBillingCycle: async (id: number, cycle: Partial<BillingCycle>): Promise<BillingCycle> => {
    const res = await api.put(`/billing-cycles/${id}`, cycle);
    return res.data;
  },

  deleteBillingCycle: async (id: number): Promise<void> => {
    await api.delete(`/billing-cycles/${id}`);
  },

  transitionBillingCycle: async (id: number, status: string): Promise<BillingCycle> => {
    const res = await api.post(`/billing-cycles/${id}/transition`, null, { params: { status } });
    return res.data;
  },

  reopenBillingCycle: async (id: number): Promise<BillingCycle> => {
    const res = await api.post(`/billing-cycles/${id}/reopen`);
    return res.data;
  },

  // Bulk Water Purchases API client actions
  getBulkWaterPurchases: async (params: {
    communityId?: number;
    billingCycleId?: number;
    supplier?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: BulkWaterPurchase[]; totalElements: number; totalPages: number }> => {
    const res = await api.get("/bulk-purchases", { params });
    return res.data;
  },

  createBulkWaterPurchase: async (purchase: Partial<BulkWaterPurchase>): Promise<BulkWaterPurchase> => {
    const res = await api.post("/bulk-purchases", purchase);
    return res.data;
  },

  updateBulkWaterPurchase: async (id: number, purchase: Partial<BulkWaterPurchase>): Promise<BulkWaterPurchase> => {
    const res = await api.put(`/bulk-purchases/${id}`, purchase);
    return res.data;
  },

  deleteBulkWaterPurchase: async (id: number): Promise<void> => {
    await api.delete(`/bulk-purchases/${id}`);
  },

  exportBulkWaterPurchasesUrl: (communityId?: number, billingCycleId?: number): string => {
    const baseURL = api.defaults.baseURL || "";
    let url = `${baseURL}/bulk-purchases/export`;
    const params = [];
    if (communityId) params.push(`communityId=${communityId}`);
    if (billingCycleId) params.push(`billingCycleId=${billingCycleId}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }
    return url;
  },

  // Leak Detection API client actions
  getAnomalies: async (communityId?: number): Promise<any[]> => {
    const res = await api.get("/water/anomalies", { params: { communityId } });
    return res.data;
  }
};
