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
          <a className="active" href="/about">ABOUT</a>
        </nav>
        <a className="techLink" href="https://www.luccote.com" target="_blank" rel="noreferrer">TECH SITE <span>↗</span></a>
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
            Lucien Marcel Cote creates 3D artwork and interactive experiences
            for games, film, and emerging media. His practice combines digital
            sculpture, scanning, visual development, and real-time tools to turn
            physical ideas into expressive virtual work.
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
