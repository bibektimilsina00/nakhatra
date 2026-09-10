import type { Metadata } from "next";

import { CONTACT_EMAIL, LegalPage } from "@/features/marketing/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Nakhatra collects, why, who it is shared with, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="Nakhatra needs your birth date, time and place to calculate a chart. That is sensitive information, and this page explains exactly what happens to it."
    >
      <h2>The short version</h2>
      <p>
        We collect the birth details required to compute your chart, the questions you
        ask about it, and your account details. To produce a reading we send your chart
        and your question to an AI provider. We do not sell your data, and we do not put
        your birth details into our analytics or our logs.
      </p>

      <h2>Who we are</h2>
      <p>
        Nakhatra is a Vedic astrology service that calculates birth charts and answers
        questions about them. For anything in this policy, contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What we collect</h2>

      <h3>Account details</h3>
      <ul>
        <li>Your name and email address.</li>
        <li>
          Your password, stored only as an <strong>argon2id hash</strong>. We cannot read
          it, and we cannot recover it for you.
        </li>
        <li>The date your account was created.</li>
      </ul>

      <h3>Birth details</h3>
      <p>
        To calculate a chart we need the date, time and place of birth, and we store the
        place as coordinates plus an IANA time zone name. We may also store a name and
        gender for charts you save, so you can tell them apart.
      </p>
      <p>
        These are the most sensitive things we hold. A chart can be calculated for someone
        other than yourself — if you save a chart for a family member or a client, you are
        responsible for having their permission to do so.
      </p>

      <h3>Conversations</h3>
      <p>
        The questions you ask the astrologer, and the readings returned to you, are stored
        against your account so you can return to them. People often ask about health,
        money, marriage and family; treat these as private, because we do.
      </p>

      <h3>Voice</h3>
      <p>
        If you use voice mode, audio recorded from your microphone is sent for
        transcription. We do not retain the recordings ourselves.
      </p>

      <h3>Usage data</h3>
      <p>
        We record which features are used and in which language, plus standard web
        analytics such as pages visited and approximate region.{" "}
        <strong>
          Birth details and conversation content are deliberately excluded from every
          analytics event
        </strong>{" "}
        — our analytics receive the language and the type of action, never the chart or
        the question.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We do not sell your data or share it for advertising. We use the following
        processors, each for one purpose:
      </p>
      <ul>
        <li>
          <strong>OpenRouter</strong> — receives your computed chart, your birth details
          and your question in order to generate a reading, and forwards them to the
          model provider that answers it. This is how the astrologer works; it cannot
          answer without them.
        </li>
        <li>
          <strong>OpenAI</strong> — receives the text of a reading to synthesise speech,
          audio you record for transcription, and live audio during voice conversations.
        </li>
        <li>
          <strong>Google</strong> — runs the model that writes your reading, so it
          receives the same chart, birth details and question through OpenRouter. Its
          Gemini speech service also receives the text of the daily rasifal, which is the
          same public text everyone sees, to read it aloud in our videos.
        </li>
        <li>
          <strong>TikTok and YouTube</strong> — receive the daily rasifal videos we
          publish on our own channels, and the caption that goes with them. They contain
          the public rasifal only: no account of yours, no birth details, nothing about
          any visitor to this site.
        </li>
        <li>
          <strong>PostHog and Umami</strong> — usage analytics, as described above.
        </li>
        <li>
          <strong>Google Sign-In</strong>, if you use it — we receive your email address,
          name and profile picture from Google. We do not receive your Google password and
          we cannot access anything else in your Google account.
        </li>
      </ul>
      <p>
        These providers process data outside Nepal. We may also disclose information where
        we are legally required to.
      </p>

      <h2>Our social media channels</h2>
      <p>
        We publish the day&apos;s rasifal as short videos on our own channels — TikTok and
        YouTube today, and possibly Instagram or Facebook later. Those videos are made
        from the public daily rasifal for the twelve signs. Nobody&apos;s chart, birth
        details or questions go into them, and they are produced whether or not anyone is
        signed in.
      </p>
      <p>
        Connecting a channel is something only an administrator of Nakhatra can do, for an
        account we own. When it happens the platform gives us a token that lets us post as
        that channel; we keep it on our own server, alongside the channel&apos;s display
        name, and we can disconnect at any time. Visitors cannot connect their own
        accounts, and we never post on anyone else&apos;s behalf.
      </p>
      <p>
        We receive nothing about the people who watch or comment on those platforms beyond
        what the platform shows publicly, and this website carries no TikTok or YouTube
        pixel, button or embed — so reading Nakhatra does not tell them you were here.
        What happens on their platforms is governed by their own policies:{" "}
        <a href="https://www.tiktok.com/legal/privacy-policy" rel="noreferrer">
          TikTok
        </a>{" "}
        and{" "}
        <a href="https://policies.google.com/privacy" rel="noreferrer">
          Google
        </a>
        .
      </p>

      <h2>What we deliberately do not do</h2>
      <ul>
        <li>Birth details never appear in our server logs.</li>
        <li>Birth details never appear in error messages returned to your browser.</li>
        <li>Birth details never appear in analytics events.</li>
        <li>We do not use your conversations to train our own models.</li>
        <li>
          Nothing personal to you is ever published on our social media channels.
        </li>
      </ul>

      <h2>How it is stored</h2>
      <p>
        Data is held in our database and transmitted over encrypted connections. Passwords
        are hashed with argon2id. Access to production data is limited to the people who
        need it to operate the service.
      </p>
      <p>
        No service can promise perfect security. If a breach affects your data, we will
        tell you.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account details, saved charts and conversations are kept until you delete them or
        close your account. Ask us to delete your account and we will remove your personal
        data within 30 days, except where we are required to retain something by law.
        Analytics data is retained in aggregate.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to give you a copy of your data, correct it, delete it, or stop
        processing it. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we
        will respond within 30 days. Depending on where you live, you may also have the
        right to complain to a data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        Nakhatra is not intended for children under 16. We do not knowingly collect their
        data. If you believe a child has given us information, contact us and we will
        delete it.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page when our practices change and revise the date at the top.
        If a change materially affects how we handle your data, we will tell you before it
        takes effect.
      </p>
    </LegalPage>
  );
}
