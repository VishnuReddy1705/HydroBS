import { useEffect, useState } from "react"
import { getName, clearSession } from "@/lib/auth"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X } from "lucide-react"
import { getPendingRequests, approveRequest, rejectRequest, type JoinRequestResponse } from "@/lib/community"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<JoinRequestResponse[]>([])
  const [actingId, setActingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setRequests(await getPendingRequests())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDecision = async (requestId: number, approve: boolean) => {
    setActingId(requestId)
    try {
      approve ? await approveRequest(requestId) : await rejectRequest(requestId)
      await load()
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-cyan-400 text-white px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-1 text-center">Welcome, {getName()} 👋</h1>
        <p className="text-white/70 text-sm text-center mb-6">Pending residents waiting to join your community</p>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <p className="text-center text-white/70 text-sm">No pending requests right now.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/30 bg-white/10 px-4 py-3">
                <div>
                  <p className="font-medium">{r.userFullName} <span className="text-white/60 text-xs">· Flat {r.flatNumber}</span></p>
                  <p className="text-xs text-white/70">{r.userEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={actingId === r.id} onClick={() => handleDecision(r.id, true)}
                    className="bg-white text-blue-700 hover:bg-white/90"><Check className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" disabled={actingId === r.id} onClick={() => handleDecision(r.id, false)}
                    className="border-white/30 text-white bg-transparent hover:bg-white/10"><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-white/60 text-sm text-center mt-6">Community consumption statistics arrive in the next milestone.</p>
        <div className="text-center mt-6">
          <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10"
            onClick={() => { clearSession(); navigate("/login") }}>Logout</Button>
        </div>
      </div>
    </div>
  )
}