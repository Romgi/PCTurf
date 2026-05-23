import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { normalizeDateKey } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Superintendent Dashboard",
};

type AdminPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const date = normalizeDateKey(params?.date);
  const data = await getDashboardData(date);

  return <AdminDashboard data={data} admin={admin} />;
}
