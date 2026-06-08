import type { MDXComponents } from "mdx/types";
import Faq from "./app/help/Faq";

const link =
  "text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent";

const components: MDXComponents = {
  // `Faq` is exposed globally so content files can use <Faq> without importing it.
  Faq,
  p: ({ children }) => <p className="text-pretty">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className={link}>
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pl-5 marker:text-muted">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h3: ({ children }) => (
    <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  ),
  code: ({ children }) => (
    <code className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
