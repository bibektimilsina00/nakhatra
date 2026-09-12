"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Languages,
  MapPin,
  MessageSquare,
  Star,
  UserPlus,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useRequestConsultation } from "@/features/consultations/hooks/use-consultations";
import { formatMinor } from "@/features/consultations/money";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { BookDialog } from "@/features/practitioners/components/book-dialog";
import {
  usePractitioner,
  usePractitionerReviews,
  usePractitionerStats,
  useReplyToReview,
  useSetFollow,
} from "@/features/practitioners/hooks/use-practitioners";
import type { PractitionerReview } from "@/features/practitioners/types";
import { assetUrl } from "@/lib/api/client";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * One practitioner, in full.
 *
 * Every number on this page is counted from rows that exist: consultations
 * that ended, reviews people wrote, accounts that pressed follow. Nothing is
 * padded to make the profile look established — an unrated practitioner reads
 * as unrated rather than as a 0.0, which would say the opposite of the truth.
 */
export function PractitionerProfile({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const { user } = useSession();

  const profile = usePractitioner(id);
  const userId = profile.data?.user_id;
  const stats = usePractitionerStats(userId);
  const reviews = usePractitionerReviews(userId);
  const follow = useSetFollow(userId ?? "");
  const request = useRequestConsultation();
  const [booking, setBooking] = useState(false);

  const isFollowing = stats.data?.is_following ?? false;
  const isSelf = Boolean(user && userId && user.id === userId);

  // Messaging is a chat consultation, started now. If one is already open with
  // this practitioner the server reuses it rather than opening a second room.
  const message = () =>
    request.mutate(
      { profile_id: id, medium: "chat", opening_message: "", scheduled_at: null, kundali_id: null },
      { onSuccess: (consultation) => router.push(`/consultations/${consultation.id}`) },
    );

  if (profile.isError) {
    return (
      <AppShell sidebar={false}>
        <main className="mx-auto w-full max-w-[820px] px-5 py-20 text-center sm:px-8">
          <p className="text-sm text-dim">{t.profNotFound}</p>
          <Link href="/dashboard#jyotish" className="mt-4 inline-block text-sm text-accent">
            {t.dashNavJyotish}
          </Link>
        </main>
      </AppShell>
    );
  }

  const p = profile.data;

  return (
    <AppShell sidebar={false}>
      <main className="mx-auto w-full max-w-[820px] px-5 pb-28 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          {t.dashNavJyotish}
        </button>

        {!p ? (
          <div className="mt-6 space-y-4">
            <div className="h-[150px] animate-pulse rounded-lg border border-line-strong bg-surface" />
            <div className="h-[220px] animate-pulse rounded-lg border border-line-strong bg-surface" />
          </div>
        ) : (
          <>
            <header className={`mt-5 ${cardClasses()}`}>
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={p.display_name} src={p.photo_url} />
                <div className="min-w-0 flex-1">
                  <h1 className="flex items-center gap-2 text-xl font-bold leading-tight text-ink">
                    <span className="truncate">{p.display_name}</span>
                    {p.verified && (
                      <BadgeCheck className="size-[18px] shrink-0 text-accent" aria-label={t.dashVerified} />
                    )}
                  </h1>
                  {p.headline && <p className="mt-1 text-sm text-muted">{p.headline}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {[p.city, p.country].filter(Boolean).join(", ")}
                    </span>
                    {p.years_experience > 0 && (
                      <span>
                        {p.years_experience} {t.dashYears}
                      </span>
                    )}
                    {p.languages.length > 0 && (
                      <span className="flex items-center gap-1.5 uppercase">
                        <Languages className="size-3.5" />
                        {p.languages.join(" · ")}
                      </span>
                    )}
                  </p>
                </div>

                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => follow.mutate(!isFollowing)}
                    disabled={follow.isPending || !userId}
                    aria-pressed={isFollowing}
                    className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
                      isFollowing
                        ? "border-accent bg-accent-tint text-accent-ink"
                        : "border-line-strong text-ink hover:border-accent"
                    }`}
                  >
                    {isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
                    {isFollowing ? t.profFollowing : t.profFollow}
                  </button>
                )}
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                <RatingStat
                  label={t.profReviews}
                  rating={stats.data?.rating_average ?? null}
                  count={stats.data?.rating_count ?? 0}
                  unrated={t.profUnrated}
                />
                <Stat
                  label={t.profConsultations}
                  value={String(stats.data?.consultations_completed ?? 0)}
                />
                <Stat label={t.profFollowers} value={String(stats.data?.follower_count ?? 0)} />
              </dl>

              {!isSelf && (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={message}
                    disabled={request.isPending}
                    className="flex-1"
                  >
                    <MessageSquare className="size-4" />
                    {t.profMessage}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBooking(true)}
                    className="flex-1"
                  >
                    <CalendarClock className="size-4" />
                    {t.profBook}
                  </Button>
                </div>
              )}
              {request.isError && (
                <p role="alert" className="mt-3 text-xs text-danger">
                  {request.error.message}
                </p>
              )}
            </header>

            {p.bio && (
              <Section title={t.profAbout}>
                <p className="whitespace-pre-wrap text-sm leading-[1.85] text-muted">{p.bio}</p>
              </Section>
            )}

            {(p.specialities.length > 0 || p.traditions.length > 0) && (
              <Section title={t.practTraditions}>
                <div className="flex flex-wrap gap-1.5">
                  {[...p.traditions, ...p.specialities].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-line-strong px-2.5 py-1 text-xs capitalize text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {p.rates.length > 0 && (
              <Section title={t.profRates}>
                <ul className="divide-y divide-line">
                  {p.rates.map((rate) => (
                    <li
                      key={rate.medium}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="capitalize text-ink">{rate.medium}</span>
                      <span className="tabular-nums text-muted">
                        {formatMinor(rate.per_minute_minor, rate.currency)}/{t.consultPerMinute}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title={`${t.profReviews}${reviews.data?.length ? ` (${reviews.data.length})` : ""}`}>
              {reviews.isPending ? (
                <div className="h-16 animate-pulse rounded-md bg-cream" />
              ) : reviews.data && reviews.data.length > 0 ? (
                <ul className="space-y-4">
                  {reviews.data.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      canReply={isSelf}
                      practitionerUserId={userId}
                    />
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted">{t.profNoReviews}</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-xs leading-[1.7] text-dim">
                    {t.profNoReviewsNote}
                  </p>
                </div>
              )}
            </Section>

            {booking && (
              <BookDialog
                profileId={id}
                rates={p.rates}
                onClose={() => setBooking(false)}
                onBooked={(consultationId) => router.push(`/consultations/${consultationId}`)}
              />
            )}
          </>
        )}
      </main>
      <span className={`sr-only ${eyebrow}`} />
    </AppShell>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    // Uploads are served from our own photo route, not a build-time asset
    // next/image can size.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={assetUrl(src)} alt="" className="size-16 shrink-0 rounded-full object-cover" />;
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return (
    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-tint text-lg font-semibold text-accent-ink">
      {initials}
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-[0.12em] text-dim">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-ink">{value}</dd>
      {note && <dd className="text-xs text-dim">{note}</dd>}
    </div>
  );
}

/** The rating stat, shown as the shared rating pill rather than a bare number. */
function RatingStat({
  label,
  rating,
  count,
  unrated,
}: {
  label: string;
  rating: number | null;
  count: number;
  unrated: string;
}) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-[0.12em] text-dim">{label}</dt>
      <dd className="mt-1">
        {rating != null ? (
          <Pill tone="success">
            <Star className="size-3 fill-white" />
            {rating.toFixed(1)}
          </Pill>
        ) : (
          <span className="text-lg font-bold tabular-nums text-ink">—</span>
        )}
      </dd>
      <dd className="mt-0.5 text-xs text-dim">{count ? String(count) : unrated}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`mt-4 ${cardClasses()}`}>
      <h2 className="text-2xs uppercase tracking-[0.14em] text-dim">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ReviewRow({
  review,
  canReply,
  practitionerUserId,
}: {
  review: PractitionerReview;
  canReply: boolean;
  practitionerUserId?: string;
}) {
  const { t } = useTranslation();
  const [reply, setReply] = useState("");
  const send = useReplyToReview(practitionerUserId);

  return (
    <li className="border-b border-line pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{review.author}</span>
        <span className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating}/5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`size-3.5 ${star <= review.rating ? "fill-star text-star" : "text-line-strong"}`}
            />
          ))}
        </span>
      </div>
      {review.body && (
        <p className="mt-1.5 text-sm leading-[1.75] text-muted">{review.body}</p>
      )}

      {review.reply ? (
        <p className="mt-2.5 border-l-2 border-accent pl-3 text-xs leading-[1.7] text-dim">
          {review.reply}
        </p>
      ) : (
        canReply && (
          <form
            className="mt-2.5 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (reply.trim()) send.mutate({ id: review.id, reply: reply.trim() });
            }}
          >
            <Input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={t.profReplyPlaceholder}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={send.isPending || !reply.trim()}>
              {t.profReply}
            </Button>
          </form>
        )
      )}
    </li>
  );
}
