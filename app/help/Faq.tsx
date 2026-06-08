export default function Faq({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-hairline">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          {q}
        </h2>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="size-4 shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:-rotate-180 motion-reduce:transition-none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="space-y-4 pb-5 text-lg leading-relaxed text-muted text-pretty">
        {children}
      </div>
    </details>
  );
}
