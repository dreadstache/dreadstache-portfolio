import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("GitHub Pages exports use the games.luccote.com domain and distinct titles", async () => {
  const [home, archive, cname] = await Promise.all([
    read("github-pages/index.html"),
    read("github-pages/archive.html"),
    read("github-pages/CNAME"),
  ]);

  assert.match(home, /<title>Luc Cote \| Games, Film & 3D<\/title>/);
  assert.match(home, /<link rel="canonical" href="https:\/\/games\.luccote\.com\/">/);
  assert.match(archive, /<title>The Archive \| Luc Cote — Games, Film & 3D<\/title>/);
  assert.match(archive, /<link rel="canonical" href="https:\/\/games\.luccote\.com\/archive\.html">/);
  assert.equal(cname.trim(), "games.luccote.com");
});

test("public navigation no longer advertises GitHub repository URLs", async () => {
  const sources = await Promise.all([
    read("app/work-switcher.tsx"),
    read("github-pages/app.js"),
    read("github-pages/archive.js"),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /dreadstache\.github\.io/);
    assert.match(source, /https:\/\/www\.luccote\.com\//);
    assert.match(source, /https:\/\/music\.luccote\.com\//);
    assert.match(source, /https:\/\/resume\.luccote\.com\//);
  }

  assert.match(sources[0], /https:\/\/games\.luccote\.com\//);
  assert.match(sources[1], /url: "\.\/"/);
  assert.match(sources[2], /url: "\.\/"/);
});
