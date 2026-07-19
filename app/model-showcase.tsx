"use client";

import Script from "next/script";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type SavedModel = { id: string; name: string; size: number; uploadedAt: string; url: string };

const pieces = [
  { title: "Arkane Face I", kind: "Character / 3D Scan", file: "arkaneface1.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784417087598-d90cf37c-bbf3-4c13-95dc-a926a3aeb9e0-arkaneface1.glb", camera: "0deg 75deg 2.4m" },
  { title: "Arkane Face II", kind: "Character / 3D Scan", file: "arkaneface2.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784416637041-74b4482d-3272-4e33-98fd-64f9d729be0d-arkaneface2.glb", camera: "20deg 75deg 2.4m" },
  { title: "Arkane Face III", kind: "Character / 3D Scan", file: "arkaneface3.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784417768792-057e6fc8-ca6a-4ddc-b5e3-df1df0198a2f-arkaneface3.glb", camera: "-20deg 75deg 2.4m" },
];

const presets = [
  { name: "Crimson", exposure: 0.75, shadow: 1.1, color: "#ff2f75", bg: "#3b0814" },
  { name: "Ember", exposure: 1.15, shadow: 0.7, color: "#ff734c", bg: "#160b08" },
  { name: "Gallery", exposure: 1.4, shadow: 0.45, color: "#fff5df", bg: "#d8d2c7" },
];

export default function ModelShowcase({ studioMode = false }: { studioMode?: boolean }) {
  const [active, setActive] = useState(0);
  const [modelSrc, setModelSrc] = useState(pieces[0].src);
  const [uploadedName, setUploadedName] = useState("");
  const [exposure, setExposure] = useState(0.2);
  const [shadow, setShadow] = useState(2.0);
  const [lightColor, setLightColor] = useState("#ff2f75");
  const [background, setBackground] = useState("#3b0814");
  const [lightX, setLightX] = useState(38);
  const [lightY, setLightY] = useState(22);
  const [rotate, setRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [panel, setPanel] = useState<"light" | "model">("light");
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [canImport, setCanImport] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const objectUrl = useRef<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const piece = pieces[active];

  useEffect(() => {
    fetch("/api/models")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { models: SavedModel[]; canImport: boolean }) => {
        setSavedModels(data.models);
        setCanImport(data.canImport);
        if (!studioMode && data.models.length) {
          setActive(0);
          setIsModelLoading(true);
          setLoadProgress(0);
          setModelSrc(data.models[0].url);
          setUploadedName(data.models[0].name);
        }
      })
      .catch(() => setUploadMessage("Showcase library is temporarily unavailable."));
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const finishLoading = () => {
      setLoadProgress(1);
      setIsModelLoading(false);
    };
    const updateProgress = (event: Event) => {
      const nextProgress = (event as CustomEvent<{ totalProgress?: number }>).detail?.totalProgress;
      if (typeof nextProgress !== "number") return;
      setLoadProgress(nextProgress);
      if (nextProgress >= 0.999) finishLoading();
    };

    viewer.addEventListener("load", finishLoading);
    viewer.addEventListener("progress", updateProgress);
    viewer.addEventListener("error", finishLoading);
    return () => {
      viewer.removeEventListener("load", finishLoading);
      viewer.removeEventListener("progress", updateProgress);
      viewer.removeEventListener("error", finishLoading);
    };
  }, []);

  const glow = useMemo(() => ({
    background: `radial-gradient(circle at ${lightX}% ${lightY}%, ${lightColor}66 0, ${lightColor}18 20%, transparent 47%)`,
  }), [lightColor, lightX, lightY]);

  function selectPiece(index: number) {
    setActive(index);
    setIsModelLoading(true);
    setLoadProgress(0);
    setModelSrc(pieces[index].src);
    setUploadedName("");
  }

  async function uploadModel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setUploadState("error"); setUploadMessage("That model is over the 100 MB limit."); return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "glb";
    const originalName = file.name.replace(/\.(glb|gltf)$/i, "");
    const requestedName = window.prompt("Name this model for the showcase:", originalName);
    if (requestedName === null) { event.target.value = ""; return; }
    const displayName = `${requestedName.trim().replace(/\.(glb|gltf)$/i, "") || originalName}.${extension}`;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setIsModelLoading(true);
    setLoadProgress(0);
    setModelSrc(objectUrl.current);
    setUploadedName(displayName);
    setUploadState("saving"); setUploadMessage("Saving model to the shared library…");

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream", "x-model-name": encodeURIComponent(displayName) },
        body: file,
      });
      const data = await response.json() as { model?: SavedModel; error?: string };
      if (!response.ok || !data.model) throw new Error(data.error || "Upload failed");
      setSavedModels((current) => [data.model!, ...current.filter((item) => item.id !== data.model!.id)]);
      setModelSrc(data.model.url);
      setUploadState("saved"); setUploadMessage("Saved. Visitors can now select this model.");
    } catch (error) {
      setUploadState("error"); setUploadMessage(error instanceof Error ? error.message : "The model could not be saved.");
    } finally {
      event.target.value = "";
    }
  }

  function selectSavedModel(model: SavedModel) {
    setIsModelLoading(true); setLoadProgress(0);
    setActive(0); setModelSrc(model.url); setUploadedName(model.name);
    setUploadState("saved"); setUploadMessage("Viewing a saved library model.");
  }

  async function removeSavedModel(model: SavedModel) {
    const displayName = model.name.replace(/\.(glb|gltf)$/i, "");
    if (!window.confirm(`Remove “${displayName}” from the presentation library? This cannot be undone.`)) return;

    setRemovingId(model.id);
    setUploadState("saving");
    setUploadMessage(`Removing ${displayName}…`);
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(model.id)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "The model could not be removed.");
      setSavedModels((current) => current.filter((item) => item.id !== model.id));
      if (modelSrc === model.url) selectPiece(0);
      setUploadState("saved");
      setUploadMessage(`${displayName} was removed from the library.`);
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "The model could not be removed.");
    } finally {
      setRemovingId("");
    }
  }

  function moveCarousel(direction: number) {
    carouselRef.current?.scrollBy({ left: direction * 190, behavior: "smooth" });
  }

  function applyPreset(preset: typeof presets[number]) {
    setExposure(preset.exposure); setShadow(preset.shadow);
    setLightColor(preset.color); setBackground(preset.bg);
  }

  const viewerProps: Record<string, unknown> = {
    ref: viewerRef,
    src: modelSrc,
    alt: `Interactive 3D view of ${uploadedName || piece.title}`,
    "camera-controls": true,
    "touch-action": "pan-y",
    "shadow-intensity": shadow,
    exposure,
    "camera-orbit": piece.camera,
    "environment-image": "neutral",
    "interaction-prompt": "none",
    ...(rotate ? { "auto-rotate": true, "rotation-per-second": "12deg" } : {}),
  };

  return (
    <main>
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Lucien Marcel Cote portfolio home"><span className="brandmark">L</span><span>LUCIEN MARCEL COTE<br/><small>{studioMode ? "OWNER MODEL STUDIO" : "GAMES / FILM PORTFOLIO"}</small></span></a>
        <nav aria-label="Primary"><a className="active" href="#viewer">VIEWER</a><a href="#collection">COLLECTION</a><a href="#about">ABOUT</a></nav>
        <a className="techLink" href="https://www.luccote.com" target="_blank" rel="noreferrer">TECH SITE <span>↗</span></a>
      </header>

      <section id="viewer" className={studioMode ? "workspace bottomLibraryWorkspace studioWorkspace" : "workspace bottomLibraryWorkspace publicWorkspace"}>
        <aside className="collection" id="collection">
          <div className="sectionLabel"><span>01</span> {studioMode ? "MODEL LIBRARY" : "SELECT MODEL"}</div>
          <div className="studioLibraryBar"><div className="libraryHead"><span>{studioMode ? "SAVED MODELS" : "SHOWCASE MODELS"}</span><div><button aria-label="Previous models" onClick={() => moveCarousel(-1)}>←</button><button aria-label="Next models" onClick={() => moveCarousel(1)}>→</button></div></div>
          <div className="modelCarousel" ref={carouselRef} aria-label={studioMode ? "Saved model row" : "Showcase model row"}>
            {savedModels.length ? savedModels.map((model, index) => <div key={model.id} className={modelSrc === model.url ? "savedCard selectedCard" : "savedCard"}>
              <button className="savedSelect" onClick={() => selectSavedModel(model)}>
                <span className="savedGlyph">{String(index + 1).padStart(2, "0")}</span><strong>{model.name.replace(/\.(glb|gltf)$/i, "")}</strong><small>{(model.size / 1024 / 1024).toFixed(1)} MB · {studioMode ? "SAVED" : "VIEW"}</small>
              </button>
              {studioMode && canImport && <button className="removeModel" disabled={removingId === model.id} aria-label={`Remove ${model.name} from library`} onClick={() => removeSavedModel(model)}>{removingId === model.id ? "REMOVING…" : "REMOVE"}</button>}
            </div>) : <div className="emptyLibrary">{studioMode ? "Your saved models will appear here." : "The next collection is being prepared."}</div>}
          </div></div>
          {studioMode && canImport && <div className="uploadCard">
            <span>ADD TO LIBRARY</span><strong>{uploadedName || "Upload a model"}</strong><p>GLB or GLTF, up to 100 MB. Uploaded models are saved for visitors to view.</p>
            <label className={uploadState === "saving" ? "isSaving" : ""}>{uploadState === "saving" ? "SAVING…" : "CHOOSE & SAVE FILE"}<input disabled={uploadState === "saving"} type="file" accept=".glb,.gltf" onChange={uploadModel}/></label>
            {uploadMessage && <p className={`uploadStatus ${uploadState}`}>{uploadMessage}</p>}
          </div>}
        </aside>

        <section className="stage" style={{ backgroundColor: background }}>
          <div className="stageGlow" style={glow}/>
          <div className={wireframe ? "viewerWrap wireframe" : "viewerWrap"}>
            {React.createElement("model-viewer", viewerProps)}
          </div>
          <div className={isModelLoading ? "modelLoader isVisible" : "modelLoader"} aria-live="polite" aria-hidden={!isModelLoading}>
            <div className="loaderRing"><span/></div>
            <strong>LOADING MODEL</strong>
            <div className="loaderTrack"><span style={{ width: `${Math.max(4, Math.round(loadProgress * 100))}%` }}/></div>
            <small>{Math.round(loadProgress * 100)}% · PREPARING 3D VIEW</small>
          </div>
          <div className="stageTop"><span className="statusDot"/> LIVE VIEWPORT <span className="divider"/> {uploadedName || piece.file}</div>
          <div className="viewportHint">DRAG TO ORBIT <span>•</span> SCROLL TO ZOOM</div>
          <div className="modelTitle"><span>{piece.kind.toUpperCase()}</span><h1>{uploadedName ? uploadedName.replace(/\.(glb|gltf)$/i, "") : piece.title}</h1><p>{uploadedName ? "CUSTOM IMPORT" : `${piece.polys} POLYGONS`}</p></div>
          <div className="stageActions"><button onClick={() => setRotate(!rotate)} className={rotate ? "isOn" : ""}>↻ AUTO ROTATE</button><button onClick={() => setWireframe(!wireframe)} className={wireframe ? "isOn" : ""}>◇ EDGES</button></div>
        </section>

        <aside className="controls">
          <div className="sectionLabel"><span>02</span> SCENE SETTINGS</div>
          <div className="tabs"><button className={panel === "light" ? "selected" : ""} onClick={() => setPanel("light")}>LIGHT</button><button className={panel === "model" ? "selected" : ""} onClick={() => setPanel("model")}>MODEL</button></div>
          {panel === "light" ? <>
            <Control label="EXPOSURE" value={exposure} min={0.2} max={2} step={0.05} setValue={setExposure}/>
            <Control label="SHADOW" value={shadow} min={0} max={2} step={0.05} setValue={setShadow}/>
            <Control label="LIGHT X" value={lightX} min={0} max={100} step={1} setValue={setLightX}/>
            <Control label="LIGHT Y" value={lightY} min={0} max={100} step={1} setValue={setLightY}/>
            <div className="colorRow"><label>LIGHT COLOR</label><input aria-label="Light color" type="color" value={lightColor} onChange={e => setLightColor(e.target.value)}/><code>{lightColor.toUpperCase()}</code></div>
            <div className="colorRow"><label>BACKDROP</label><input aria-label="Backdrop color" type="color" value={background} onChange={e => setBackground(e.target.value)}/><code>{background.toUpperCase()}</code></div>
            <div className="presets"><label>LIGHTING PRESETS</label>{presets.map(p => <button key={p.name} onClick={() => applyPreset(p)}><span style={{background:p.color}}/>{p.name}</button>)}</div>
          </> : <>
            <div className="modelPanel"><label>ACTIVE ASSET</label><strong>{uploadedName || piece.file}</strong><p>Physically based materials and embedded animation are preserved by the viewer.</p></div>
            <button className="fullButton" onClick={() => setRotate(!rotate)}>{rotate ? "PAUSE TURNTABLE" : "START TURNTABLE"}</button>
            <button className="fullButton" onClick={() => setWireframe(!wireframe)}>{wireframe ? "HIDE EDGE STUDY" : "SHOW EDGE STUDY"}</button>
          </>}
          <div className="saveNote"><span>{studioMode ? "OWNER REVIEW WORKSPACE" : "CLIENT SHOWCASE"}</span><p>{studioMode ? "Uploaded models remain available in your private evaluation library." : "A curated presentation of selected Lucien Marcel Cote artwork."}</p></div>
        </aside>
      </section>
      <footer id="about"><span>LUCIEN MARCEL COTE / 2026</span><p>A focused showcase for original game and film development artwork.</p><span>GAMES / FILM PORTFOLIO</span></footer>
    </main>
  );
}

function Control({label, value, min, max, step, setValue}:{label:string;value:number;min:number;max:number;step:number;setValue:(n:number)=>void}) {
  return <div className="control"><div><label>{label}</label><output>{value.toFixed(step < 1 ? 2 : 0)}</output></div><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => setValue(Number(e.target.value))}/></div>;
}
