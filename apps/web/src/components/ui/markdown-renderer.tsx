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
            <p className="text-xs sm:text-sm leading-relaxed text-fg my-1.5 last:mb-0">
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 className="font-serif font-bold text-sm sm:text-base text-acc border-b border-acc/30 pb-1 mt-3 mb-2 flex items-center gap-2">
              <span className="text-xs">✦</span>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif font-bold text-xs sm:text-sm text-acc2 mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="text-acc text-[10px]">❖</span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif font-bold text-xs text-acc mt-2 mb-1">
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-acc2 drop-shadow-[0_0_8px_rgba(243,199,102,0.15)]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-mid">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-1 list-decimal list-inside text-xs sm:text-sm text-fg">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-xs sm:text-sm text-fg leading-relaxed">
              <span className="text-acc shrink-0 text-xs mt-0.5">•</span>
              <div className="flex-1 min-w-0">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 rounded-[8px] border-l-2 border-acc bg-inset/70 p-3 italic text-xs text-mid shadow-inner">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="rounded-[4px] bg-inset border border-acc/30 px-1.5 py-0.5 font-mono text-[11px] text-acc2"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-2.5 overflow-hidden rounded-[8px] border border-brd bg-inset shadow-lg">
                <div className="flex items-center justify-between border-b border-brd bg-panel px-3 py-1 text-[10px] font-mono text-acc">
                  <span>{match ? match[1] : "code"}</span>
                </div>
                <pre className="overflow-x-auto p-3 font-mono text-xs text-fg">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-[8px] border border-brd">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-panel text-acc font-serif font-bold border-b border-brd">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-brd bg-inset/60 text-fg">
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
              className="text-acc2 underline hover:text-acc transition-colors"
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
