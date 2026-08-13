import archive from "../../public/legacy-work/manifest.json";
import { WorkSwitcher } from "../work-switcher";

type TextBlock = { kind: string; text: string };

function pageIntroduction(blocks: TextBlock[]) {
  return blocks.filter((block) => block.kind === "p").slice(0, 4);
}

export default function ArchivePage() {
  return (
    <main className="archivePage">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lucien Marcel Cote portfolio home">
          <span className="brandmark">L</span>
          <span>LUCIEN MARCEL COTE<br/><small>EARLIER WORK &amp; FOUNDATIONS</small></span>
        </a>
        <nav aria-label="Primary">
          <a href="/">VIEWER</a>
          <a href="/#collection">COLLECTION</a>
          <a className="active" href="/archive">ARCHIVE</a>
          <a href="/about">ABOUT</a>
        </nav>
        <WorkSwitcher archiveCurrent />
      </header>

      <section className="archiveHero">
        <div className="archiveEyebrow">PRESERVED / {archive.archivedAt.slice(0, 10)}</div>
        <h1>THE ARCHIVE</h1>
        <p>Earlier work and foundations: character art, production experiments, game assets, technical studies, and the projects that shaped the practice.</p>
        <div className="archiveCounts" aria-label="Archive totals">
          <span><strong>{archive.counts.images}</strong> STILLS</span>
          <span><strong>{archive.counts.videos}</strong> VIDEOS</span>
          <span><strong>{archive.counts.pages}</strong> COLLECTIONS</span>
        </div>
      </section>

      <nav className="archiveIndex" aria-label="Archive collections">
        {archive.pages.map((page, index) => <a key={page.slug} href={`#${page.slug}`}><span>{String(index + 1).padStart(2, "0")}</span>{page.title}</a>)}
      </nav>

      <div className="archiveCollections">
        {archive.pages.map((page, index) => (
          <details className="archiveCollection" id={page.slug} key={page.slug} open={index === 0}>
            <summary>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{page.title}</strong>
              <small>{page.images.length} STILLS · {page.videos.length} VIDEOS</small>
            </summary>
            <div className="archiveCollectionBody">
              {pageIntroduction(page.text).length > 0 && <div className="archiveCopy">
                {pageIntroduction(page.text).map((block, blockIndex) => <p key={`${page.slug}-copy-${blockIndex}`}>{block.text}</p>)}
              </div>}
              {page.videos.length > 0 && <div className="archiveVideoGrid">
                {page.videos.map((video) => <a key={video.id} href={video.url} target="_blank" rel="noreferrer">
                  <img src={video.thumbnail} alt="" loading="lazy"/>
                  <span><strong>{video.title}</strong><small>WATCH ON YOUTUBE ↗</small></span>
                </a>)}
              </div>}
              {page.images.length > 0 && <div className="archiveImageGrid">
                {page.images.map((image, imageIndex) => <a key={image.src} href={`/${image.src}`} target="_blank" rel="noreferrer">
                  <img src={`/${image.src}`} alt={image.alt} loading="lazy"/>
                  <span>{page.title} / {String(imageIndex + 1).padStart(2, "0")}</span>
                </a>)}
              </div>}
              {page.links.length > 0 && <div className="archiveLinks">
                <span>ORIGINAL LINKS</span>
                {page.links.slice(0, 8).map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
              </div>}
            </div>
          </details>
        ))}
      </div>

      <section className="archiveNote">
        <span>ARCHIVE NOTE</span>
        <p>This material was automatically preserved from the previous luccote.com portfolio. The complete source snapshot is retained privately; this page presents a public-safe, lightweight collection.</p>
      </section>
      <footer><span>LUCIEN MARCEL COTE / 2026</span><p>Earlier work is not dead weight. It is the foundation.</p><a href="#top">RETURN TO TOP ↑</a></footer>
    </main>
  );
}
