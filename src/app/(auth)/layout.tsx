export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_48%)]"
        aria-hidden="true"
      />
      <div className="relative w-full">{children}</div>
    </main>
  );
}
