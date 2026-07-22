import { api } from "@/lib/axios";
import { getToken } from "@/lib/auth";

export interface ReportPreviewResponse {
  summary: Record<string, any>;
  headers: string[];
  rows: any[][];
  chartData?: any[];
}

export const reportService = {
  previewReport: async (params: Record<string, any>): Promise<ReportPreviewResponse> => {
    const res = await api.get("/api/reports/preview", { params });
    return res.data;
  },

  downloadReport: (format: "pdf" | "excel" | "csv", params: Record<string, any>): void => {
    const baseURL = api.defaults.baseURL || "";
    const token = getToken();
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParams.append(key, String(val));
      }
    });
    
    if (token) {
      queryParams.append("token", token);
    }
    
    const url = `${baseURL}/api/reports/download/${format}?${queryParams.toString()}`;
    window.open(url, "_blank");
  }
};
