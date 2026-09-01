import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const links = [
  ["Atlas", "/taxonomy"],
  ["Verified", "/verified"],
  ["Live lab", "/lab"],
  ["Models", "/models"],
  ["Run ledger", "/runs"],
  ["Discovery", "/discovery"],
  ["Compare", "/compare"],
  ["Methods", "/methods"],
  ["Library", "/research"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Multimodal Failure Atlas home">
        <span className="wordmark-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          Failure
          <br />
          Atlas
        </span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="header-note" href="/about">
        About <ArrowUpRight size={14} strokeWidth={1.6} />
      </Link>
    </header>
  );
}
