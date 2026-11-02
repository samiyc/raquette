/**
 * The journal of versions as a page, from the data of docs/changelog.json (the same shape as mcts-cuisine's, without
 * its table of gains: there is no search to measure yet). Apart from scripts/changelog.js, so that a test can compare.
 */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const versionHtml = (v) => `
      <article class="version">
        <h3><span class="tag">${v.version}</span> ${esc(v.title)} <span class="date">${v.date}</span></h3>
        <ul>
          ${v.items.map((item) => `<li>${esc(item)}</li>`).join("\n          ")}
        </ul>
        <p class="commits">${v.commits.map((c) => `<code>${c}</code>`).join(" ")}</p>
      </article>`;

export const changelogPage = (project) => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Journal des versions</title>
    <link rel="stylesheet" href="../node_modules/mcts-commun/web/theme.css" />
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="changelog.css" />
  </head>
  <body>
    <header class="masthead">
      <p class="links"><a href="index.html">← ${esc(project.back)}</a></p>
      <h1>${esc(project.name)} : journal des versions</h1>
      <p>${esc(project.intro)}</p>
    </header>
    <main class="changelog">
      <section>
        <h2>Les versions</h2>
${project.versions.map(versionHtml).join("\n")}
      </section>
      <p class="hint">Le détail, les chiffres et leurs sources sont dans <code>docs/modele.md</code> et <code>docs/recherche/chiffres.md</code>.</p>
    </main>
  </body>
</html>
`;
