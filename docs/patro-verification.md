# Verifying the engine against the printed patro

## The problem this solves

Every reference we can reach has a failure mode. The family's four hand-cast
kundalis contain guru slips (three found, all caught by internal consistency).
Hamro Patro's kundali tool is drik software — the guru is right that it
disagrees with hand casting, and that disagreement is precisely the
surya-vs-drik gap this engine exists to close. Websites can't be cited to a
guru anyway.

The printed patro is different. It is the one artifact the tradition itself
treats as authoritative, every jyotish owns one, and it states the tithi for
every day of the year — hundreds of data points with no single-guru error mode.

## The method

Most days, Surya Siddhanta and drik name the same tithi at sunrise, so most
days prove nothing. But roughly 40 days a year the two systems disagree —
Surya Siddhanta's Moon runs far enough ahead or behind to put sunrise on the
other side of a tithi boundary. On those dates the patro can only agree with
one of them.

Ask the guru (or read his patro) for the tithi on a handful of these dates.
Each answer is one word and settles a bit. Five or six agreeing answers is far
stronger evidence than any number of ordinary days.

## Discriminating dates, Sep 2026 – Sep 2027

Engine 0.7.1, tithi at Kathmandu sunrise.

| date | vara | सूर्य सिद्धान्त says | drik says |
|---|---|---|---|
| 2026-09-02 | Wed | Krishna **Shashthi** | Krishna Panchami |
| 2026-10-17 | Sat | Shukla **Saptami** | Shukla Shashthi |
| 2026-10-28 | Wed | Krishna **Dwitiya** | Krishna Tritiya |
| 2026-11-18 | Wed | Shukla **Navami** | Shukla Ashtami |
| 2026-12-09 | Wed | Shukla **Pratipada** | Krishna Amavasya |
| 2027-01-10 | Sun | Shukla **Tritiya** | Shukla Dwitiya |
| 2027-03-17 | Wed | Shukla **Dashami** | Shukla Navami |
| 2027-04-19 | Mon | Shukla **Chaturdashi** | Shukla Trayodashi |
| 2027-05-11 | Tue | Shukla **Panchami** | Shukla Shashthi |
| 2027-06-19 | Sat | Krishna **Pratipada** | Shukla Purnima |
| 2027-07-24 | Sat | Krishna **Shashthi** | Krishna Panchami |
| 2027-08-30 | Mon | Krishna **Chaturdashi** | Krishna Trayodashi |

(12 of 41 such dates in the year; the full list regenerates with the scan in
this file's history. 2026-12-09 and 2027-06-19 are the strongest cases — the
systems disagree on the *paksha*, not just the tithi.)

First data point, recorded but not yet frozen: for 2026-09-02, Hamro Patro's
calendar (which follows the Panchanga Nirnayak Samiti's festival dates) shows
षष्ठी — the Surya Siddhanta answer. One date from a website is suggestive, not
proof; the guru's printed patro is the citable source.

## What to do with the answers

- Answers match the सूर्य सिद्धान्त column → the engine is verified against
  the living tradition, independent of any single kundali or website.
- Any answer matches the drik column instead → that date becomes a fixture and
  the investigation starts there; it would mean the patro's tithi comes from
  somewhere else (a bija-corrected system would show exactly this).
- Also worth one question while asking: **which patro does the guru cast
  from?** The publisher's name settles the bija question outright.

Past years work the same way — if the family kept old patros, any year can be
scanned for its discriminating dates on request.
