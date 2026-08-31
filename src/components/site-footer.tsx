import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">A living research instrument</p>
        <p className="footer-statement">New pixels are not new capabilities.</p>
      </div>
      <div className="footer-links">
        <Link href="/runs">Evaluation run ledger</Link>
        <Link href="/methods">Methodology</Link>
        <Link href="/research">Primary sources</Link>
        <Link href="/about">Contribute a failure</Link>
      </div>
      <p className="footer-meta">Open research preview · Evidence before spectacle · 2026</p>
    </footer>
  );
}
