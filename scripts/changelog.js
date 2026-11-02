import { readFileSync, writeFileSync } from "node:fs";
import { changelogPage } from "./changelog-page.js";

/**
 * `npm run changelog`: web/changelog.html, linked from the page, from its data, docs/changelog.json. A new version is a
 * new first entry of `versions` there, with its commits; then this script, and both files are committed.
 */
const ROOT = new URL("../", import.meta.url);
const data = JSON.parse(readFileSync(new URL("docs/changelog.json", ROOT), "utf8"));
writeFileSync(new URL("web/changelog.html", ROOT), changelogPage(data));
console.log(`web/changelog.html : ${data.versions.length} version(s), la dernière ${data.versions[0].version}`);
