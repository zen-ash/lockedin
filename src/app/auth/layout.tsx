// Server Component — minimal centered layout for all /auth/* pages.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}
