import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";

export default function NotFound() {
  useSeo({
    title: "Page not found | PitchMe",
    description: "This page does not exist. Browse open feature pitches on PitchMe instead.",
  });

  return (
    <div className="shell flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-3xl md:text-4xl">This page does not exist</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The pitch or company you were looking for may have been renamed or removed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/discover"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-all hover:brightness-105"
        >
          Browse pitches
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-5 text-sm font-medium transition-colors hover:bg-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
