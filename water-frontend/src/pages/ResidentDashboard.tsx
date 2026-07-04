import { useEffect, useState } from "react"
import { getName, clearSession } from "@/lib/auth"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import {
  getMe, getMyRequests, searchCommunities, sendJoinRequest,
  type MeResponse, type MyJoinRequestResponse, type CommunitySummary,
} from "@/lib/community"

export default function ResidentDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [myRequests, setMyRequests] = useState<MyJoinRequestResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<CommunitySummary[]>([])
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [notice, setNotice] = useState("")

  const loadStatus = async () => {
    const [meData, requests] = await Promise.all([getMe(), getMyRequests()])
    setMe(meData)
    setMyRequests(requests)
    setLoading(false)
  }

  useEffect(() => { loadStatus() }, [])

  const handleSearch = async () => setResults(await searchCommunities(searchTerm))

  const handleSend = async (communityId: number) => {
    setSendingId(communityId)
    try {
      await sendJoinRequest(communityId)
      setNotice("Request sent — waiting for the community admin to approve.")
      await loadStatus()
    } catch (err: any) {
      setNotice(err.response?.data ?? "Could not send request")
    } finally {
      setSendingId(null)
    }
  }

  const wrapper = "min-h-screen bg-gradient-to-br from-blue-700 to-cyan-400 text-white px-4 py-10 flex flex-col items-center"

  if (loading) return <div className={`${wrapper} justify-center`}><Loader2 className="h-6 w-6 animate-spin" /></div>

  if (me?.communityId) {
    return (
      <div className={`${wrapper} justify-center text-center`}>
        <h1 className="text-3xl font-semibold mb-2">Welcome, {getName()} 👋</h1>
        <p className="text-white/80 mb-1">You're part of {me.communityName}</p>
        <p className="text-white/60 text-sm mb-6 max-w-sm">Your monthly and overall usage stats arrive in the next milestone.</p>
        <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={() => { clearSession(); navigate("/login") }}>Logout</Button>
      </div>
    )
  }

  const pending = myRequests.find(r => r.status === "PENDING")
  if (pending) {
    return (
      <div className={`${wrapper} justify-center text-center`}>
        <h1 className="text-3xl font-semibold mb-2">Welcome, {getName()} 👋</h1>
        <p className="text-white/80 mb-6">Waiting for approval from <span className="font-medium">{pending.communityName}</span>...</p>
        <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10"
          onClick={() => { clearSession(); navigate("/login") }}>Logout</Button>
      </div>
    )
  }

  return (
    <div className={wrapper}>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-1 text-center">Welcome, {getName()} 👋</h1>
        <p className="text-white/70 text-sm text-center mb-6">Find and join your apartment community</p>

        <div className="flex gap-2 mb-4">
          <Input placeholder="Search community name..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
          <Button onClick={handleSearch} className="bg-white text-blue-700 hover:bg-white/90 shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {notice && <p className="text-xs text-center text-white/90 mb-4">{notice}</p>}

        <div className="space-y-2">
          {results.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/30 bg-white/10 px-4 py-3">
              <span>{c.name}</span>
              <Button size="sm" disabled={sendingId === c.id} onClick={() => handleSend(c.id)}
                className="bg-white text-blue-700 hover:bg-white/90">
                {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request"}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10"
            onClick={() => { clearSession(); navigate("/login") }}>Logout</Button>
        </div>
      </div>
    </div>
  )
}