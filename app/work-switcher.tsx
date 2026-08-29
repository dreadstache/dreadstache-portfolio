"use client";

import { useEffect, useState } from "react";

type Destination = {
  id: string;
  label: string;
  description: string;
  url: string;
  status: string;
};

const ecosystemUrl = "https://resume.luccote.com/generated/ecosystem.json";
const fallbackDestinations: Destination[] = [
  { id: "tech", label: "Tech & Systems", description: "Analytics, GIS, software, and automation.", url: "https://www.luccote.com/", status: "live" },
  { id: "three-d", label: "Games, Film & 3D", description: "Interactive models and technical art.", url: "https://games.luccote.com/", status: "live" },
  { id: "music", label: "Music", description: "Dreadstache releases and production.", url: "https://music.luccote.com/", status: "live" },
  { id: "resumes", label: "Résumé Library", description: "Focused, verified career stories.", url: "https://resume.luccote.com/", status: "live" },
];

export function WorkSwitcher({ current = "three-d", archiveCurrent = false }: { current?: string; archiveCurrent?: boolean }) {
  const [destinations, setDestinations] = useState(fallbackDestinations);

  useEffect(() => {
    fetch(ecosystemUrl, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(manifest => {
        if (Array.isArray(manifest.destinations)) setDestinations(manifest.destinations);
      })
      .catch(() => undefined);
  }, []);

  return (
    <details className="workSwitcher">
      <summary>EXPLORE WORK <span aria-hidden="true">▾</span></summary>
      <div className="workSwitcherMenu">
        <p><strong>LUC COTE</strong><span>ONE PRACTICE, SEVERAL WAYS IN.</span></p>
        <div>
          {destinations.filter(destination => destination.status === "live" && destination.url).map(destination => (
            <a key={destination.id} href={destination.url} aria-current={destination.id === current ? "page" : undefined}>
              <strong>{destination.label}</strong>
              <span>{destination.description}</span>
            </a>
          ))}
          <a href="/archive" aria-current={archiveCurrent ? "page" : undefined}>
            <strong>The Archive</strong>
            <span>Earlier work, production history, and creative foundations.</span>
          </a>
        </div>
      </div>
    </details>
  );
}
