import { api } from "@/lib/axios"

export interface CommunityDashboardResponse {
  communityName: string
  residentCount: number
  pendingRequests: number
  todayUsage: number
  monthlyUsage: number
  currentCycle: string
}

export async function getCommunityDashboard() {
  const response = await api.get<CommunityDashboardResponse>(
    "/api/dashboard/community"
  )

  return response.data
}