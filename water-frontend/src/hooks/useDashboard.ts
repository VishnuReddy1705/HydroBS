import { useQuery } from "@tanstack/react-query"
import { getCommunityDashboard } from "@/services/dashboardService"

export function useDashboard() {
  return useQuery({
    queryKey: ["community-dashboard"],
    queryFn: getCommunityDashboard,
    staleTime: 1000 * 60 * 5,
  })
}