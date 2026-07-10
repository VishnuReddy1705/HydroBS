import {
  Upload,
  Users,
  FileText,
  Receipt,
  ArrowRight,
} from "lucide-react"
import { motion } from "framer-motion"

const actions = [
  {
    title: "Upload Water Data",
    description: "Import today's CSV / Excel",
    icon: Upload,
    color: "bg-blue-600",
  },
  {
    title: "Manage Residents",
    description: "Approve or manage residents",
    icon: Users,
    color: "bg-emerald-600",
  },
  {
    title: "Generate Bills",
    description: "Create monthly bills",
    icon: Receipt,
    color: "bg-amber-500",
  },
  {
    title: "Export Reports",
    description: "Download reports",
    icon: FileText,
    color: "bg-violet-600",
  },
]

export default function QuickActions() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">

          Quick Actions

        </h2>

        <p className="mt-1 text-sm text-slate-500">

          Frequently used shortcuts

        </p>

      </div>

      <div className="grid gap-4">

        {actions.map((action) => {
          const Icon = action.icon

          return (
            <motion.button
              key={action.title}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div>

                  <h3 className="font-semibold text-slate-900">

                    {action.title}

                  </h3>

                  <p className="text-sm text-slate-500">

                    {action.description}

                  </p>

                </div>

              </div>

              <ArrowRight className="h-5 w-5 text-slate-400" />

            </motion.button>
          )
        })}

      </div>

    </div>
  )
}