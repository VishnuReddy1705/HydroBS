import { api } from "@/lib/axios";

export interface ResidentFilterParams {
  communityId?: number | string;
  search?: string;
  building?: string;
  block?: string;
  floor?: string;
  occupancyType?: string;
  isActive?: boolean | string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

export interface ResidentPayload {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  communityId?: number | string;
  building?: string;
  block?: string;
  floor?: string;
  flatNumber: string;
  familySize?: number;
  occupancyType?: string;
  moveInDate?: string;
  meterNumber?: string;
  waterBalance?: number;
  isActive?: boolean;
}

export interface FamilyMemberPayload {
  name: string;
  relationship: string;
  age?: number;
  contactNumber?: string;
  status?: string;
}

export const residentService = {
  // Admin Resident CRUD
  getResidents: async (params: ResidentFilterParams) => {
    const cleanParams: any = { ...params };
    if (cleanParams.isActive === "ALL" || cleanParams.isActive === "") {
      delete cleanParams.isActive;
    }
    if (cleanParams.occupancyType === "ALL" || cleanParams.occupancyType === "") {
      delete cleanParams.occupancyType;
    }
    const res = await api.get("/api/residents", { params: cleanParams });
    return res.data;
  },

  getResidentById: async (id: number | string) => {
    const res = await api.get(`/api/residents/${id}`);
    return res.data;
  },

  registerResident: async (payload: ResidentPayload) => {
    const res = await api.post("/api/residents", payload);
    return res.data;
  },

  editResident: async (id: number | string, payload: ResidentPayload) => {
    const res = await api.put(`/api/residents/${id}`, payload);
    return res.data;
  },

  toggleResidentStatus: async (id: number | string, active: boolean) => {
    const res = await api.post(`/api/residents/${id}/status?active=${active}`);
    return res.data;
  },

  transferResident: async (id: number | string, params: { communityId?: number | string; flatNumber: string; building?: string; block?: string; floor?: string }) => {
    const query = new URLSearchParams();
    if (params.communityId) query.set("communityId", params.communityId.toString());
    query.set("flatNumber", params.flatNumber);
    if (params.building) query.set("building", params.building);
    if (params.block) query.set("block", params.block);
    if (params.floor) query.set("floor", params.floor);

    const res = await api.post(`/api/residents/${id}/transfer?${query.toString()}`);
    return res.data;
  },

  deleteResident: async (id: number | string, archiveOnly: boolean = false) => {
    const res = await api.delete(`/api/residents/${id}?archiveOnly=${archiveOnly}`);
    return res.data;
  },

  importResidents: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/api/residents/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Resident Profile Operations
  getMyProfile: async () => {
    const res = await api.get("/api/profile/me");
    return res.data;
  },

  getMyFamily: async () => {
    const res = await api.get("/api/profile/family");
    return res.data;
  },

  addFamilyMember: async (payload: FamilyMemberPayload) => {
    const res = await api.post("/api/profile/family", payload);
    return res.data;
  },

  editFamilyMember: async (id: number | string, payload: FamilyMemberPayload) => {
    const res = await api.put(`/api/profile/family/${id}`, payload);
    return res.data;
  },

  removeFamilyMember: async (id: number | string) => {
    const res = await api.delete(`/api/profile/family/${id}`);
    return res.data;
  },

  getMyDocuments: async () => {
    const res = await api.get("/api/profile/documents");
    return res.data;
  },

  uploadDocument: async (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await api.post("/api/profile/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  deleteDocument: async (id: number | string) => {
    const res = await api.delete(`/api/profile/documents/${id}`);
    return res.data;
  },

  getMyTimeline: async () => {
    const res = await api.get("/api/profile/timeline");
    return res.data;
  },
};
