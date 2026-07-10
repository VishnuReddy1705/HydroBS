import { useState } from "react"
import { Check, X, Loader2, Mail, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  approveRequest,
  rejectRequest,
  type JoinRequestResponse,
} from "@/lib/community"

interface PendingRequestsProps {
  requests: JoinRequestResponse[]
  refresh: () => Promise<void>
}

export default function PendingRequests({
  requests,
  refresh,
}: PendingRequestsProps) {
  const [actingId, setActingId] = useState<number | null>(null)

  async function handleAction(id: number, approve: boolean) {
    try {
      setActingId(id)

      if (approve) {
        await approveRequest(id)
      } else {
        await rejectRequest(id)
      }

      await refresh()
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-bold text-slate-900">
            Pending Join Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Residents waiting for approval
          </p>

        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {requests.length} Pending
        </span>

      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">

          <p className="font-medium text-slate-700">
            🎉 No Pending Requests
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Everyone has been reviewed.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {requests.map((request) => (

            <div
              key={request.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">

                  {request.userFullName.charAt(0).toUpperCase()}

                </div>

                <div>

                  <h3 className="font-semibold text-slate-900">
                    {request.userFullName}
                  </h3>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                    <Mail className="h-4 w-4" />

                    {request.userEmail}

                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                    <Home className="h-4 w-4" />

                    Flat {request.flatNumber}

                  </div>

                </div>

              </div>

              <div className="flex gap-2">

                <Button
                  disabled={actingId === request.id}
                  onClick={() => handleAction(request.id, true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {actingId === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  disabled={actingId === request.id}
                  variant="outline"
                  onClick={() => handleAction(request.id, false)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  )
}