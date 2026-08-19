# SKUP Studio — Portfolio

Next.js (App Router, static export) პორტფოლიო საიტი. ავტომატურად იბილდება და ქვეყნდება
GitHub Pages-ზე ყოველ `main` ბრენჩში push-ზე (იხ. `.github/workflows/deploy.yml`).

## კონტენტის რედაქტირება

მთელი საიტის ტექსტი ცხოვრობს ერთ ფაილში: **[`content/site.json`](content/site.json)**.

- ყველა ტექსტური ველი ორენოვანია: `{ "ka": "...", "en": "..." }`.
- პროექტების დამატება/რედაქტირება: `projects.items` მასივი — `name`, `description`,
  `tech` (მასივი), `link` (URL ან `""`), `image` (URL ან `""` placeholder-ისთვის).
- სერვისების დამატება: `services.items` მასივი — `icon` (emoji), `title`, `description`.
- საკონტაქტო ინფო: `contact.email`, `contact.phone`, `contact.links`.

ცვლილების შემდეგ:

```bash
git add content/site.json
git commit -m "Update content"
git push
```

GitHub Actions ავტომატურად ააშენებს და გამოაქვეყნებს განახლებულ საიტს (1-2 წუთში).

## ლოკალური გაშვება

```bash
npm install
npm run dev
```

გახსენით [http://localhost:3000](http://localhost:3000).

## Build შემოწმება ლოკალურად

```bash
npm run build
```

სტატიკური ფაილები გენერირდება `out/` ფოლდერში.

## დომენის (skup.ge) მიბმა

1. GitHub repo → **Settings → Pages** → Custom domain: `skup.ge` (უკვე კონფიგურირებულია
   `public/CNAME` ფაილით).
2. დომენის რეგისტრატორთან დაამატეთ შემდეგი DNS ჩანაწერები:

   **A ჩანაწერები** (apex domain `skup.ge` → GitHub Pages):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **CNAME ჩანაწერი** (`www.skup.ge`, არასავალდებულო, მაგრამ რეკომენდებულია):
   ```
   www.skup.ge  →  PNatroshvili.github.io
   ```

3. DNS-ის გავრცელების შემდეგ (რამდენიმე წუთი — რამდენიმე საათი) GitHub ავტომატურად
   გასცემს უფასო HTTPS სერტიფიკატს. Settings → Pages-ში ჩართეთ **Enforce HTTPS**.

## პროექტების screenshot-ების განახლება

პროექტების web/tablet/mobile სურათები `public/projects/<slug>/{desktop,tablet,mobile}.webp`-შია
და `scripts/capture-screenshots.mjs`-ით გენერირდება (Playwright-ით, ლოკალურად):

```bash
npm install -D playwright sharp && npx playwright install chromium
node scripts/capture-screenshots.mjs
```

## სტრუქტურა

```
content/site.json        ← საიტის ტექსტი (რედაქტირებადი)
src/lib/                 ← ტიპები + კონტენტის ჩატვირთვა
src/components/          ← UI კომპონენტები (Header, Hero, About, Services, Projects, Contact, Footer)
src/app/                 ← Next.js App Router (layout + page)
public/CNAME             ← custom domain-ის კონფიგურაცია GitHub Pages-თვის
.github/workflows/       ← ავტომატური build + deploy
```
