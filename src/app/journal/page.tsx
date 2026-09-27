
import type { Metadata } from "next";
import SkupHeader from "@/components/SkupHeader";

export const metadata: Metadata = {
  title: "LUKMA Journal — Flavor, places & stories",
  description: "LUKMA guides to Tbilisi restaurants, food, and great evenings.",
};

const articles = [
  { tag: "Guide", title: "10 places to discover this week", text: "Handpicked places for a Tbilisi evening — from quick bites to long dinners." },
  { tag: "Food", title: "How to choose a restaurant for your mood", text: "Birthday, first date, or a late dinner with friends — choosing is easier when you know the occasion." },
  { tag: "City", title: "Tbilisi food in one map", text: "ქართული კლასიკის გარდა აღმოაჩინე იტალიური, იაპონური, აზიური და ხმელთაშუაზღვიური Foodები." },
];

export default function JournalPage() {
  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="journal-page">
        <section className="journal-page-hero shell">
          <span className="kicker">LUKMA Journal</span>
          <h1>Stories about<br/><em>great food.</em></h1>
          <p>ადგილები, Foodები და პატარა გზამკვლევები, რომლებიც შემდეგ საღამოს დაგეგმვაში დაგეხმარება.</p>
        </section>
        <section className="section shell">
          <div className="journal-article-grid">
            {articles.map((article, index) => (
              <article className={"journal-article-card article-" + index} key={article.title}>
                <div className="journal-article-art"><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div className="journal-article-copy"><span>{article.tag}</span><h2>{article.title}</h2><p>{article.text}</p><a href="/discover/">View restaurants →</a></div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
