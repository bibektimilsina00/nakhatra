# Astrologer & Pandit Marketplace — Feature Plan

Status: **planning, revision 2**. Nothing here is built.

Supersedes revision 1, which scoped voice and video out and started with
asynchronous text. Four product decisions have since been taken, and each of
them enlarges the first release:

| Decision | Chosen | Consequence |
|---|---|---|
| Billing | **Per-minute wallet** | Live metering, balance enforcement mid-call, a ledger, and reconciliation against real call duration. |
| Market | **Nepal and diaspora at launch** | Two payment rails, two currencies, and payouts that leave one of them. |
| Practitioners | **Astrologers and Pandits** | Puja booking is a second fulfilment flow: place, date, materials, travel. |
| Realtime | **Chat, voice and video together** | A media provider, presence, ring/answer, reconnection, and a recording policy — all before first revenue. |

Read alongside [`nakhatra.md`](../nakhatra.md) §39–41 and
[`docs/architecture.md`](architecture.md) §7 (additive-only API policy).

> **One concern, recorded once.** This is roughly four independently hard
> products shipping together: a marketplace, a payments and ledger system, a
> realtime media stack, and a logistics/booking system for rituals. Any one of
> them can sink a release on its own. §12 sequences the work into milestones
> that are each shippable, so the scope stays whole but the risk arrives in
> order rather than all at once. If a date matters more than completeness,
> milestone 3 is a coherent product on its own.

---

## 1. What it is

Today Nakhatra has one astrologer and it is a language model. This adds the
other kind: **verified humans who take paid consultations** — astrologers who
read charts, and pandits who perform rituals — and everything needed to find
them, talk to them, pay them and trust them.

One line: *the AI reads your chart for free, and hands you to a human when you
want one.*

## 2. Why this shape, and not a generic directory

The obvious version is a listings page — photos, stars, "book now". Every
astrology marketplace looks like that and they compete on price and photographs.

The version only this product can build is **the handoff**. Someone has already
generated a chart, asked the AI three questions, and been told something they
want a second opinion on. One button, and a human sees the computed chart, the
questions asked, what the AI said, and what they actually want to know.

The astrologer starts informed. The seeker retypes nothing. That is the product.
The directory is only what makes it navigable, and the call is only how it is
delivered.

---

## 3. The four sides

### 3.1 Seeker

Everything they have today, plus:

**Discovery**
- Browse astrologers and pandits, with filters: practice type, tradition
  (Parashari, KP, Nadi, Jaimini), speciality, language, price band, rating,
  availability, online-now.
- Sort by relevance, price, rating, experience, response time.
- Full profile: bio, photograph, years practising, credentials, languages,
  specialities, sample answers, reviews, price per minute, typical wait.
- "Available now" as a first-class filter — the whole point of per-minute.

**Consulting**
- Start an instant chat, voice or video call with anyone online.
- Book a scheduled slot with anyone, online or not.
- Attach a saved kundali to the consultation, with explicit consent.
- Optionally share an AI conversation, as a separate consent.
- See the running cost and remaining balance live, during the session.
- End the session at any time; be warned before the balance runs out.
- Receive a transcript and, where recorded and consented, the audio.
- Rate and review afterwards.

**Money**
- Wallet: top up, see balance, see every deduction with what it bought.
- Auto top-up, optionally.
- Refund request on a failed or dropped session.
- Invoices.

**Rituals (Pandit)**
- Browse pujas by purpose (graha shanti, navagraha, rudrabhishek, satyanarayan).
- See what a puja involves, how long it takes, what materials are needed and who
  supplies them.
- Choose a muhurta — ideally suggested from the seeker's own chart, which is a
  genuine differentiator the engine already makes possible.
- Book on-site (pandit travels), at a temple, or online (streamed).
- Pay a deposit, then the balance.

### 3.2 Astrologer

A new account type. Astrologer and Pandit differ in **what they sell**, not in
how the account works, so it is one role with a `practice_type` rather than two
parallel implementations.

**Onboarding**
- Apply: identity, credentials, experience, references, a sample reading.
- Track application status; respond to a reviewer's questions.
- Bank/payout details, with KYC.

**Profile**
- Bio, photograph, languages, traditions, specialities, city, years practising.
- Introduction video, optionally — it converts far better than text.
- Per-minute rates, separately for chat, voice and video.
- Fixed-price offerings for scheduled readings.

**Working**
- Go online/offline; set a status.
- Receive an incoming request and accept or decline within a window.
- Weekly recurring availability plus one-off exceptions, in their own IANA zone.
- Take chat, voice and video sessions.
- See the shared chart, the dashas, and the AI's prior analysis before answering.
- Record their own interpretation, stored beside the AI's.
- Queue: who is waiting, for how long.

**Money**
- Earnings dashboard: per session, per day, per month.
- Commission shown explicitly.
- Payout schedule and history.
- Tax documents.

**Reputation**
- Reviews, with a right of reply.
- Metrics that matter: response time, accept rate, repeat-seeker rate.

### 3.3 Pandit

Everything an astrologer has, plus:

- A catalogue of rituals with duration, price, and what is included.
- Travel radius and travel fee.
- Materials: supplied by pandit, or a list for the seeker to buy.
- Booking calendar with physical-availability blocks (a puja is not a 20-minute
  call — it occupies half a day, including travel).
- Muhurta constraints: which windows a given ritual may be performed in.

### 3.4 Admin / operations

Not optional. A marketplace without an operations console is unoperable.

- Application review queue, with document viewing and approve/reject/ask.
- Suspend or delist a practitioner.
- Dispute and refund handling.
- Payout runs and reconciliation.
- Report queue (abuse, off-platform solicitation, bad advice).
- Commission and pricing controls.
- Live sessions view, for support during an incident.
- Audit log of every access to shared birth data.

---

## 4. Realtime: the part that is genuinely new

### 4.1 What we already have, and why it does not transfer

The app now runs a WebRTC session against OpenAI's realtime API. That work
established a pattern — ephemeral tokens minted server-side, SDP exchange from
the browser, an audio element, mic constraints, reconnection — and **none of the
transport transfers**. That is a client talking to one vendor's endpoint. Human
to human is a different problem: two peers, media that has to be routed between
them, presence, ringing, and a third party (recording) that must sometimes join.

What does transfer is the discipline: echo cancellation, half-duplex decisions,
mic release on teardown, surfacing errors rather than failing silently, and
never trusting the client for anything that costs money.

### 4.2 Build or buy

**Buy.** Peer-to-peer WebRTC is a weekend demo and a two-year maintenance
project: TURN servers, NAT traversal, codec negotiation, mobile backgrounding,
network switching, recording, and per-region capacity. It is not this team's
product.

| Provider | For | Against |
|---|---|---|
| **LiveKit** | Open source, self-hostable later, generous SDKs, good React/Flutter support, egress (recording) built in. Cloud or own infrastructure without a rewrite. | Smaller than Agora in South Asia; self-hosting means running TURN eventually. |
| **Agora** | Strong presence and performance in South Asia; tuned for weak networks; used widely by exactly this category of app in India/Nepal. | Proprietary, pricing opaque at scale, harder to leave. |
| **Twilio Video** | Reliable, good docs, one vendor for SMS/OTP too. | Being de-emphasised by Twilio; pricier; weaker in the region. |
| **100ms / Daily** | Fast to integrate, good DX. | Less regional presence; another dependency. |

**Recommendation: LiveKit Cloud**, with Agora as the fallback if South Asian
call quality proves poor in testing. LiveKit's egress covers recording, its
token model matches the ephemeral-key pattern already built, and self-hosting
later is a deployment change rather than a rewrite. Decide with a real test:
two devices on Nepali mobile data, one on diaspora broadband, measure setup
time, MOS and drop rate before committing.

**Realtime chat does not need the media provider.** Text should ride its own
transport — WebSocket, or the media provider's data channel. Keeping it separate
means chat still works when video will not, which on Nepali mobile data matters.

### 4.3 Call lifecycle

Every state below needs a defined behaviour, and each one is a bug if left
implicit:

```
seeker taps "call"
  → balance check (server-side, authoritative)
  → practitioner presence check
  → RINGING           practitioner has N seconds to answer
      ├─ accepted     → CONNECTING → ACTIVE
      ├─ declined     → seeker told, no charge, alternatives offered
      ├─ timeout      → no charge, "they didn't pick up", suggest booking
      └─ cancelled    → seeker hung up first, no charge
  → ACTIVE            metering starts on media-connected, not on accept
      ├─ network drop → RECONNECTING (grace window, not billed)
      ├─ balance low  → warning at 2 min, at 1 min
      ├─ balance zero → graceful end, both told why
      ├─ either ends  → ENDED
      └─ server dies  → session recovered from the ledger, not from memory
  → ENDED             → reconcile duration → finalise charge → rate/review
```

**Metering starts when media is connected**, never when the call is accepted.
The gap is where the "I was charged for a call that never connected" support
tickets live.

### 4.4 Presence

Per-minute pricing makes "available now" the primary discovery filter, so
presence is load-bearing rather than decorative:

- Online / busy / offline, plus "back at HH:mm".
- Heartbeat-driven, with a timeout — a closed laptop must not show as online.
- Busy is automatic while in a session.
- Presence is server-owned. A client claiming to be online is a supply-quality
  problem: seekers call, nobody answers, and they do not come back.

### 4.5 Recording

- **Off by default.** Recording a consultation about someone's marriage without
  clear consent is the kind of mistake that ends a product.
- Explicit opt-in from **both** parties before a session starts.
- An unmistakable indicator while recording.
- Retention limit, seeker-initiated deletion, and encryption at rest.
- Recordings are birth-data-adjacent: same handling as the chart (rule 9).
- Jurisdiction: Nepal, plus wherever the diaspora seeker is. Two-party-consent
  regions exist and the diaspora lives in some of them.

Transcripts are the cheaper 80%: useful, searchable, far less sensitive than
audio, and they make the session reviewable for disputes.

### 4.6 Quality on real networks

- Audio-only fallback when bandwidth collapses — automatic, with a visible
  reason.
- Pre-call check: mic, camera, bandwidth, before money is committed.
- Report call quality after the session; correlate with drops and refunds.
- Never bill a session the platform could not deliver. Automatic credit on a
  session that dropped inside the first minute.

---

## 5. Per-minute billing: the second hard part

This is where a marketplace loses money or loses trust, and usually both.

### 5.1 The wallet is a ledger, not a number

A balance stored as a mutable integer will drift, and every drift is a support
ticket about someone's money. Store an **append-only ledger** of entries — top
up, hold, capture, release, refund, payout, commission, adjustment — and derive
the balance. Every entry references what caused it.

```
wallet_ledger
  id, wallet_id, kind, amount_minor, currency,
  reference_type, reference_id,     -- consultation, payment, payout, adjustment
  balance_after_minor,              -- denormalised for auditability
  created_at, created_by
```

`balance_after_minor` is redundant on purpose: it makes a corrupted sequence
detectable instead of silently wrong.

### 5.2 Holds

On call start, place a **hold** for the maximum the balance can buy. Capture the
actual amount on end, release the rest. Without a hold, two simultaneous calls
can spend the same rupees.

### 5.3 The server meters, the client displays

The client shows a timer. The server decides what is owed, from
media-connected to media-disconnected, reconciled against the provider's own
session record. A client that can influence billing will be made to.

### 5.4 Rounding, minimums, and the first minute

Decide explicitly, publish it, and never change it quietly:

- Billing increment: per second, or per whole minute?
- Minimum charge — a 5-second call that costs a full minute feels like theft.
- Free first minute? Excellent for conversion, and immediately abused without a
  per-seeker limit.
- What happens to a partial minute at the end.

### 5.5 Failure modes to design for now

- Balance hits zero mid-sentence → warn at 2 minutes and 1 minute; end
  gracefully; offer a top-up that resumes the same session.
- Call drops at minute 12 of 20 → charge 12, credit any reconnection window.
- Practitioner stalls to burn minutes → monitor talk-time ratio and repeat-rate;
  it is detectable and it will happen.
- Seeker disputes a charge → transcript, duration, provider record, ledger.
- Double-charging on reconnect → idempotency keys on every capture.
- Refunds → to wallet by default, to source on request.

---

## 6. Payments, both markets

### 6.1 In

- **Nepal**: eSewa, Khalti, IME Pay, FonePay/QR, and cards issued locally.
- **Diaspora**: Stripe — cards, Apple Pay, Google Pay.
- Currency: wallet held in **NPR** as the single unit of account; diaspora tops
  up in their currency and the conversion happens at top-up, once, with the rate
  shown. Holding multi-currency wallets doubles the ledger for no user benefit.

### 6.2 Out

- Payouts to Nepali bank accounts and mobile wallets; manual or semi-manual for
  the first cohort is acceptable and normal.
- Payout schedule (weekly?), minimum threshold, and a visible pending balance.
- Commission: rate, whether it varies by practitioner tier, and whether it is
  shown. Show it. Practitioners find out anyway, and hiding it costs trust.
- **Nepali tax**: TDS on service income, VAT registration thresholds, and
  whether the platform is agent or principal. This needs an accountant, not an
  engineer, and it needs one before launch.

### 6.3 Non-negotiables

- Idempotency on every money-moving call.
- Webhook signature verification on every provider callback.
- Reconciliation job: provider records against our ledger, daily, with alerts.
- No card or wallet credential ever touches our servers.

---

## 7. Rituals: a different product wearing the same login

A consultation is 20 minutes and a network connection. A puja is half a day, a
place, a set of materials and a person physically travelling. Sharing the
account system is right; sharing the booking system is not.

- Ritual catalogue: type, purpose, duration, what is included, what the seeker
  must provide.
- Mode: at the seeker's home, at a temple, or performed remotely and streamed.
- Location, travel radius, travel fee.
- **Muhurta selection** — the auspicious window, computed from `astrology_core`
  for this seeker's chart. This is the feature no competitor can copy cheaply,
  and it is the reason to build rituals at all rather than leave them to
  WhatsApp.
- Deposit at booking, balance on completion.
- Cancellation policy with a cutoff, because travel has already been committed.
- Photographic or streamed proof of performance, where the seeker is not present.

---

## 8. Data model

Additive throughout. No existing table changes shape (CLAUDE.md rule 7); `users`
gains one nullable, defaulted column.

### Identity and profile
| Table | Holds |
|---|---|
| `practitioner_profiles` | One per practitioner: `practice_type`, bio, photo, city, experience, verification state, intro video. |
| `practitioner_languages` | Filterable, so a table rather than a column. |
| `practitioner_traditions` | Parashari, KP, Nadi, Jaimini. |
| `practitioner_specialities` | Career, marriage, remedies, muhurta. |
| `practitioner_applications` | Submission, documents, reviewer notes, state. |
| `kyc_documents` | Identity and bank verification. Restricted access, audited. |

### Offering and availability
| Table | Holds |
|---|---|
| `rate_cards` | Per-minute price by medium (chat/voice/video), per practitioner. |
| `fixed_offers` | Scheduled readings sold at a fixed price. |
| `ritual_offers` | Puja catalogue: type, duration, inclusions, travel fee. |
| `availability_rules` | Recurring weekly windows, with an IANA zone. |
| `availability_exceptions` | Holidays, one-off blocks. |
| `presence` | Online state, last heartbeat, current session. |

### The consultation itself
| Table | Holds |
|---|---|
| `consultations` | Seeker, practitioner, medium, state, requested/started/ended, rate at booking. |
| `consultation_events` | State transitions, append-only. The audit trail for every billing dispute. |
| `consultation_messages` | Human-to-human messages. **Not** `chat_messages` — see below. |
| `call_sessions` | Media room id, provider session id, connected/disconnected timestamps, quality metrics. |
| `recordings` | Consent from both parties, provider asset, retention, deletion. |
| `transcripts` | Text of a session, for dispute and for the seeker's own record. |
| `practitioner_notes` | The human's interpretation, stored beside the AI's. |
| `ritual_bookings` | Place, muhurta window, materials, travel, deposit, completion proof. |

### Consent
| Table | Holds |
|---|---|
| `chart_grants` | One seeker → one practitioner → one kundali. Granted, expires, revoked. |
| `conversation_grants` | The same for an AI conversation. Deliberately separate. |
| `grant_access_log` | Every read of shared birth data: who, when, what. |

### Money
| Table | Holds |
|---|---|
| `wallets` | One per seeker. Balance is derived, not stored authoritatively. |
| `wallet_ledger` | Append-only entries. The source of truth. |
| `holds` | Funds reserved for an active session. |
| `payments` | Top-ups: provider, reference, state, idempotency key. |
| `payouts` | Owed and sent, per practitioner, per run. |
| `commissions` | Platform's cut per consultation, recorded not computed on the fly. |
| `refunds` | Reason, amount, destination, who approved. |

### Trust
| Table | Holds |
|---|---|
| `reviews` | One per completed consultation, with practitioner reply. |
| `reports` | Abuse and off-platform solicitation, with resolution. |
| `moderation_actions` | Suspensions, warnings, delistings. |

### The one change to something that exists
`users` gains nullable `role` (`seeker` | `practitioner` | `admin`), defaulting
to `seeker`. Nullable and defaulted, so existing rows and old mobile builds are
unaffected.

### The one that needs care
`consultation_messages` is **not** `chat_messages`. The existing table belongs to
AI conversations: one participant, no delivery state, no read receipts, no
moderation. Overloading it gives both features a shape that suits neither.

---

## 9. Backend modules

A module exists when a feature has routes **and** tables (CLAUDE.md).

```
modules/practitioners/   profiles, applications, verification, directory search
modules/availability/    rules, exceptions, presence
modules/consultations/   lifecycle, messages, notes, transcripts
modules/calls/           media tokens, room lifecycle, provider webhooks
modules/billing/         wallet, ledger, holds, metering, reconciliation
modules/payments/        top-ups, payouts, provider adapters
modules/grants/          chart and conversation consent, access log
modules/rituals/         catalogue, muhurta, bookings, fulfilment
modules/reviews/         ratings, replies
modules/moderation/      reports, actions, audit
```

- `grants/` is separate because consent must be enforceable from anywhere — the
  reading page, the vault, an admin tool — and revocable independently.
- `billing/` is separate from `payments/` because the ledger must be correct even
  when a provider is down. One owns money inside the platform; the other owns
  money crossing its boundary.
- `calls/` owns the provider. Exactly one file constructs the media client, the
  same rule already applied to `integrations/llm.py`.
- Directory search is read-heavy and filtered: it wants indexes on the filter
  columns from day one, not after the first slow page.

---

## 10. Everything else that is required and easy to forget

**Auth and permissions** — `require_role("practitioner")` in `router_deps.py`;
resource ownership checks on every consultation route; admin as a distinct role
with its own audit trail.

**Notifications** — an incoming call is worthless if nobody is told. Push
(FCM/APNs) for mobile, web push, email for receipts and payouts, SMS/OTP for
verification. Quiet hours per practitioner, or they will disable notifications
entirely and never come back online.

**Mobile** — calls will mostly happen on phones. CallKit/ConnectionService for
native call UI, background audio, and permission flows. This is not a thin
wrapper over the web app.

**Search and ranking** — what determines the order of the directory? Rating,
response time, availability, price, and new-practitioner boost. Ranking is
product policy and should be written down, not left to whatever the query
returns.

**Legal** — practitioner terms, seeker terms, a privacy policy that names a new
recipient category (practitioners see birth data), refund policy, recording
consent, and a disclaimer that astrological guidance is not medical, legal or
financial advice. Needed before the first real consultation, not after.

**Support** — a human path for "I was charged and nobody answered", with the
transcript, ledger and provider record in one view.

**Analytics** — supply/demand by language and speciality, time-to-answer,
session length distribution, drop rate, repeat rate, wallet top-up conversion,
and revenue per practitioner. Birth data stays out of all of it (rule 9).

---

## 11. The hard decisions, restated

1. **Consent.** Two grants, never one: a chart is birth data, a conversation is
   what someone asked about their marriage. Scoped to one practitioner and one
   chart, revocable immediately, expiring with the consultation, and audited.
2. **Verification.** What actually evidences competence in Jyotish? A Sanskrit
   university certificate is verifiable; twenty years of practice in a small town
   is real and undocumented. Too strict and there is no supply; too loose and
   there is no trust.
3. **The ledger.** Money is append-only or it is wrong.
4. **Presence honesty.** A practitioner shown as online who does not answer is
   worse than one shown as offline.
5. **Recording consent.** Both parties, explicit, before the session.
6. **Time zones.** Practitioners in Nepal, seekers in Sydney. Store IANA, render
   local — the same discipline as birth data, and the same failure if skipped.
7. **Off-platform leakage.** Every marketplace loses sessions to "message me on
   WhatsApp". Make on-platform better, detect solicitation, and accept that
   enforcement is partly social.

---

## 12. Milestones

The scope stays whole; the risk arrives in order. Each milestone is shippable
and independently useful.

| # | Ships | Proves | Rough size |
|---|---|---|---|
| **0** | Waitlist: seekers register interest, practitioners apply. A landing section and two tables. | That either side wants this — the most expensive question, answered cheaply. | days |
| **1** | Applications, verification queue, admin console, profiles, public directory with filters. No booking. | That supply exists and can be verified. | weeks |
| **2** | Wallet, top-ups on both rails, ledger, holds. Payout runs, manual. | That money moves correctly before anything depends on it. | weeks |
| **3** | Realtime **chat** consultations, per-minute metered. Chart grants. Notes. Reviews. | That the handoff is valuable and metering is trusted. **This is a coherent product on its own.** | weeks |
| **4** | **Voice and video** on the media provider. Presence, ringing, reconnection, quality fallback, recording with consent. | That live sessions can be delivered on real Nepali networks. | weeks |
| **5** | **Rituals**: catalogue, muhurta from the engine, bookings, deposits, fulfilment. | That the physical product works. | weeks |
| **6** | Scale: ranking, packages, promotions, practitioner tiers. | Growth, once the base is sound. | ongoing |

Milestone 2 before 3 is deliberate. Metering a session against a ledger that has
never moved real money is how a launch becomes a refund queue.

---

## 13. Open questions

Product decisions, not engineering ones.

1. **Commission rate**, and does it vary by tier?
2. **Free first minutes** for a new seeker — yes, and how are they abuse-limited?
3. **Practitioner exclusivity** — may they list on competing platforms?
4. **Who runs verification**, and what is the target turnaround?
5. **Minimum payout threshold** and schedule.
6. **Does the AI actively suggest a human** ("this is worth asking a person"), or
   must the seeker go looking? The former is the strongest conversion path in the
   product and also the easiest to make feel like an upsell.
7. **Chart sharing, the original ambiguity**: does a practitioner publish *their
   own* chart as a credential ("Jupiter in the 9th, as you would expect")? That
   is unusual and rather good. Assumed throughout here is the other reading —
   seekers sharing theirs.
8. **Dispute authority** — who decides a refund, and within what window?

---

## 14. What would make this fail

- Building the directory before knowing whether practitioners will join.
- A mutable balance column instead of a ledger.
- Billing from the client's timer.
- Shipping video first because it demos well, on networks that cannot carry it.
- Letting unverified practitioners list, and losing trust permanently in week one.
- Treating consent as a checkbox rather than a revocable, audited grant.
- Reusing `chat_messages` for human conversation.
- Building all four products at once with no shippable milestone until the end.
