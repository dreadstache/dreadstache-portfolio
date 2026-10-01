"use client";

import Script from "next/script";
import { createLightingEnvironment } from "./lighting";
import { moveToTarget, validateUpload, uploadSequentially } from "./studio-interactions";
import { WorkSwitcher } from "./work-switcher";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type SavedModel = { id: string; name: string; size: number; uploadedAt: string; url: string };

const pieces = [
  { title: "Arkane Face I", kind: "Character / 3D Scan", file: "arkaneface1.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784417087598-d90cf37c-bbf3-4c13-95dc-a926a3aeb9e0-arkaneface1.glb", camera: "0deg 75deg 2.4m" },
  { title: "Arkane Face II", kind: "Character / 3D Scan", file: "arkaneface2.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784416637041-74b4482d-3272-4e33-98fd-64f9d729be0d-arkaneface2.glb", camera: "20deg 75deg 2.4m" },
  { title: "Arkane Face III", kind: "Character / 3D Scan", file: "arkaneface3.glb", polys: "ORIGINAL SCAN", src: "/api/models/1784417768792-057e6fc8-ca6a-4ddc-b5e3-df1df0198a2f-arkaneface3.glb", camera: "-20deg 75deg 2.4m" },
];

const presets = [
  { name: "Neutral", exposure: 1, shadow: 0.6, color: "#ffffff", bg: "#3b0814" },
  { name: "Crimson", exposure: 0.75, shadow: 1.1, color: "#ff2f75", bg: "#3b0814" },
  { name: "Ember", exposure: 1.15, shadow: 0.7, color: "#ff734c", bg: "#160b08" },
  { name: "Gallery", exposure: 1.4, shadow: 0.45, color: "#fff5df", bg: "#d8d2c7" },
];

export default function ModelShowcase({ studioMode = false }: { studioMode?: boolean }) {
  const [active, setActive] = useState(0);
  const [modelSrc, setModelSrc] = useState(pieces[0].src);
  const [uploadedName, setUploadedName] = useState("");
  const [exposure, setExposure] = useState(1);
  const [shadow, setShadow] = useState(0.6);
  const [lightColor, setLightColor] = useState("#ffffff");
  const [background, setBackground] = useState("#3b0814");
  const [lightX, setLightX] = useState(38);
  const [lightY, setLightY] = useState(22);
  const [rotate, setRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [customLighting, setCustomLighting] = useState(false);
  const [environment, setEnvironment] = useState("neutral");
  useEffect(() => {
    if (!customLighting) { setEnvironment("neutral"); return; }
    let url: string | undefined;
    const timer = window.setTimeout(() => {
      url = URL.createObjectURL(createLightingEnvironment(lightX, lightY, lightColor));
      setEnvironment(url + "#.hdr");
    }, 150);
    return () => { window.clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [customLighting, lightX, lightY, lightColor]);
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);
  const [orderRevision, setOrderRevision] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const orderDirty = savedModels.map(model => model.id).join("|") !== savedOrderIds.join("|");
  const [canImport, setCanImport] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [removingId, setRemovingId] = useState("");
  const uploadLock = useRef(false);
  const dragSource = useRef<string | null>(null);
  const dragTarget = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [fileDropActive, setFileDropActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: string; progress: number }[]>([]);
  const collectionBusy = savingOrder || uploadState === "saving" || Boolean(removingId);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const objectUrl = useRef<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const piece = pieces[active];

  useEffect(() => {
    fetch("/api/models", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { models: SavedModel[]; canImport: boolean; orderRevision: string | null }) => {
        setLibraryStatus(data.models.length ? "ready" : "empty");
        if (!data.models.length) setIsModelLoading(false);
        setSavedModels(data.models);
        setSavedOrderIds(data.models.map(model => model.id));
        setOrderRevision(data.orderRevision);
        setCanImport(data.canImport);
        if (!studioMode && data.models.length) {
          setActive(0);
          setIsModelLoading(true);
          setLoadProgress(0);
          setModelSrc(data.models[0].url);
          setUploadedName(data.models[0].name);
        }
      })
      .catch(() => { setLibraryStatus("error"); setIsModelLoading(false); setUploadMessage("Showcase library is temporarily unavailable."); });
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

  async function uploadFiles(files: File[]) {
    if (!files.length || !canImport || uploadLock.current || collectionBusy) return;
    if (orderDirty) { setUploadMessage("Save or reset your collection order before uploading."); return; }
    uploadLock.current = true;
    setUploadState("saving");
    setUploadQueue(files.map(file => ({ name: file.name, status: "Queued", progress: 0 })));
    const update = (index: number, status: string, progress = 0) => setUploadQueue(current => current.map((item, i) => i === index ? { ...item, status, progress } : item));
    try {
      const result = await uploadSequentially(files, async (file, index) => {
        setUploadMessage(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        const invalid = validateUpload(file);
        if (invalid) { update(index, invalid); throw new Error(invalid); }
        update(index, "Uploading");
        try {
          const data = await new Promise<{ model: SavedModel; models: SavedModel[]; orderRevision: string | null }>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open("POST", "/api/models");
            request.setRequestHeader("content-type", file.type || "application/octet-stream");
            request.setRequestHeader("x-model-name", encodeURIComponent(file.name));
            request.timeout = 600000;
            request.upload.onprogress = event => {
              if (event.lengthComputable) update(index, event.loaded === event.total ? "Saving" : "Uploading", Math.round(event.loaded / event.total * 100));
            };
            request.onload = () => {
              try {
                const data = JSON.parse(request.responseText);
                if (request.status < 200 || request.status >= 300 || !data.model) throw new Error(data.error || "Upload failed");
                resolve(data);
              } catch (error) { reject(error); }
            };
            request.onerror = () => reject(new Error("Connection failed. Choose this file again to retry."));
            request.ontimeout = () => reject(new Error("Upload timed out. Choose this file again to retry."));
            request.send(file);
          });
          setSavedModels(data.models);
          setSavedOrderIds(data.models.map(model => model.id));
          setOrderRevision(data.orderRevision);
          setIsModelLoading(true); setLoadProgress(0);
          setModelSrc(data.model.url); setUploadedName(data.model.name);
          update(index, "Saved", 100);
        } catch (error) {
          update(index, error instanceof Error ? error.message : "Upload failed. Choose this file again to retry.");
          throw error;
        }
      });
      setUploadState(result.failed ? "error" : "saved");
      setUploadMessage(`${result.succeeded} saved${result.failed ? ` · ${result.failed} failed. Choose the failed files again to retry.` : ". Ready to arrange your collection."}`);
    } finally { uploadLock.current = false; }
  }

  function uploadModel(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    void uploadFiles(files);
  }

  function finishDrag(commit: boolean) {
    if (commit && dragSource.current && dragTarget.current && !collectionBusy) {
      const source = dragSource.current, target = dragTarget.current;
      if (source !== target) {
        setSavedModels(current => moveToTarget(current, source, target));
        setOrderMessage("Order changed. Save it to update the public collection.");
      }
    }
    dragSource.current = null; dragTarget.current = null;
    setDraggingId(null); setDropTargetId(null);
  }

  function selectSavedModel(model: SavedModel) {
    if (uploadLock.current) return;
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
      setSavedOrderIds((current) => current.filter(id => id !== model.id));
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

  function moveModel(index: number, direction: number) {
    const target = index + direction;
    if (collectionBusy || target < 0 || target >= savedModels.length) return;
    setSavedModels(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOrderMessage("Order changed. Save it to update the public collection.");
  }

  function resetOrder() {
    const ranks = new Map(savedOrderIds.map((id, index) => [id, index]));
    setSavedModels(current => [...current].sort((a, b) => (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0)));
    setOrderMessage("Unsaved order changes discarded.");
  }

  async function saveOrder() {
    if (!orderDirty || collectionBusy) return;
    setSavingOrder(true);
    setOrderMessage("Saving collection order…");
    try {
      const response = await fetch("/api/models", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: savedModels.map(model => model.id), revision: orderRevision }),
      });
      const data = await response.json() as { models: SavedModel[]; orderRevision: string; error?: string };
      if (!response.ok) throw new Error(data.error || "The order could not be saved.");
      setSavedModels(data.models);
      setSavedOrderIds(data.models.map(model => model.id));
      setOrderRevision(data.orderRevision);
      setOrderMessage("Saved. The public collection now uses this order.");
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : "The order could not be saved. Your changes are still here.");
    } finally { setSavingOrder(false); }
  }

  useEffect(() => {
    if (!orderDirty && uploadState !== "saving") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [orderDirty, uploadState]);

  function stepModel(direction: number) {
    if (savedModels.length < 2) return;
    const current = Math.max(0, savedModels.findIndex(model => model.url === modelSrc));
    selectSavedModel(savedModels[(current + direction + savedModels.length) % savedModels.length]);
  }

  function moveCarousel(direction: number) {
    carouselRef.current?.scrollBy({ left: direction * 190, behavior: "smooth" });
  }

  function applyPreset(preset: typeof presets[number]) {
    setCustomLighting(preset.name !== "Neutral");
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
    "environment-image": environment,
    "tone-mapping": "neutral",
    "interaction-prompt": "none",
    ...(rotate ? { "auto-rotate": true, "rotation-per-second": "12deg" } : {}),
  };

  return (
    <main>
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js" />
      <header className="topbar">
        <div className="brand"><span className="brandmark" aria-hidden="true">L</span><span className="identity-copy"><strong>LUCIEN MARCEL COTE</strong><small>{studioMode ? "OWNER MODEL STUDIO" : "GAMES / FILM PORTFOLIO"}</small></span></div>
        <nav aria-label="Primary"><a className="active" href="#viewer">VIEWER</a>{studioMode && <a href="#collection">COLLECTION</a>}<a href="/archive">ARCHIVE</a><a href="/about">ABOUT</a></nav>
        <WorkSwitcher />
      </header>

      <section id="viewer" className={studioMode ? "workspace bottomLibraryWorkspace studioWorkspace" : "workspace bottomLibraryWorkspace publicWorkspace"}>
        {studioMode && <aside className="collection" id="collection">
          <div className="sectionLabel"><span>01</span> {studioMode ? "MODEL LIBRARY" : "SELECT MODEL"}</div>
          <div className="studioLibraryBar"><div className="libraryHead"><span>{studioMode ? "SAVED MODELS" : "SHOWCASE MODELS"}</span><div>{!studioMode && <a className="archiveShortcut" href="/archive">EARLIER WORK ↗</a>}<button aria-label="Previous models" onClick={() => moveCarousel(-1)}>←</button><button aria-label="Next models" onClick={() => moveCarousel(1)}>→</button></div></div>
          {studioMode && canImport && <div className="orderToolbar">
            <span>Drag a handle to reorder, or use the arrows. Save your arrangement when ready.</span>
            <button type="button" onClick={saveOrder} disabled={!orderDirty || collectionBusy}>{savingOrder ? "SAVING…" : "SAVE ORDER"}</button>
            <button type="button" onClick={resetOrder} disabled={!orderDirty || collectionBusy}>RESET</button>
            <p role="status" aria-live="polite">{orderMessage}</p>
          </div>}
          <div className="modelCarousel" ref={carouselRef} aria-label={studioMode ? "Saved model row" : "Showcase model row"}>
            {savedModels.length ? savedModels.map((model, index) => <div key={model.id} data-model-id={model.id} className={`savedCard${modelSrc === model.url ? " selectedCard" : ""}${draggingId === model.id ? " isDragging" : ""}${dropTargetId === model.id ? " dropTarget" : ""}`}>
              {canImport && <button type="button" className="modelDragHandle" disabled={collectionBusy} aria-label={`Drag ${model.name} to reorder; use Earlier and Later buttons for keyboard moves`}
                onPointerDown={event => {
                  if (event.button !== 0 || collectionBusy) return;
                  event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
                  dragSource.current = model.id; setDraggingId(model.id);
                }}
                onPointerMove={event => {
                  if (!dragSource.current) return;
                  const carousel = carouselRef.current;
                  if (carousel) {
                    const bounds = carousel.getBoundingClientRect();
                    if (event.clientX < bounds.left + 40) carousel.scrollBy({ left: -22 });
                    else if (event.clientX > bounds.right - 40) carousel.scrollBy({ left: 22 });
                  }
                  const card = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-model-id]");
                  dragTarget.current = card?.dataset.modelId || null;
                  setDropTargetId(dragTarget.current);
                }}
                onPointerUp={() => finishDrag(true)} onPointerCancel={() => finishDrag(false)} onLostPointerCapture={() => finishDrag(false)}
                onKeyDown={event => { if (event.key === "Escape") finishDrag(false); }}>⠿ DRAG</button>}
              <button className="savedSelect" disabled={uploadState === "saving"} onClick={() => selectSavedModel(model)}>
                <span className="savedGlyph">{String(index + 1).padStart(2, "0")}</span><strong>{model.name.replace(/\.(glb|gltf)$/i, "")}</strong><small>{(model.size / 1024 / 1024).toFixed(1)} MB · {studioMode ? "SAVED" : "VIEW"}</small>
              </button>
              {studioMode && canImport && <div className="modelOrderControls">
                <button type="button" disabled={index === 0 || collectionBusy} aria-label={`Move ${model.name} earlier`} onClick={() => moveModel(index, -1)}>← EARLIER</button>
                <button type="button" disabled={index === savedModels.length - 1 || collectionBusy} aria-label={`Move ${model.name} later`} onClick={() => moveModel(index, 1)}>LATER →</button>
              </div>}
              {studioMode && canImport && <button className="removeModel" disabled={collectionBusy || orderDirty} aria-label={`Remove ${model.name} from library`} onClick={() => removeSavedModel(model)}>{removingId === model.id ? "REMOVING…" : "REMOVE"}</button>}
            </div>) : <div className="emptyLibrary">{studioMode ? "Your saved models will appear here." : "The next collection is being prepared."}</div>}
          </div></div>
          {studioMode && canImport && <div className={`uploadCard${fileDropActive ? " fileDropActive" : ""}`} onDragOver={event => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault(); event.dataTransfer.dropEffect = collectionBusy || orderDirty ? "none" : "copy";
            setFileDropActive(!collectionBusy && !orderDirty);
          }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFileDropActive(false); }}
          onDrop={event => { event.preventDefault(); setFileDropActive(false); void uploadFiles(Array.from(event.dataTransfer.files)); }}>
            <span>ADD TO LIBRARY</span><strong>{uploadedName || "Upload a model"}</strong><p>Drop one or more models here, or choose files. GLB with embedded textures recommended; 100 MB per file. Save or reset order changes before uploading.</p>
            <label className={uploadState === "saving" ? "isSaving" : ""}>{uploadState === "saving" ? "SAVING…" : "CHOOSE FILES"}<input disabled={collectionBusy || orderDirty} type="file" multiple accept=".glb,.gltf" onChange={uploadModel}/></label>
            {uploadMessage && <p role="status" className={`uploadStatus ${uploadState}`}>{uploadMessage}</p>}
            {!!uploadQueue.length && <ul className="uploadQueue" aria-label="Upload queue">{uploadQueue.map((item, index) => <li key={index}><strong>{item.name}</strong><span>{item.status}{item.status === "Uploading" ? ` · ${item.progress}%` : ""}</span>{["Uploading", "Saving"].includes(item.status) && <progress aria-label={`Upload progress for ${item.name}`} max={100} value={item.progress}/>}</li>)}</ul>}
          </div>}
        </aside>}

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
          {studioMode ? <div className="modelTitle"><span>{piece.kind.toUpperCase()}</span><h1>{uploadedName ? uploadedName.replace(/\.(glb|gltf)$/i, "") : piece.title}</h1><p>{uploadedName ? "CUSTOM IMPORT" : `${piece.polys} POLYGONS`}</p></div> :
            <nav className="modelNavigator" aria-label="Browse models">
              <button type="button" onClick={() => stepModel(-1)} disabled={savedModels.length < 2} aria-label="Previous model">←</button>
              <div aria-live="polite" aria-atomic="true"><h1>{savedModels.length ? uploadedName.replace(/\.(glb|gltf)$/i, "") : libraryStatus === "loading" ? "Loading collection…" : libraryStatus === "error" ? "Collection unavailable" : "The collection is being prepared"}</h1><span>{savedModels.length ? `${Math.max(0, savedModels.findIndex(model => model.url === modelSrc)) + 1} / ${savedModels.length}` : ""}</span></div>
              <button type="button" onClick={() => stepModel(1)} disabled={savedModels.length < 2} aria-label="Next model">→</button>
            </nav>}
          <div className="stageActions"><button onClick={() => setRotate(!rotate)} className={rotate ? "isOn" : ""}>↻ AUTO ROTATE</button><button onClick={() => setWireframe(!wireframe)} className={wireframe ? "isOn" : ""}>◇ EDGES</button></div>
        </section>

        <aside className="controls">
          <div className="sectionLabel"><span>02</span> SCENE SETTINGS</div>
          <Control label="EXPOSURE" value={exposure} min={0.2} max={2} step={0.05} setValue={setExposure}/>
          <Control label="SHADOW" value={shadow} min={0} max={2} step={0.05} setValue={setShadow}/>
          <Control label="LIGHT DIRECTION" value={lightX} min={0} max={100} step={1} setValue={value => { setCustomLighting(true); setLightX(value); }}/>
          <Control label="LIGHT HEIGHT" value={lightY} min={0} max={100} step={1} setValue={value => { setCustomLighting(true); setLightY(value); }}/>
          <div className="colorRow"><label>LIGHT COLOR</label><input aria-label="Light color" type="color" value={lightColor} onChange={e => { setCustomLighting(true); setLightColor(e.target.value); }}/><code>{lightColor.toUpperCase()}</code></div>
          <div className="colorRow"><label>BACKDROP</label><input aria-label="Backdrop color" type="color" value={background} onChange={e => setBackground(e.target.value)}/><code>{background.toUpperCase()}</code></div>
          <div className="presets"><label>LIGHTING PRESETS</label>{presets.map(p => <button key={p.name} onClick={() => applyPreset(p)}><span style={{background:p.color}}/>{p.name}</button>)}</div>
          <div className="saveNote"><span>{studioMode ? "OWNER REVIEW WORKSPACE" : "CLIENT SHOWCASE"}</span><p>{studioMode ? "Saved models and collection order are shared with the public viewer." : "A curated presentation of selected Lucien Marcel Cote artwork."}</p></div>
        </aside>
      </section>
      <footer id="about"><span>LUCIEN MARCEL COTE / 2026</span><p>A focused showcase for original game and film development artwork.</p><span>GAMES / FILM PORTFOLIO</span></footer>
    </main>
  );
}

function Control({label, value, min, max, step, setValue}:{label:string;value:number;min:number;max:number;step:number;setValue:(n:number)=>void}) {
  return <div className="control"><div><label>{label}</label><output>{value.toFixed(step < 1 ? 2 : 0)}</output></div><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => setValue(Number(e.target.value))}/></div>;
}
