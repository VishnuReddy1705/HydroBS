import { api } from "./axios"

export interface CommunitySummary { id: number; name: string }
export interface JoinRequestResponse {
  id: number; userId: number; userFullName: string; userEmail: string; flatNumber: string; requestedAt: string
}
export interface MyJoinRequestResponse {
  id: number; communityId: number; communityName: string; status: "PENDING" | "APPROVED" | "REJECTED"
}
export interface MeResponse {
  fullName: string; email: string; role: string; communityId: number | null; communityName: string | null
}

export const getMe = () => api.get<MeResponse>("/api/users/me").then(r => r.data)
export const searchCommunities = (search: string) =>
  api.get<CommunitySummary[]>("/api/communities/public", { params: { search } }).then(r => r.data)
export const sendJoinRequest = (communityId: number) =>
  api.post(`/api/communities/${communityId}/join-requests`)
export const getMyRequests = () =>
  api.get<MyJoinRequestResponse[]>("/api/communities/my-requests").then(r => r.data)
export const getPendingRequests = () =>
  api.get<JoinRequestResponse[]>("/api/communities/join-requests/pending").then(r => r.data)
export const approveRequest = (requestId: number) =>
  api.post(`/api/communities/join-requests/${requestId}/approve`)
export const rejectRequest = (requestId: number) =>
  api.post(`/api/communities/join-requests/${requestId}/reject`)