"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownRenderer({
  content,
  className = "",
  isUser = false,
}: MarkdownRendererProps) {
  if (!content) return null;

  if (isUser) {
    return (
      <div className={`whitespace-pre-wrap font-sans text-xs sm:text-sm font-semibold leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`markdown-body space-y-2 text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-xs sm:text-sm leading-relaxed text-ink my-1.5 last:mb-0">
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 className="font-serif font-bold text-sm sm:text-base text-accent-ink border-b border-line-strong pb-1 mt-3 mb-2 flex items-center gap-2">
              <span className="text-xs">✦</span>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif font-bold text-xs sm:text-sm text-accent-ink mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="text-accent text-2xs">❖</span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif font-bold text-xs text-accent-ink mt-2 mb-1">
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-accent-ink">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-1 list-decimal list-inside text-xs sm:text-sm text-ink">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-xs sm:text-sm text-ink leading-relaxed">
              <span className="text-accent shrink-0 text-xs mt-0.5">•</span>
              <div className="flex-1 min-w-0">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 rounded-lg border-l-2 border-accent bg-accent-wash p-3 italic text-xs text-muted">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }: React.ComponentPropsWithoutRef<"code">) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="rounded-sm bg-accent-wash border border-line-strong px-1.5 py-0.5 font-mono text-2xs text-accent-ink"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-2.5 overflow-hidden rounded-lg border border-line-strong bg-cream shadow-raised">
                <div className="flex items-center justify-between border-b border-line-strong bg-surface px-3 py-1 text-2xs font-mono text-accent-ink">
                  <span>{match ? match[1] : "code"}</span>
                </div>
                <pre className="overflow-x-auto p-3 font-mono text-xs text-ink">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-line-strong">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-cream text-accent-ink font-serif font-bold border-b border-line-strong">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-line bg-surface text-ink">
              {children}
            </tbody>
          ),
          th: ({ children }) => <th className="p-2.5 font-semibold">{children}</th>,
          td: ({ children }) => <td className="p-2.5">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong underline hover:text-accent-ink transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
