"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="skup-site">
      <main className="shell page-loading">
        <span className="kicker">LUKMA</span>
        <h1>Something went wrong.</h1>
        <p>We could not load this page right now. Try again or return to Discover.</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="green-btn" onClick={() => reset()}><RefreshCw size={15}/> Try again</button>
          <Link className="outline-btn" href="/">Back home</Link>
          <Link className="outline-btn" href="/discover/">Discover restaurants</Link>
        </div>
      </main>
    </div>
  );
}
