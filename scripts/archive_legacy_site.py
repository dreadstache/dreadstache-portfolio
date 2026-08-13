"""Archive the current luccote.com Google Site and build a public-safe manifest.

The complete HTML snapshot stays in the ignored, OneDrive-synced
``legacy-source-archive`` directory. Public portfolio assets and a sanitized
manifest are written to ``public/legacy-work``.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ORIGIN = "https://www.luccote.com"
ROUTES = (
    ("videos", "/videos", "Videos & Production Work"),
    ("sculpting", "/sculpting", "Sculpting"),
    ("rigging-and-skinning", "/rigging-and-skinning", "Rigging & Skinning"),
    ("low-poly-work", "/low-poly-work", "Low-Poly & Game Assets"),
    ("gallery", "/gallery", "Still Gallery"),
    ("references", "/references", "Professional References"),
    ("resume-contact", "/resume-contact", "Profile & Tools"),
)
PRIVATE_ROOT = ROOT / "legacy-source-archive"
PUBLIC_ROOT = ROOT / "public" / "legacy-work"
HEADERS = {"User-Agent": "CareerOS legacy portfolio archiver/1.0"}
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
YOUTUBE_RE = re.compile(r"youtube\.com/embed/([A-Za-z0-9_-]+)")


def clean_text(value: str) -> str:
    return " ".join(value.split())


def public_text(value: str) -> str:
    return EMAIL_RE.sub("[contact archived privately]", clean_text(value))


def extension_for(response: requests.Response) -> str:
    content_type = response.headers.get("content-type", "").split(";", 1)[0]
    return mimetypes.guess_extension(content_type) or ".jpg"


def youtube_metadata(session: requests.Session, video_id: str) -> dict[str, str]:
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        response = session.get(
            "https://www.youtube.com/oembed",
            params={"url": url, "format": "json"},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        title = clean_text(payload.get("title", "")) or f"Archived video {video_id}"
        thumbnail = payload.get("thumbnail_url") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    except (requests.RequestException, ValueError):
        title = f"Archived video {video_id}"
        thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    return {"id": video_id, "title": title, "url": url, "thumbnail": thumbnail}


def main() -> None:
    pages_dir = PRIVATE_ROOT / "pages"
    assets_dir = PRIVATE_ROOT / "assets"
    public_assets = PUBLIC_ROOT / "assets"
    for directory in (pages_dir, assets_dir, public_assets):
        if directory.exists():
            shutil.rmtree(directory)
    for directory in (pages_dir, assets_dir, public_assets):
        directory.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update(HEADERS)
    downloaded: dict[str, str] = {}
    pages: list[dict[str, object]] = []
    all_videos: dict[str, dict[str, str]] = {}

    for slug, route, label in ROUTES:
        url = urljoin(SOURCE_ORIGIN, route)
        response = session.get(url, timeout=45)
        response.raise_for_status()
        html = response.text
        (pages_dir / f"{slug}.html").write_text(html, encoding="utf-8")
        soup = BeautifulSoup(html, "html.parser")

        text_blocks: list[dict[str, str]] = []
        seen_text: set[str] = set()
        for node in soup.find_all(["h1", "h2", "h3", "p"]):
            text = clean_text(node.get_text(" ", strip=True))
            if (
                not text
                or text in seen_text
                or text in {"Google Sites", "Report abuse", "Page details", "Page updated"}
            ):
                continue
            seen_text.add(text)
            text_blocks.append({"kind": node.name, "text": public_text(text)})

        images: list[dict[str, str]] = []
        for index, image in enumerate(soup.find_all("img"), 1):
            source = image.get("src")
            if not source or "googleusercontent.com" not in source:
                continue
            if source not in downloaded:
                asset_response = session.get(source, timeout=60)
                asset_response.raise_for_status()
                digest = hashlib.sha256(source.encode("utf-8")).hexdigest()[:12]
                filename = f"{slug}-{index:02d}-{digest}{extension_for(asset_response)}"
                (assets_dir / filename).write_bytes(asset_response.content)
                (public_assets / filename).write_bytes(asset_response.content)
                downloaded[source] = filename
            filename = downloaded[source]
            images.append(
                {
                    "src": f"legacy-work/assets/{filename}",
                    "alt": f"Archived {label} portfolio image {index}",
                    "source": source,
                }
            )

        videos: list[dict[str, str]] = []
        for frame in soup.find_all("iframe"):
            source = frame.get("src", "")
            match = YOUTUBE_RE.search(source)
            if not match:
                continue
            video_id = match.group(1)
            if video_id not in all_videos:
                all_videos[video_id] = youtube_metadata(session, video_id)
            if all_videos[video_id] not in videos:
                videos.append(all_videos[video_id])

        links: list[dict[str, str]] = []
        seen_links: set[str] = set()
        for anchor in soup.find_all("a", href=True):
            href = urljoin(url, anchor["href"])
            if href.lower().startswith("mailto:"):
                continue
            host = urlparse(href).netloc.lower()
            label_text = public_text(anchor.get_text(" ", strip=True))
            if not label_text or href in seen_links or host in {"www.luccote.com", "luccote.com"}:
                continue
            if host.endswith("google.com") or "sites.google" in host:
                continue
            seen_links.add(href)
            links.append({"label": label_text, "url": href})

        pages.append(
            {
                "slug": slug,
                "title": label,
                "sourceUrl": url,
                "text": text_blocks,
                "images": images,
                "videos": videos,
                "links": links,
            }
        )

    archived_at = datetime.now(timezone.utc).isoformat()
    manifest = {
        "schemaVersion": "1.0",
        "archivedAt": archived_at,
        "source": SOURCE_ORIGIN,
        "title": "The Archive: Earlier Work & Foundations",
        "description": "A preserved collection of earlier character art, production work, experiments, and professional foundations.",
        "pages": pages,
        "counts": {
            "pages": len(pages),
            "images": sum(len(page["images"]) for page in pages),
            "videos": len(all_videos),
        },
    }
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    (PUBLIC_ROOT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PRIVATE_ROOT / "manifest-full.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    inventory = [
        "# luccote.com legacy archive",
        "",
        f"Archived: {archived_at}",
        f"Pages: {manifest['counts']['pages']}",
        f"Images: {manifest['counts']['images']}",
        f"YouTube videos preserved by ID: {manifest['counts']['videos']}",
        "",
        "Raw HTML and original downloaded images are retained here. The public-safe copy is generated under public/legacy-work.",
    ]
    (PRIVATE_ROOT / "README.md").write_text("\n".join(inventory) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"], indent=2))


if __name__ == "__main__":
    main()
