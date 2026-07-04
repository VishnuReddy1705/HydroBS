// src/pages/Placeholder.tsx
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-cyan-400 text-white">
      <p className="text-lg">{title} — coming in the next milestone</p>
    </div>
  )
}