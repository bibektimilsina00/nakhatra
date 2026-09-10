import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <AdminDashboard />;
}
