import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const profile = read('profile.json');
const publications = read('publications.json').sort((a, b) => b.year - a.year);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escape;
if (!/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(profile.githubUsername)) throw new Error('Invalid GitHub username');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error('Invalid contact email');
for (const publication of publications) {
  for (const field of ['id','type','title','authors','publication','year','doi','paperUrl']) {
    if (!publication[field]) throw new Error(`Missing publication field: ${field}`);
  }
  if (new URL(publication.paperUrl).protocol !== 'https:') throw new Error('Paper URLs must use HTTPS');
}
const url = `https://${profile.githubUsername.toLowerCase()}.github.io/`;
const github = `https://github.com/${profile.githubUsername}`;
const description = `${profile.name}, ${profile.education.toLowerCase()} in ${profile.major} at ${profile.university} (${profile.universityAbbreviation}). Research interests, publications, and contact information.`;
const schema = {
  '@context': 'https://schema.org', '@type': 'ProfilePage', url,
  mainEntity: {
    '@type': 'Person', name: profile.name, alternateName: profile.chineseName,
    url, email: `mailto:${profile.email}`, sameAs: [github],
    affiliation: {'@type':'CollegeOrUniversity', name:profile.university},
    knowsAbout: profile.interests
  }
};
const pubHtml = publications.map(pub => {
  const authors = pub.authors.map(name => name === profile.name ? `<strong>${e(name)}</strong>` : e(name)).join(', ');
  const details = [pub.volume ? `vol. ${e(pub.volume)}` : '', pub.issue ? `no. ${e(pub.issue)}` : '', pub.articleNumber ? `Art. no. ${e(pub.articleNumber)}` : '', pub.pages ? `pp. ${e(pub.pages)}` : '', e(pub.year)].filter(Boolean).join(', ');
  const date = pub.published ? new Intl.DateTimeFormat('en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(`${pub.published}T00:00:00Z`)) : '';
  return `        <li class="publication">
          <article aria-labelledby="${e(pub.id)}">
            <p class="pub-label">${e(pub.year)} · ${e(pub.type)}</p>
            <h3 class="pub-title" id="${e(pub.id)}"><a href="${e(pub.paperUrl)}">${e(pub.title)}</a></h3>
            <p class="authors">${authors}.</p>
            <p class="venue"><cite>${e(pub.publication)}</cite>, ${details}.</p>
${date ? `            <p class="published">${e(pub.publisher)} · Published <time datetime="${e(pub.published)}">${e(date)}</time></p>\n` : ''}            <p class="pub-links"><a href="${e(pub.paperUrl)}" aria-label="Paper: ${e(pub.title)}">Paper</a><a href="https://doi.org/${e(pub.doi)}" aria-label="DOI: ${e(pub.doi)}">DOI</a></p>
          </article>
        </li>`;
}).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(profile.name)} | ${e(profile.universityAbbreviation)}</title>
  <meta name="description" content="${e(description)}">
  <meta name="author" content="${e(profile.name)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#173f70">
  <link rel="canonical" href="${e(url)}">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${e(profile.name)} | ${e(profile.universityAbbreviation)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(url)}">
  <meta property="og:locale" content="en_US">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="page">
    <header>
      <div class="name-line"><h1>${e(profile.name)}</h1><span class="chinese-name" lang="zh-Hans">${e(profile.chineseName)}</span></div>
      <p class="role">${e(profile.education)} · ${e(profile.major)}</p>
      <p>${e(profile.university)} (${e(profile.universityAbbreviation)})</p>
      <p><a class="email" href="mailto:${e(profile.email)}">${e(profile.email)}</a></p>
      <nav aria-label="Main navigation"><a href="#about">About Me</a><a href="#research">Research Interests</a><a href="#publications">Publications</a><a href="#contact">Contact</a></nav>
    </header>
    <main id="main">
      <section id="about" aria-labelledby="about-heading">
        <h2 id="about-heading">About Me</h2>
        <p>${profile.about.map(e).join(' ')}</p>
      </section>
      <section id="research" aria-labelledby="research-heading">
        <h2 id="research-heading">Research Interests</h2>
        <ul class="interests">${profile.interests.map(interest => `<li>${e(interest)}</li>`).join('')}</ul>
      </section>
      <section id="publications" aria-labelledby="publications-heading">
        <h2 id="publications-heading">Publications</h2>
        <ol class="publications">
${pubHtml}
        </ol>
      </section>
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact</h2>
        <dl class="contact">
          <dt>Email</dt><dd><a href="mailto:${e(profile.email)}">${e(profile.email)}</a></dd>
          <dt>University</dt><dd>${e(profile.university)}</dd>
          <dt>GitHub</dt><dd><a href="${e(github)}">${e(profile.githubUsername)}</a></dd>
        </dl>
      </section>
    </main>
    <footer>© ${Math.max(...publications.map(pub => pub.year))} ${e(profile.name)}</footer>
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${url}sitemap.xml\n`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(url)}</loc></url></urlset>\n`);
console.log(`Built index.html with ${publications.length} publications. Public URL: ${url}`);
