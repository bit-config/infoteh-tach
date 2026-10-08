import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import mapData from "./data/map.json";
import type { MapData, MapItem, StoryBlock } from "./types";

const data = mapData as MapData;

function App() {
  const [active, setActive] = useState<MapItem | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; alt: string } | null>(null);
  const [map, setMap] = useState<MapData>(data);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    fetch("/data/map.json").then((response) => {
      if (!response.ok) throw new Error("Не удалось прочитать файл карты");
      return response.json() as Promise<MapData>;
    }).then(setMap).catch(() => setLoadError("Показан встроенный пример: положите файл по адресу public/data/map.json."));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (enlargedImage) setEnlargedImage(null);
        else setActive(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enlargedImage]);

  const visibleItems = map.items;
  return (
    <main className="app-shell">
      <section className="map-section">
        <div className="map-toolbar"><div className="map-label"><MapPin size={14} /> ИНТЕРАКТИВНАЯ КАРТА <span className="map-count">{String(visibleItems.length).padStart(2, "0")} МЕСТА</span></div></div>
        <div className="map-canvas" style={{ backgroundImage: `url("${map.ImageFonMain}")` }}>
          <div className="map-wash" />
          {visibleItems.map((item, index) => <button key={item.id} className={`map-card ${active?.id === item.id ? "map-card-active" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}px`, "--card-delay": `${index * 100}ms` } as React.CSSProperties} onClick={() => setActive(item)} aria-label={`Открыть: ${item.title}`}>
            <span className="card-image-wrap"><img src={item.image} alt="" /><span className="card-open"><ArrowUpRight size={15} /></span><span className="card-index">0{map.items.indexOf(item) + 1}</span></span>
            <span className="card-meta"><span>{item.category}</span><span className="card-pin"><MapPin size={11} /></span></span>
            <span className="card-title">{item.title}</span>
          </button>)}
        </div>
      </section>

      <div className={`drawer-backdrop ${active ? "is-visible" : ""}`} onClick={() => setActive(null)} aria-hidden="true" />
      <aside className={`story-drawer ${active ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label={active?.title ?? "История места"}>
        {active && <><div className="drawer-top"><span><span className="drawer-live" /> ИСТОРИЯ МЕСТА <span className="drawer-separator">/</span> {active.category}</span><button className="close-button" onClick={() => setActive(null)} aria-label="Закрыть"><X size={18} /></button></div>
          <div className="drawer-scroll"><div className="drawer-heading"><span className="drawer-number">МЕСТО {String(map.items.indexOf(active) + 1).padStart(2, "0")} <span>— ИЗБРАННОЕ</span></span><h2>{active.title}<span>.</span></h2><div className="drawer-location"><MapPin size={13} /> САНКТ-ПЕТЕРБУРГ, РОССИЯ</div></div>
            <article className="story-content">{active.info.map((block, index) => <StoryBlockView key={`${active.id}-${index}`} block={block} onImageClick={(src, alt) => setEnlargedImage({ src, alt })} />)}</article>
            <div className="drawer-footnote"><span>КООРДИНАТЫ НА КАРТЕ</span><span>{active.x.toFixed(2)}° N — {active.y.toFixed(2)}° E</span></div>
          </div>
        </>}
      </aside>
      {enlargedImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Увеличенное изображение" onClick={() => setEnlargedImage(null)}><button className="lightbox-close" onClick={() => setEnlargedImage(null)} aria-label="Закрыть"><X size={22} /></button><img src={enlargedImage.src} alt={enlargedImage.alt} onClick={(event) => event.stopPropagation()} /></div>}
      {loadError && <div className="toast">{loadError}</div>}
    </main>
  );
}

function StoryBlockView({ block, onImageClick }: { block: StoryBlock; onImageClick: (src: string, alt: string) => void }) {
  if (block.type === "text") return <p className={`story-paragraph ${block.style ?? ""}`}>{block.content}</p>;
  if (block.type === "image") return <figure className="story-image"><button className="zoom-image-button" onClick={() => onImageClick(block.src, block.caption ?? "Увеличенное изображение")} aria-label="Увеличить изображение"><img src={block.src} alt={block.caption ?? ""} /></button>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  return <div className="story-gallery">{block.images.map((media, index) => <figure key={`${media.src}-${index}`} className={`gallery-item gallery-item-${media.type ?? "image"}`}>{media.type === "video" ? <video src={media.src} controls playsInline preload="metadata" aria-label={media.caption ?? "Видео из галереи"} /> : <button className="zoom-image-button" onClick={() => onImageClick(media.src, media.caption ?? "Увеличенное изображение")} aria-label="Увеличить изображение"><img src={media.src} alt={media.caption ?? ""} /></button>}{media.caption && <figcaption><span className="gallery-format">{media.type === "video" ? "ВИДЕО" : "ФОТО"}</span>{media.caption}</figcaption>}</figure>)}</div>;
}

export default App;
