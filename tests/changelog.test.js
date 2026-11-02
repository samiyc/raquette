import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { changelogPage } from "../scripts/changelog-page.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("the journal of versions", () => {
  it("is what its data gives: after a new version, npm run changelog", () => {
    const data = JSON.parse(read("docs/changelog.json"));
    assert.equal(read("web/changelog.html").replaceAll("\r\n", "\n"), changelogPage(data));
  });

  it("escapes its text", () => {
    const page = changelogPage({
      name: "a<b",
      back: "c",
      intro: "d",
      versions: [{ version: "1", title: "e&f", date: "g", items: ["h<i"], commits: ["j"] }],
    });
    assert.match(page, /a&lt;b/);
    assert.match(page, /e&amp;f/);
    assert.match(page, /h&lt;i/);
  });
});
