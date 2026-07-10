import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const data = [
  { day: "Mon", usage: 5800 },
  { day: "Tue", usage: 6200 },
  { day: "Wed", usage: 6100 },
  { day: "Thu", usage: 7200 },
  { day: "Fri", usage: 6900 },
  { day: "Sat", usage: 8100 },
  { day: "Sun", usage: 7900 },
]

export default function UsageChart() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">

          Weekly Water Consumption

        </h2>

        <p className="mt-1 text-sm text-slate-500">

          Total community usage

        </p>

      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={data}>

            <defs>

              <linearGradient
                id="usageGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#2563eb"
                  stopOpacity={0.45}
                />

                <stop
                  offset="95%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="usage"
              stroke="#2563eb"
              fill="url(#usageGradient)"
              strokeWidth={4}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}