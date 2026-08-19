import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";
import { MILESTONES } from "@/lib/types";

export default function About() {
  useSeo({
    title: "About PitchMe",
    description:
      "PitchMe collects public feature requests, measures real support behind each one, and takes the strongest pitches directly to the company.",
    path: "/about",
  });

  return (
    <div className="shell max-w-3xl py-14">
      <p className="eyebrow">About</p>
      <h1 className="display mt-3 text-3xl md:text-4xl">
        Feature requests deserve a public record.
      </h1>

      <div className="reading mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Most product feedback disappears into a support ticket. PitchMe does the opposite: every
          pitch is public, every supporter is counted, and the whole thread stays readable by anyone
          including the company it is addressed to.
        </p>
        <p>
          There are no accounts and no profiles. One browser can support a pitch once. That keeps
          the numbers meaningful without asking anyone to sign up.
        </p>

        <h2 className="pt-4 text-sm font-semibold tracking-tight text-foreground">
          What happens at a milestone
        </h2>
        <p>
          When a pitch reaches {MILESTONES.join(", ")} supporters, a person reads it, writes to the
          company, and records the outcome. If the company replies, the reply is published on the
          pitch exactly as received and marked as verified. If they decline, that is published too.
        </p>

        <h2 className="pt-4 text-sm font-semibold tracking-tight text-foreground">
          Independence and trademarks
        </h2>
        <p>
          PitchMe is an independent community project. Company names, product names, and logos
          belong to their respective owners and are shown only to identify the product a pitch is
          about. Nothing here is affiliated with or endorsed by the companies listed.
        </p>

        <h2 className="pt-4 text-sm font-semibold tracking-tight text-foreground">Moderation</h2>
        <p>
          Pitches and comments are reviewed before they appear. Anything abusive, off topic, or
          posted to promote a product is removed. Read the{" "}
          <Link
            to="/community-guidelines"
            className="text-foreground underline decoration-border underline-offset-4"
          >
            community guidelines
          </Link>{" "}
          for the full picture.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link
          to="/submit"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-all hover:brightness-105"
        >
          Pitch a feature
        </Link>
        <a
          href="mailto:iamsaitejathanniru@gmail.com"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-5 text-sm font-medium transition-colors hover:bg-surface"
        >
          Contact
        </a>
      </div>
    </div>
  );
}
