const ECOSYSTEM_URL = "https://dreadstache.github.io/careeros/generated/ecosystem.json";
const fallbackDestinations = [
  { id: "tech", label: "Tech & Systems", description: "Analytics, GIS, software, and automation.", url: "https://dreadstache.github.io/luccote-portfolio/", status: "live" },
  { id: "three-d", label: "Games, Film & 3D", description: "Interactive models and technical art.", url: "./", status: "live" },
  { id: "music", label: "Music", description: "Dreadstache releases and production.", url: "https://dreadstache.com/", status: "live" },
  { id: "resumes", label: "Résumé Library", description: "Focused, verified career stories.", url: "https://dreadstache.github.io/careeros/generated/resume/", status: "live" },
];

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = String(value || "");
  return node.innerHTML;
}

function renderWorkLinks(destinations) {
  const destinationLinks = destinations.filter((item) => item.status === "live" && item.url).map((item) => `<a href="${item.id === "three-d" ? "./" : item.url}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></a>`).join("");
  document.querySelector("#work-links").innerHTML = `${destinationLinks}<a href="archive.html" aria-current="page"><strong>The Archive</strong><span>Earlier work, production history, and creative foundations.</span></a>`;
}

function renderArchive(archive) {
  const visiblePages = archive.pages.filter((page) => page.slug !== "references");
  document.querySelector("#archive-date").textContent = `PRESERVED / ${archive.archivedAt.slice(0, 10)}`;
  document.querySelector("#archive-counts").innerHTML = `<span><strong>${archive.counts.images}</strong> STILLS</span><span><strong>${archive.counts.videos}</strong> VIDEOS</span><span><strong>${visiblePages.length}</strong> COLLECTIONS</span>`;
  document.querySelector("#archive-index").innerHTML = visiblePages.map((page, index) => `<a href="#${page.slug}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(page.title)}</a>`).join("");
  document.querySelector("#archive-collections").innerHTML = visiblePages.map((page, index) => {
    const copy = page.text.filter((block) => block.kind === "p").slice(0, 4).map((block) => `<p>${escapeHtml(block.text)}</p>`).join("");
    const videos = page.videos.length ? `<div class="archiveVideoGrid">${page.videos.map((video) => `<a href="${video.url}" target="_blank" rel="noreferrer"><img src="${video.thumbnail}" alt="" loading="lazy"><span><strong>${escapeHtml(video.title)}</strong><small>WATCH ON YOUTUBE ↗</small></span></a>`).join("")}</div>` : "";
    const images = page.images.length ? `<div class="archiveImageGrid">${page.images.map((image, imageIndex) => `<a href="${image.src}" target="_blank" rel="noreferrer"><img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy"><span>${escapeHtml(page.title)} / ${String(imageIndex + 1).padStart(2, "0")}</span></a>`).join("")}</div>` : "";
    const links = page.links.length ? `<div class="archiveLinks"><span>ORIGINAL LINKS</span>${page.links.slice(0, 8).map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`).join("")}</div>` : "";
    return `<details class="archiveCollection" id="${page.slug}" ${index === 0 ? "open" : ""}><summary><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(page.title)}</strong><small>${page.images.length} STILLS · ${page.videos.length} VIDEOS</small></summary><div class="archiveCollectionBody">${copy ? `<div class="archiveCopy">${copy}</div>` : ""}${videos}${images}${links}</div></details>`;
  }).join("");
}

renderWorkLinks(fallbackDestinations);
fetch(ECOSYSTEM_URL, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((manifest) => Array.isArray(manifest.destinations) && renderWorkLinks(manifest.destinations)).catch(() => undefined);
fetch("legacy-work/manifest.json").then((response) => response.ok ? response.json() : Promise.reject()).then(renderArchive).catch(() => { document.querySelector("#archive-collections").innerHTML = '<div class="emptyLibrary">The archive could not be opened. Please try again shortly.</div>'; });
