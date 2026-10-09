import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { error as logError, info as logInfo } from "@tauri-apps/plugin-log";
import { ArrowUpRight, MapPin, Play, Search, X } from "lucide-react";
import mapData from "./data/map.json";
import type { MapData, MapItem, StoryBlock } from "./types";

const data = mapData as MapData;
const imageExtensions = ["svg", "png", "jpg", "jpeg", "webp"];
const updateToken = import.meta.env.VITE_GITHUB_UPDATE_TOKEN;

function getImageCandidates(src: string) {
  const match = src.match(/^(.*)\.(svg|png|jpe?g|webp)([?#].*)?$/i);
  if (!match) return [src];

  const [, base, currentExtension, suffix = ""] = match;
  return [
    src,
    ...imageExtensions
      .filter((extension) => extension !== currentExtension.toLowerCase())
      .map((extension) => `${base}.${extension}${suffix}`),
  ];
}

function AutoFormatImage({ src, alt, onClick }: { src: string; alt: string; onClick?: React.MouseEventHandler<HTMLImageElement> }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidates = getImageCandidates(src);

  useEffect(() => setCandidateIndex(0), [src]);

  return (
    <img
      src={candidates[candidateIndex]}
      alt={alt}
      onClick={onClick}
      onError={() => setCandidateIndex((index) => Math.min(index + 1, candidates.length - 1))}
    />
  );
}

function App() {
  const [active, setActive] = useState<MapItem | null>(null);
  const [enlargedMedia, setEnlargedMedia] = useState<{ src: string; alt: string; type: "image" | "video" } | null>(null);
  const [map, setMap] = useState<MapData>(data);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let disposed = false;
    let checking = false;

    void logInfo(`Updater diagnostics: token configured=${Boolean(updateToken)}`)
      .catch((error) => console.error("Не удалось записать диагностику обновления:", error));

    const checkForUpdates = async () => {
      if (checking || disposed) return;
      checking = true;
      try {
        const headers = updateToken ? { Authorization: `Bearer ${updateToken}` } : undefined;
        const update = await check(headers ? { headers } : undefined);
        if (!update || disposed) return;
        await update.downloadAndInstall(undefined, headers ? { headers } : undefined);
        if (!disposed) await relaunch();
      } catch (error) {
        console.error("Не удалось проверить или установить обновление:", error);
        const details = error instanceof Error ? error.stack ?? error.message : String(error);
        try {
          await logError(`Не удалось проверить или установить обновление (token configured=${Boolean(updateToken)}): ${details}`);
        } catch (logFailure) {
          console.error("Не удалось записать ошибку обновления в файл:", logFailure);
        }
      } finally {
        checking = false;
      }
    };

    void checkForUpdates();
    const interval = window.setInterval(() => void checkForUpdates(), 5 * 60 * 1000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetch("/data/map.json").then((response) => {
      if (!response.ok) throw new Error("Не удалось прочитать файл карты");
      return response.json() as Promise<MapData>;
    }).then(setMap).catch(() => setLoadError("Показан встроенный пример: положите файл по адресу public/data/map.json."));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (enlargedMedia) setEnlargedMedia(null);
        else setActive(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlargedMedia]);

  const visibleItems = map.items;
  return (
    <main className="app-shell">
      <section className="map-section">
        <div className="map-toolbar"><div className="map-label"><MapPin size={14} /> ИНТЕРАКТИВНАЯ КАРТА <span className="map-count">{String(visibleItems.length).padStart(2, "0")} МЕСТА</span></div></div>
        <div className="map-canvas" style={{ backgroundImage: `url("${map.ImageFonMain}")` }}>
          <div className="map-wash" />
          {visibleItems.map((item, index) => <button key={item.id} className={`map-card ${active?.id === item.id ? "map-card-active" : ""}`} style={{ right: `${item.x}%`, top: `${item.y}%`, width: `${item.width}px`, "--card-delay": `${index * 100}ms` } as React.CSSProperties} onClick={() => setActive(item)} aria-label={`Открыть: ${item.title}`}>
            <span className="card-image-wrap"><AutoFormatImage src={item.image} alt="" /><span className="card-open"><ArrowUpRight size={15} /></span><span className="card-index">0{map.items.indexOf(item) + 1}</span></span>
            <span className="card-meta"><span>{item.category}</span><span className="card-pin"><MapPin size={11} /></span></span>
            <span className="card-title">{item.title}</span>
          </button>)}
        </div>
      </section>

      <div className={`drawer-backdrop ${active ? "is-visible" : ""}`} onClick={() => setActive(null)} aria-hidden="true" />
      <aside className={`story-drawer ${active ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label={active?.title ?? "История места"}>
        {active && <><div className="drawer-top"><span><span className="drawer-live" /> ИСТОРИЯ МЕСТА <span className="drawer-separator">/</span> {active.category}</span><button className="close-button" onClick={() => setActive(null)} aria-label="Закрыть"><X size={18} /></button></div>
          <div className="drawer-scroll"><div className="drawer-heading"><h2>{active.title}</h2></div>
            <article className="story-content">{active.info.map((block, index) => <StoryBlockView key={`${active.id}-${index}`} block={block} onMediaClick={(src, alt, type) => setEnlargedMedia({ src, alt, type })} />)}</article>

          </div>
        </>}
      </aside>
      {enlargedMedia && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={enlargedMedia.type === "video" ? "Видео" : "Увеличенное изображение"} onClick={() => setEnlargedMedia(null)}><button className="lightbox-close" onClick={() => setEnlargedMedia(null)} aria-label="Закрыть"><X size={22} /></button>{enlargedMedia.type === "video" ? <video className="lightbox-video" src={enlargedMedia.src} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} aria-label={enlargedMedia.alt} /> : <AutoFormatImage src={enlargedMedia.src} alt={enlargedMedia.alt} onClick={(event) => event.stopPropagation()} />}</div>}
      {loadError && <div className="toast">{loadError}</div>}
    </main>
  );
}

function StoryBlockView({ block, onMediaClick }: { block: StoryBlock; onMediaClick: (src: string, alt: string, type: "image" | "video") => void }) {
  if (block.type === "text") return <p className={`story-paragraph ${block.style ?? ""}`}>{block.content}</p>;
  if (block.type === "image") return <figure className="story-image"><button className="zoom-image-button" onClick={() => onMediaClick(block.src, block.caption ?? "Увеличенное изображение", "image")} aria-label="Увеличить изображение"><AutoFormatImage src={block.src} alt={block.caption ?? ""} /><span className="media-action-icon"><Search size={17} /></span></button>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  return <div className="story-gallery">{block.images.map((media, index) => <figure key={`${media.src}-${index}`} className={`gallery-item gallery-item-${media.type ?? "image"}`}>{media.type === "video" ? <button className="zoom-image-button video-thumbnail" onClick={() => onMediaClick(media.src, media.caption ?? "Видео", "video")} aria-label={`Открыть видео: ${media.caption ?? ""}`}><video src={media.src} muted playsInline preload="metadata" aria-hidden="true" /><span className="media-action-icon video-play-icon"><Play size={20} fill="currentColor" /></span></button> : <button className="zoom-image-button" onClick={() => onMediaClick(media.src, media.caption ?? "Увеличенное изображение", "image")} aria-label="Увеличить изображение"><AutoFormatImage src={media.src} alt={media.caption ?? ""} /><span className="media-action-icon"><Search size={17} /></span></button>}{media.caption && <figcaption><span className="gallery-format">{media.type === "video" ? "ВИДЕО" : "ФОТО"}</span>{media.caption}</figcaption>}</figure>)}</div>;
}

export default App;
