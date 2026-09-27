
import type { Metadata } from "next";
import SkupHeader from "@/components/SkupHeader";

export const metadata: Metadata = {
  title: "LUKMA ჟურნალი — გემო, ადგილები და ისტორიები",
  description: "LUKMA-ს გზამკვლევები თბილისის რესტორნებზე, სამზარეულოზე და კარგ საღამოებზე.",
};

const articles = [
  { tag: "გიდი", title: "10 ადგილი, რომელიც ამ კვირაში უნდა ნახო", text: "თბილისის საღამოსთვის შერჩეული ადგილები — სწრაფი სადილიდან ხანგრძლივ ვახშმამდე." },
  { tag: "გემო", title: "როგორ ავირჩიოთ რესტორანი განწყობის მიხედვით", text: "დაბადების დღე, პირველი პაემანი თუ მეგობრებთან გვიანი ვახშამი — არჩევანი უფრო მარტივია, როცა მიზანი წინასწარ იცი." },
  { tag: "ქალაქი", title: "თბილისის სამზარეულო ერთ რუკაზე", text: "ქართული კლასიკის გარდა აღმოაჩინე იტალიური, იაპონური, აზიური და ხმელთაშუაზღვიური გემოები." },
];

export default function JournalPage() {
  return (
    <div className="skup-site">
      <SkupHeader />
      <main className="journal-page">
        <section className="journal-page-hero shell">
          <span className="kicker">LUKMA ჟურნალი</span>
          <h1>ისტორიები კარგი<br/><em>საჭმლის შესახებ.</em></h1>
          <p>ადგილები, გემოები და პატარა გზამკვლევები, რომლებიც შემდეგ საღამოს დაგეგმვაში დაგეხმარება.</p>
        </section>
        <section className="section shell">
          <div className="journal-article-grid">
            {articles.map((article, index) => (
              <article className={"journal-article-card article-" + index} key={article.title}>
                <div className="journal-article-art"><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div className="journal-article-copy"><span>{article.tag}</span><h2>{article.title}</h2><p>{article.text}</p><a href="/discover/">რესტორნების ნახვა →</a></div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
