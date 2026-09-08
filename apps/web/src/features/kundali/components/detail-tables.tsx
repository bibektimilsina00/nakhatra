"use client";

import type {
  Avakhada,
  BirthDetailsIn,
  Chart,
  Panchang,
} from "@/features/kundali/types";

/** A definition list styled as a dotted-leader table — how a printed panchang
 *  reads, and denser than cards for two-column key/value data. */
function DetailList({
  rows,
  columns = 2,
}: {
  rows: [string, React.ReactNode][];
  columns?: 2 | 3;
}) {
  return (
    <dl
      className={`grid grid-cols-1 gap-x-8 gap-y-0 ${
        columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
      }`}
    >
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-2.5"
        >
          <dt className="text-2xs uppercase tracking-[0.14em] text-dim">
            {label}
          </dt>
          <dd className="m-0 text-right text-sm text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface/50 p-6 sm:p-7">
      <h3 className="font-display text-lg text-fg">{title}</h3>
      {note && <p className="mt-1 mb-4 text-xs text-dim">{note}</p>}
      <div className={note ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function BirthDetailsPanel({
  birth,
  chart,
}: {
  birth: BirthDetailsIn;
  chart: Chart;
}) {
  return (
    <Panel title="Birth Details">
      <DetailList
        rows={[
          ["Name", birth.name],
          ["Date of Birth", birth.date],
          ["Time of Birth", birth.time],
          ["Place of Birth", birth.place_label],
          // The IANA zone name, never a UTC offset: the offset for a place
          // changes over time, and a stored offset silently corrupts any birth
          // from before the last change.
          ["Time Zone", birth.tz_name],
          ["Latitude", birth.latitude.toFixed(4)],
          ["Longitude", birth.longitude.toFixed(4)],
          ["Time Accuracy", birth.time_accuracy ?? "exact"],
          ["Julian Day (UT)", chart.julian_day.toFixed(6)],
          ["Ayanamsa", `${chart.ayanamsa_name} ${chart.ayanamsa_value.toFixed(4)}°`],
        ]}
      />
    </Panel>
  );
}

export function PanchangPanel({ panchang }: { panchang: Panchang }) {
  return (
    <Panel
      title="Panchang"
      note="The five limbs of the Vedic day, computed from the Sun and Moon at birth."
    >
      {/* The almanac frame a Nepali kundali opens with. All of it is the Sun's
          sidereal sign — Bhadra begins when the Sun enters Leo, so it cannot
          come from a calendar. Rendered only when present, because a chart
          computed before these existed does not carry them. */}
      {panchang.masa && (
        <p className="mb-4 border-l-2 border-gold/40 pl-3 text-[12.5px] leading-relaxed text-muted">
          {panchang.masa} · {panchang.paksha} {panchang.tithi_name} · {panchang.vara}
          <span className="mt-0.5 block text-dim">
            {panchang.ayana} · {panchang.ritu} ritu · Vikram Samvat{" "}
            {panchang.vikram_samvat} · Shaka {panchang.shaka_samvat}
            {panchang.samvatsara ? ` · ${panchang.samvatsara} samvatsara` : ""}
          </span>
        </p>
      )}
      <DetailList
        rows={[
          ["Tithi", `${panchang.paksha} ${panchang.tithi_name}`],
          ["Karana", panchang.karana],
          ["Yoga", panchang.yoga],
          ["Nakshatra", `${panchang.nakshatra} · pada ${panchang.nakshatra_pada}`],
          ["Nakshatra Lord", panchang.nakshatra_lord],
          ["Vara", `${panchang.vara} (${panchang.vara_lord})`],
          ["Moon Sign", `${panchang.moon_sign} · ${panchang.moon_sign_lord}`],
          ["Ascendant", `${panchang.ascendant_sign} · ${panchang.ascendant_lord}`],
          ["Sunrise", clock(panchang.sunrise)],
          ["Sunset", clock(panchang.sunset)],
          ...(panchang.masa
            ? ([
                ["Masa (solar)", panchang.masa],
                ["Ritu", panchang.ritu],
                ["Ayana", panchang.ayana],
              ] as [string, string][])
            : []),
        ]}
      />
      <p className="mt-4 text-xs leading-relaxed text-dim">
        The Vedic day turns at sunrise, not midnight — a birth before dawn
        belongs to the previous vara.
      </p>
    </Panel>
  );
}

export function AvakhadaPanel({ avakhada }: { avakhada: Avakhada }) {
  return (
    <Panel
      title="Avakhada Chakra"
      note="Traditional birth attributes, all derived from the Moon's nakshatra and sign."
    >
      <DetailList
        columns={3}
        rows={[
          ["Varna", avakhada.varna],
          ["Vashya", avakhada.vashya],
          ["Yoni", avakhada.yoni],
          ["Gana", avakhada.gana],
          ["Nadi", avakhada.nadi],
          ["Sign", avakhada.sign],
          ["Sign Lord", avakhada.sign_lord],
          ["Charan", avakhada.charan],
          ["Tatva", avakhada.tatva],
          ["Nakshatra", avakhada.nakshatra],
          ["Name Syllable", avakhada.name_syllable],
          ["Yunja", avakhada.yunja],
        ]}
      />
      <p className="mt-4 text-xs leading-relaxed text-dim">
        Paya is not shown. The rules in circulation disagree and give different
        metals for the same chart, so the engine declines to invent one — the
        same reason Rahu and Ketu carry no dignity.
      </p>
    </Panel>
  );
}

function clock(iso: string | null | undefined): React.ReactNode {
  if (!iso) {
    return (
      <span className="text-dim" title="The Sun neither rises nor sets here">
        —
      </span>
    );
  }
  return iso.slice(11, 19);
}
