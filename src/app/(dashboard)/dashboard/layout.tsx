import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getCurrentSession } from "@/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=%2Fdashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <DashboardHeader email={session.user.email} />
      {children}
    </div>
  );
}
