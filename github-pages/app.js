const API_ORIGIN = "https://vanta-model-atelier.dreadstache.chatgpt.site";
const ECOSYSTEM_URL = "https://resume.luccote.com/generated/ecosystem.json";

const fallbackDestinations = [
  { id: "tech", label: "Tech & Systems", description: "Analytics, GIS, software, and automation.", url: "https://www.luccote.com/", status: "live" },
  { id: "three-d", label: "Games, Film & 3D", description: "Interactive models and technical art.", url: "./", status: "live" },
  { id: "music", label: "Music", description: "Dreadstache releases and production.", url: "https://music.luccote.com/", status: "live" },
  { id: "resumes", label: "Résumé Library", description: "Focused, verified career stories.", url: "https://resume.luccote.com/", status: "live" },
];

const presets = {
  crimson: { exposure: 0.75, shadow: 1.1, color: "#ff2f75", background: "#3b0814" },
  ember: { exposure: 1.15, shadow: 0.7, color: "#ff734c", background: "#160b08" },
  gallery: { exposure: 1.4, shadow: 0.45, color: "#fff5df", background: "#d8d2c7" },
};

const viewer = document.querySelector("#model-viewer");
const viewerWrap = document.querySelector("#viewer-wrap");
const modelList = document.querySelector("#model-list");
const loader = document.querySelector("#model-loader");
const loaderProgress = document.querySelector("#loader-progress");
const loaderCopy = document.querySelector("#loader-copy");
const stage = document.querySelector("#stage");
const stageGlow = document.querySelector("#stage-glow");
let selectedId = "";
let rotating = true;
let edges = true;

function renderWorkLinks(destinations) {
  const destinationLinks = destinations
    .filter((destination) => destination.status === "live" && destination.url)
    .map((destination) => `<a href="${destination.id === "three-d" ? "./" : destination.url}" ${destination.id === "three-d" ? 'aria-current="page"' : ""}><strong>${destination.label}</strong><span>${destination.description}</span></a>`)
    .join("");
  document.querySelector("#work-links").innerHTML = `${destinationLinks}<a href="archive.html"><strong>The Archive</strong><span>Earlier work, production history, and creative foundations.</span></a>`;
}

function setLoading(progress = 0) {
  loader.classList.add("isVisible");
  loader.removeAttribute("aria-hidden");
  const percent = Math.round(progress * 100);
  loaderProgress.style.width = `${Math.max(4, percent)}%`;
  loaderCopy.textContent = `${percent}% · PREPARING 3D VIEW`;
}

function finishLoading() {
  loaderProgress.style.width = "100%";
  loaderCopy.textContent = "100% · READY";
  window.setTimeout(() => {
    loader.classList.remove("isVisible");
    loader.setAttribute("aria-hidden", "true");
  }, 180);
}

function selectModel(model) {
  selectedId = model.id;
  setLoading();
  viewer.src = new URL(model.url, API_ORIGIN).href;
  viewer.alt = `Interactive 3D view of ${model.name}`;
  document.querySelector("#model-file").textContent = model.name;
  document.querySelector("#model-title").textContent = model.name.replace(/\.(glb|gltf)$/i, "");
  document.querySelector("#model-meta").textContent = `${(model.size / 1024 / 1024).toFixed(1)} MB · INTERACTIVE MODEL`;
  document.querySelectorAll(".savedCard").forEach((card) => card.classList.toggle("selectedCard", card.dataset.id === selectedId));
}

function renderModels(models) {
  if (!models.length) {
    modelList.innerHTML = `<div class="emptyLibrary">The collection is being prepared. <a href="${API_ORIGIN}">Open the hosted viewer ↗</a></div>`;
    return;
  }
  modelList.innerHTML = models.map((model, index) => `<div class="savedCard" data-id="${model.id}"><button class="savedSelect"><span class="savedGlyph">${String(index + 1).padStart(2, "0")}</span><strong>${model.name.replace(/\.(glb|gltf)$/i, "")}</strong><small>${(model.size / 1024 / 1024).toFixed(1)} MB · VIEW</small></button></div>`).join("");
  modelList.querySelectorAll(".savedCard").forEach((card, index) => card.querySelector("button").addEventListener("click", () => selectModel(models[index])));
  selectModel(models[0]);
}

function updateScene() {
  const lightX = document.querySelector("#light-x").value;
  const lightY = document.querySelector("#light-y").value;
  const color = document.querySelector("#light-color").value;
  const background = document.querySelector("#backdrop").value;
  stage.style.backgroundColor = background;
  stageGlow.style.background = `radial-gradient(circle at ${lightX}% ${lightY}%, ${color}66 0, ${color}18 20%, transparent 47%)`;
  viewer.exposure = Number(document.querySelector("#exposure").value);
  viewer.shadowIntensity = Number(document.querySelector("#shadow").value);
  document.querySelector("#exposure-output").textContent = Number(viewer.exposure).toFixed(2);
  document.querySelector("#shadow-output").textContent = Number(viewer.shadowIntensity).toFixed(2);
  document.querySelector("#light-x-output").textContent = lightX;
  document.querySelector("#light-y-output").textContent = lightY;
  document.querySelector("#light-color-output").textContent = color.toUpperCase();
  document.querySelector("#backdrop-output").textContent = background.toUpperCase();
}

function applyPreset(preset) {
  document.querySelector("#exposure").value = preset.exposure;
  document.querySelector("#shadow").value = preset.shadow;
  document.querySelector("#light-color").value = preset.color;
  document.querySelector("#backdrop").value = preset.background;
  updateScene();
}

renderWorkLinks(fallbackDestinations);
fetch(ECOSYSTEM_URL, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((manifest) => Array.isArray(manifest.destinations) && renderWorkLinks(manifest.destinations)).catch(() => undefined);
fetch(`${API_ORIGIN}/api/models`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => renderModels(data.models || [])).catch(() => { modelList.innerHTML = `<div class="emptyLibrary">The live collection is temporarily unavailable. <a href="${API_ORIGIN}">Open the hosted viewer ↗</a></div>`; finishLoading(); });

viewer.addEventListener("load", finishLoading);
viewer.addEventListener("error", finishLoading);
viewer.addEventListener("progress", (event) => setLoading(event.detail?.totalProgress || 0));
document.querySelectorAll('.controls input[type="range"], .controls input[type="color"]').forEach((input) => input.addEventListener("input", updateScene));
document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => applyPreset(presets[button.dataset.preset])));
document.querySelector("#models-prev").addEventListener("click", () => modelList.scrollBy({ left: -190, behavior: "smooth" }));
document.querySelector("#models-next").addEventListener("click", () => modelList.scrollBy({ left: 190, behavior: "smooth" }));
document.querySelector("#toggle-rotate").addEventListener("click", (event) => { rotating = !rotating; viewer.toggleAttribute("auto-rotate", rotating); event.currentTarget.classList.toggle("isOn", rotating); });
document.querySelector("#toggle-edges").addEventListener("click", (event) => { edges = !edges; viewerWrap.classList.toggle("wireframe", edges); event.currentTarget.classList.toggle("isOn", edges); });
updateScene();
