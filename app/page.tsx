"use client";

import Script from "next/script";
import React, { ChangeEvent, useMemo, useRef, useState } from "react";

const pieces = [
  { title: "Ivory Vanguard", kind: "Character / Game", file: "vanguard_04.glb", polys: "84.2K", src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb", camera: "0deg 75deg 2.4m" },
  { title: "Kintsugi Sentinel", kind: "Creature / Film", file: "sentinel_final.glb", polys: "126K", src: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb", camera: "28deg 72deg 2.1m" },
  { title: "Signal Runner", kind: "Prop / Game", file: "signal_runner.glb", polys: "48.8K", src: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb", camera: "-22deg 68deg 2.5m" },
];

const presets = [
  { name: "Moonlit", exposure: 0.75, shadow: 1.1, color: "#b9d8ff", bg: "#07101b" },
  { name: "Ember", exposure: 1.15, shadow: 0.7, color: "#ff734c", bg: "#160b08" },
  { name: "Gallery", exposure: 1.4, shadow: 0.45, color: "#fff5df", bg: "#d8d2c7" },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [modelSrc, setModelSrc] = useState(pieces[0].src);
  const [uploadedName, setUploadedName] = useState("");
  const [exposure, setExposure] = useState(0.9);
  const [shadow, setShadow] = useState(0.8);
  const [lightColor, setLightColor] = useState("#b9d8ff");
  const [background, setBackground] = useState("#07101b");
  const [lightX, setLightX] = useState(38);
  const [lightY, setLightY] = useState(22);
  const [rotate, setRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [panel, setPanel] = useState<"light" | "model">("light");
  const objectUrl = useRef<string | null>(null);
  const piece = pieces[active];

  const glow = useMemo(() => ({
    background: `radial-gradient(circle at ${lightX}% ${lightY}%, ${lightColor}66 0, ${lightColor}18 20%, transparent 47%)`,
  }), [lightColor, lightX, lightY]);

  function selectPiece(index: number) {
    setActive(index);
    setModelSrc(pieces[index].src);
    setUploadedName("");
  }

  function uploadModel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setModelSrc(objectUrl.current);
    setUploadedName(file.name);
  }

  function applyPreset(preset: typeof presets[number]) {
    setExposure(preset.exposure); setShadow(preset.shadow);
    setLightColor(preset.color); setBackground(preset.bg);
  }

  const viewerProps: Record<string, string | boolean | number> = {
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
        <a className="brand" href="#top" aria-label="Vanta Model Atelier home"><span className="brandmark">V</span><span>VANTA<br/><small>MODEL ATELIER</small></span></a>
        <nav aria-label="Primary"><a className="active" href="#viewer">VIEWER</a><a href="#collection">COLLECTION</a><a href="#about">ABOUT</a></nav>
        <label className="uploadButton">+ IMPORT MODEL<input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={uploadModel}/></label>
      </header>

      <section id="viewer" className="workspace">
        <aside className="collection" id="collection">
          <div className="sectionLabel"><span>01</span> SELECT MODEL</div>
          <div className="pieceList">
            {pieces.map((item, index) => <button key={item.title} className={index === active ? "piece activePiece" : "piece"} onClick={() => selectPiece(index)}>
              <span className="thumb">0{index + 1}</span><span><strong>{item.title}</strong><small>{item.kind}</small></span><i>↗</i>
            </button>)}
          </div>
          <div className="uploadCard">
            <span>YOUR WORK</span><strong>{uploadedName || "Drop in a model"}</strong><p>GLB or GLTF, up to 100 MB. Your file stays on this device.</p>
            <label>CHOOSE FILE<input type="file" accept=".glb,.gltf" onChange={uploadModel}/></label>
          </div>
        </aside>

        <section className="stage" style={{ backgroundColor: background }}>
          <div className="stageGlow" style={glow}/>
          <div className={wireframe ? "viewerWrap wireframe" : "viewerWrap"}>
            {React.createElement("model-viewer", viewerProps)}
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
          <div className="saveNote"><span>LOCAL SESSION</span><p>Scene changes remain private and reset when this page closes.</p></div>
        </aside>
      </section>
      <footer id="about"><span>VANTA / 2026</span><p>A focused review room for game and film development assets.</p><span>WEBGL VIEWER</span></footer>
    </main>
  );
}

function Control({label, value, min, max, step, setValue}:{label:string;value:number;min:number;max:number;step:number;setValue:(n:number)=>void}) {
  return <div className="control"><div><label>{label}</label><output>{value.toFixed(step < 1 ? 2 : 0)}</output></div><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => setValue(Number(e.target.value))}/></div>;
}
