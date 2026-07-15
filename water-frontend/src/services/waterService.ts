import { api } from "@/lib/axios";

export interface Meter {
  id: number;
  meterNumber: string;
  qrCode?: string;
  barcode?: string;
  status: string;
  meterType: string;
  installationDate?: string;
  calibrationDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  communityId: number;
  communityName: string;
  residentId?: number;
  residentName?: string;
  flatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeterRequest {
  meterNumber: string;
  qrCode?: string;
  barcode?: string;
  status?: string;
  meterType?: string;
  installationDate?: string;
  calibrationDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  communityId?: number;
  residentId?: number;
}

export interface Reading {
  id: number;
  communityId: number;
  communityName: string;
  residentId: number;
  residentName: string;
  flatNumber: string;
  building?: string;
  block?: string;
  floor?: string;
  meterNumber?: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  usageLitres: number;
  isAnomaly: boolean;
  anomalyType?: string;
  anomalyNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface SearchReadingsParams {
  communityId?: number;
  residentId?: number;
  building?: string;
  flatNumber?: string;
  meterNumber?: string;
  isAnomaly?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface ImportJob {
  id: number;
  originalFilename: string;
  uploadedBy: string;
  uploadStatus: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  uploadStartedAt: string;
  uploadCompletedAt?: string;
  errorMessage?: string;
}

export interface ReadingsAnalytics {
  totalWaterUsed: number;
  anomalyCount: number;
  peakUsage: number;
  minUsage: number;
  weeklyUsageTrend: { name: string; usage: number }[];
  monthlyUsageTrend: { name: string; usage: number }[];
  consumptionByBuilding: { building: string; usage: number }[];
  topConsumers: { flat: string; resident: string; usage: number }[];
}

export const waterService = {
  // Meter Operations
  getMeters: async (status?: string, communityId?: number): Promise<Meter[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (communityId) params.append('communityId', String(communityId));
    const response = await api.get(`/api/meters?${params.toString()}`);
    return response.data;
  },

  getMeterById: async (id: number): Promise<Meter> => {
    const response = await api.get(`/api/meters/${id}`);
    return response.data;
  },

  createMeter: async (data: MeterRequest): Promise<Meter> => {
    const response = await api.post('/api/meters', data);
    return response.data;
  },

  updateMeter: async (id: number, data: MeterRequest): Promise<Meter> => {
    const response = await api.put(`/api/meters/${id}`, data);
    return response.data;
  },

  deleteMeter: async (id: number): Promise<void> => {
    await api.delete(`/api/meters/${id}`);
  },

  assignMeter: async (id: number, residentId?: number): Promise<Meter> => {
    const params = new URLSearchParams();
    if (residentId) params.append('residentId', String(residentId));
    const response = await api.post(`/api/meters/${id}/assign?${params.toString()}`);
    return response.data;
  },

  toggleMeterStatus: async (id: number, status: string): Promise<Meter> => {
    const response = await api.post(`/api/meters/${id}/status?status=${status}`);
    return response.data;
  },

  replaceMeter: async (id: number, newMeterNumber: string): Promise<Meter> => {
    const response = await api.post(`/api/meters/${id}/replace?newMeterNumber=${newMeterNumber}`);
    return response.data;
  },

  // Reading Operations
  searchReadings: async (params: SearchReadingsParams): Promise<{ content: Reading[]; totalElements: number; page: number; size: number }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const response = await api.get(`/api/water/readings/search?${searchParams.toString()}`);
    return response.data;
  },

  getReadingsAnalytics: async (communityId?: number): Promise<ReadingsAnalytics> => {
    const params = new URLSearchParams();
    if (communityId) params.append('communityId', String(communityId));
    const response = await api.get(`/api/water/readings/analytics?${params.toString()}`);
    return response.data;
  },

  getCSVImportJobs: async (communityId?: number): Promise<ImportJob[]> => {
    const params = new URLSearchParams();
    if (communityId) params.append('communityId', String(communityId));
    const response = await api.get(`/api/water/readings/imports?${params.toString()}`);
    return response.data;
  },

  uploadReadings: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/water/upload-readings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  addManualReading: async (data: { flatNumber: string; readingDate: string; usageLitres: number; communityId?: number }): Promise<any> => {
    const response = await api.post('/api/water/readings/manual', data);
    return response.data;
  },
};
