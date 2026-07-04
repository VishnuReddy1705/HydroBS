import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  trend?: "up" | "down" | "neutral"
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-blue-900/20">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            {value}
          </h2>

          {change && (
            <div className="mt-3 flex items-center gap-2">

              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-green-400" />
              )}

              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}

              <span
                className={`text-sm ${
                  trend === "up"
                    ? "text-green-400"
                    : trend === "down"
                    ? "text-red-400"
                    : "text-slate-400"
                }`}
              >
                {change}
              </span>

            </div>
          )}

        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">

          <Icon size={28} />

        </div>

      </div>

    </div>
  )
}