export function DotGridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.18),transparent_55%)]" />
      <div className="absolute -inset-[10%] [animation:grid-drift_46s_linear_infinite] [background-image:radial-gradient(rgba(52,211,153,0.5)_1px,transparent_1.6px)] [background-size:24px_24px]" />
    </div>
  )
}
