"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { JyotishSection } from "@/features/dashboard/components/jyotish-section";
import { KundaliCard } from "@/features/dashboard/components/kundali-card";
import { useOpenKundali } from "@/features/dashboard/hooks/use-open-kundali";
import { CreateKundaliDialog } from "@/features/kundali/components/create-kundali-dialog";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The signed-in home.
 *
 * Server state comes straight from the vault query (rule 6) — there is no
 * dashboard store, because it would be a second copy of the vault and the two
 * would drift the first time a chart is deleted somewhere else. The chrome and
 * the auth gate live in `AppShell`, shared with every other signed-in page.
 */
export function Dashboard() {
  const { t } = useTranslation();

  const { data: kundalis = [], isLoading } = useSavedKundalis();
  const { open, openingId, failedId } = useOpenKundali();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  // Name, birthplace and date, because those are the three things anyone
  // remembers about a chart they are hunting for.
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return kundalis;
    return kundalis.filter((k) =>
      [k.name, k.place_name, k.dob].some((field) => field.toLowerCase().includes(needle)),
    );
  }, [kundalis, query]);

  return (
    <AppShell search={{ query, onQueryChange: setQuery }}>
      <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
            <section id="kundalis" className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.09] pb-3">
                <h2 className="text-[17px] font-bold text-paper">{t.dashSaved}</h2>
                <div className="flex items-center gap-4">
                  {!isLoading && (
                    <span className="text-[11.5px] text-faint">
                      {query
                        ? t.dashMatches.replace("{n}", String(shown.length))
                        : t.dashSavedCount.replace("{n}", String(kundalis.length))}
                    </span>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[224px] animate-pulse rounded-[10px] border border-white/[0.07] bg-card"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Hidden while searching: a "create" tile is not a result. */}
                  {!query && (
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="group flex min-h-[224px] flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-white/[0.14] transition-colors hover:border-gold/50 hover:bg-card"
                    >
                      <span className="grid size-10 place-items-center rounded-full border border-white/12 text-muted transition-colors group-hover:border-gold/45 group-hover:text-gold">
                        <Plus className="size-4" />
                      </span>
                      <span className="text-[13.5px] font-medium text-muted transition-colors group-hover:text-paper">
                        {t.dashNewKundali}
                      </span>
                    </button>
                  )}

                  {shown.map((k) => (
                    <KundaliCard
                      key={k.id}
                      kundali={k}
                      busy={openingId === k.id}
                      failed={failedId === k.id}
                      onOpen={() => open(k)}
                    />
                  ))}
                </div>
              )}

              {!isLoading && kundalis.length === 0 && (
                <p className="mt-5 max-w-md text-[13.5px] leading-[1.75] text-faint">
                  {t.dashEmptyBody}
                </p>
              )}

              {!isLoading && query && shown.length === 0 && kundalis.length > 0 && (
                <p className="mt-5 text-[13.5px] text-faint">
                  {t.dashNoMatches.replace("{q}", query)}
                </p>
              )}
            </section>

        <JyotishSection />
      </main>

      <CreateKundaliDialog open={creating} onClose={() => setCreating(false)} />
    </AppShell>
  );
}
