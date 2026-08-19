import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/companies", label: "Companies" },
  { to: "/about", label: "About" },
];

function Wordmark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
    >
      <span
        aria-hidden="true"
        className="inline-block size-2 rounded-[2px] bg-accent"
        style={{ transform: "rotate(45deg)" }}
      />
      PitchMe
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="shell flex h-14 items-center justify-between gap-4">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Pitch a feature
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-border md:hidden">
          <nav aria-label="Primary mobile" className="shell flex flex-col py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/submit"
              className="my-3 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Pitch a feature
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

const FOOTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/community-guidelines", label: "Community Guidelines" },
  { to: "/copyright-trademark", label: "Copyright & Trademarks" },
];

function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="shell py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Independent community feedback. People describe what a product is missing, others add
              their support, and companies get a clear signal.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <a
                href="mailto:iamsaitejathanniru@gmail.com"
                className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                iamsaitejathanniru@gmail.com
              </a>
            </p>
          </div>

          <nav aria-label="Footer" className="md:max-w-md">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/iam-saiteja/pitchme"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-subtle-foreground">
          Company names, product names, trademarks, and logos belong to their respective owners.
          PitchMe is an independent community project and is not affiliated with or endorsed by the
          companies shown here. Logos are displayed for identification purposes only, and most are
          sourced from{" "}
          <a
            href="https://simpleicons.org/"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-border underline-offset-4 hover:text-muted-foreground"
          >
            Simple Icons
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
