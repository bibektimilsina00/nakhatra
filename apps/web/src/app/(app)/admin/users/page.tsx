import { AdminUsers } from "@/features/admin/components/admin-users";

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <AdminUsers />;
}
