import { WorkSwitcher } from "../work-switcher";

export default function AboutPage() {
  return (
    <main className="aboutPage">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lucien Marcel Cote portfolio home">
          <span className="brandmark">L</span>
          <span>LUCIEN MARCEL COTE<br/><small>GAMES / FILM PORTFOLIO</small></span>
        </a>
        <nav aria-label="Primary">
          <a href="/">VIEWER</a>
          <a href="/#collection">COLLECTION</a>
          <a href="/archive">ARCHIVE</a>
          <a className="active" href="/about">ABOUT</a>
        </nav>
        <WorkSwitcher />
      </header>

      <section className="aboutHero">
        <div className="aboutIndex">ABOUT / 01</div>
        <div className="aboutIntro">
          <p className="eyebrow">ARTIST · DESIGNER · TECHNICAL CREATOR</p>
          <h1>LUCIEN<br/>MARCEL COTE</h1>
          <p className="aboutLead">
            A multidisciplinary creator working where art, technology, and
            interactive storytelling meet.
          </p>
        </div>
        <div className="aboutMark" aria-hidden="true">L</div>
      </section>

      <section className="aboutGrid">
        <article>
          <span>01 / PROFILE</span>
          <h2>BUILDING WORLDS WITH A TECHNICAL EYE.</h2>
          <p>
            Lucien Marcel Cote is a multidisciplinary game developer, 3D artist,
            and educator whose work spans Unreal Engine, Unity, gameplay
            programming, technical art, photogrammetry, digital sculpture, and
            real-time experiences for games and film. Alongside creative
            production, he brings deep experience in data analysis, SQL,
            database management, reporting, and business intelligence—using
            analytical rigor to build clearer systems and better decisions. In
            music, he writes and produces as{" "}
            <a href="https://dreadstache.com" target="_blank" rel="noreferrer">Dreadstache</a>,
            an electronic alter ego where sound design, performance, and
            technology collide.
          </p>
        </article>
        <article>
          <span>02 / PRACTICE</span>
          <h2>FROM CAPTURE TO PRESENTATION.</h2>
          <p>
            The work moves fluidly between artistic exploration and production:
            shaping models, evaluating form and materials, developing technical
            workflows, and presenting finished assets in an interactive context.
          </p>
        </article>
        <article className="contactCard">
          <span>03 / CONTACT</span>
          <h2>LET&apos;S MAKE SOMETHING MEMORABLE.</h2>
          <p>For projects, collaborations, and portfolio inquiries:</p>
          <a href="mailto:info@luccote.com">info@luccote.com <b>↗</b></a>
        </article>
      </section>

      <footer>
        <span>LUCIEN MARCEL COTE / 2026</span>
        <p>Games, film, 3D art, and interactive development.</p>
        <a href="/">RETURN TO VIEWER ↑</a>
      </footer>
    </main>
  );
}
