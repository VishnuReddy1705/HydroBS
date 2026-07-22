import { api } from "@/lib/axios";

export interface PaymentResponse {
  id: number;
  billId: number;
  billNumber: string;
  residentName: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
  paidAt: string;
  receiptNumber: string;
  notes: string;
}

export interface RefundResponse {
  id: number;
  refundNumber: string;
  paymentId: number;
  billId: number;
  billNumber: string;
  residentName: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
}

export const paymentService = {
  createOrder: async (billId: number): Promise<any> => {
    const res = await api.post("/api/payments/create-order", { billId });
    return res.data;
  },

  verifyPayment: async (payload: {
    billId: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    signature?: string;
    status: string;
  }): Promise<PaymentResponse> => {
    const res = await api.post("/api/payments/verify", payload);
    return res.data;
  },

  recordOfflinePayment: async (payload: {
    billId: number;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  }): Promise<PaymentResponse> => {
    const res = await api.post("/api/payments/record-offline", payload);
    return res.data;
  },

  reversePayment: async (id: number, reason: string): Promise<any> => {
    const res = await api.post(`/api/payments/${id}/reverse`, { reason });
    return res.data;
  },

  getOutstanding: async (billId: number): Promise<{ billId: number; outstanding: number }> => {
    const res = await api.get(`/api/payments/outstanding/${billId}`);
    return res.data;
  },

  getPaymentHistory: async (page: number = 0, size: number = 10): Promise<{
    content: PaymentResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
  }> => {
    const res = await api.get("/api/payments/history", { params: { page, size } });
    return res.data;
  },

  initiateRefund: async (payload: {
    paymentId: number;
    amount: number;
    reason: string;
  }): Promise<RefundResponse> => {
    const res = await api.post("/api/refunds", payload);
    return res.data;
  },

  approveRefund: async (id: number): Promise<RefundResponse> => {
    const res = await api.post(`/api/refunds/${id}/approve`);
    return res.data;
  },

  rejectRefund: async (id: number, reason: string): Promise<RefundResponse> => {
    const res = await api.post(`/api/refunds/${id}/reject`, { reason });
    return res.data;
  },

  getRefunds: async (page: number = 0, size: number = 10): Promise<{
    content: RefundResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
  }> => {
    const res = await api.get("/api/refunds", { params: { page, size } });
    return res.data;
  },

  downloadReceiptUrl: (paymentId: number, token?: string): string => {
    const baseURL = api.defaults.baseURL || "";
    return `${baseURL}/api/payments/${paymentId}/receipt?token=${token || ""}`;
  }
};
