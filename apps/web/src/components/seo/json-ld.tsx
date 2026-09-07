/**
 * A JSON-LD block.
 *
 * `<script type="application/ld+json">` is not executed, so this is not the
 * XSS hazard `dangerouslySetInnerHTML` usually is — but a `<` inside the JSON
 * would still end the script element early, so it is escaped. The content is
 * ours, not anybody's input.
 */
export function JsonLd({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }}
    />
  );
}
