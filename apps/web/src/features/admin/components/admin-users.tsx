"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import { useAdminUsers, useUpdateUserRole } from "@/features/admin/hooks/use-admin";
import type { AdminUserItem } from "@/features/admin/types";
import { ApiError } from "@/lib/api/errors";

export function AdminUsers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminUsers(page, search);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 pt-10 pb-24 sm:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">
            Users
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage roles and view user activity.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-md border border-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong bg-cream/50">
                <th className="px-4 py-3 font-medium text-ink">Email</th>
                <th className="px-4 py-3 font-medium text-ink">Role</th>
                <th className="px-4 py-3 font-medium text-ink">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-ink">Kundalis</th>
                <th className="px-4 py-3 text-right font-medium text-ink">Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-strong">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : isError || !data ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-danger">
                    Failed to load users.
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                data.items.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-line-strong bg-cream/50 px-4 py-3">
            <span className="text-xs text-muted">
              Showing {(data.page - 1) * data.limit + 1} to{" "}
              {Math.min(data.page * data.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-line-strong px-3 py-1 text-xs font-medium text-ink hover:bg-cream disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={data.page * data.limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-line-strong px-3 py-1 text-xs font-medium text-ink hover:bg-cream disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function UserRow({ user }: { user: AdminUserItem }) {
  const { mutate, isPending } = useUpdateUserRole();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setErrorMsg(null);
    const newRole = e.target.value;
    mutate(
      { userId: user.id, role: newRole },
      {
        onError: (err: Error) => {
          if (err instanceof ApiError) {
            setErrorMsg(err.message);
          } else {
            setErrorMsg("An unexpected error occurred.");
          }
        },
      }
    );
  };

  const date = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <tr className="hover:bg-cream/30 transition-colors">
      <td className="px-4 py-3 text-ink">
        {user.email}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col items-start gap-1">
          <select
            value={user.role}
            onChange={handleRoleChange}
            disabled={isPending}
            className="rounded-md border border-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          >
            <option value="seeker">Seeker</option>
            <option value="practitioner">Practitioner</option>
            <option value="admin">Admin</option>
          </select>
          {errorMsg && (
            <span className="max-w-[150px] whitespace-normal text-2xs text-danger">
              {errorMsg}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted align-top">{date}</td>
      <td className="px-4 py-3 text-right text-muted align-top">{user.kundali_count}</td>
      <td className="px-4 py-3 text-right text-muted align-top">{user.chat_session_count}</td>
    </tr>
  );
}
