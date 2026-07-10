import { UploadCloud, FileSpreadsheet, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UploadWidget() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">
          Upload Water Data
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Import today's water usage using CSV or Excel
        </p>

      </div>

      {/* Upload Area */}

      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition hover:border-blue-500 hover:bg-blue-50">

        <UploadCloud className="mb-4 h-12 w-12 text-blue-600" />

        <h3 className="text-lg font-semibold text-slate-800">
          Drag & Drop File
        </h3>

        <p className="mt-2 text-center text-sm text-slate-500">
          Upload today's community water readings
        </p>

        <Button className="mt-6 rounded-xl">
          Browse Files
        </Button>

      </div>

      {/* Supported */}

      <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">

        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />

        <div>

          <p className="font-medium text-slate-900">
            Supported Formats
          </p>

          <p className="text-sm text-slate-500">
            .csv &nbsp; • &nbsp; .xlsx
          </p>

        </div>

      </div>

      {/* Last Upload */}

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">

        <Clock className="h-5 w-5 text-amber-500" />

        <div>

          <p className="font-medium text-slate-900">
            Last Upload
          </p>

          <p className="text-sm text-slate-500">
            No uploads yet
          </p>

        </div>

      </div>

    </div>
  )
}