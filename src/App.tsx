import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { ArrowDown, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Compass, MapPin, Search, X } from "lucide-react";
import mapData from "./data/map.json";
import type { MapData, MapItem, StoryBlock } from "./types";

const data = mapData as MapData;

function App() {
  const [active, setActive] = useState<MapItem | null>(null);
  const [query, setQuery] = useState("");
  const [map, setMap] = useState<MapData>(data);
  const [loadError, setLoadError] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/map.json").then((response) => {
      if (!response.ok) throw new Error("Не удалось прочитать файл карты");
      return response.json() as Promise<MapData>;
    }).then(setMap).catch(() => setLoadError("Показан встроенный пример: положите файл по адресу public/data/map.json."));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleItems = map.items.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const activeIndex = active ? map.items.findIndex((item) => item.id === active.id) : -1;
  const moveStory = (direction: number) => {
    const next = (activeIndex + direction + map.items.length) % map.items.length;
    setActive(map.items[next]);
  };
  const checkForUpdates = async () => {
    if (!isTauri()) { setUpdateStatus("Проверка обновлений доступна в установленном приложении."); return; }
    setUpdateStatus("Проверяем обновления…");
    try {
      const update = await check();
      if (!update) { setUpdateStatus("У вас установлена последняя версия."); return; }
      setUpdateStatus(`Устанавливаем версию ${update.version}…`);
      await update.downloadAndInstall();
      await relaunch();
    } catch (error) {
      setUpdateStatus(`Не удалось проверить обновления: ${String(error)}`);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Atlas — на главную"><span className="brand-mark"><Compass size={19} strokeWidth={1.7} /></span><span>atlas<span className="brand-period">.</span></span></a>
        <div className="topbar-center"><span className="status-dot" /> DIGITAL FIELD NOTES <span className="topbar-divider">/</span> VOL. 01</div>
        <button className="about-button" onClick={() => setActive({ id: "about", title: "О проекте", category: "НЕБОЛЬШОЙ ПУТЕВОДИТЕЛЬ", image: "/images/leaf.svg", x: 0, y: 0, width: 0, height: 0, info: [{ type: "text", content: "Atlas — коллекция мест, которые хочется сохранить.", style: "lead" }, { type: "text", content: "Каждая точка на карте открывает свою небольшую историю. Добавляйте места и фотографии в JSON-файл — страница сама покажет их в нужном порядке." }] })}>О проекте <ArrowUpRight size={14} /></button>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy"><div className="eyebrow"><span>ПОЛЕВЫЕ ЗАМЕТКИ</span><span className="eyebrow-line" /><span>59°56′ N — 30°19′ E</span></div>
          <h1>{map.title}<span className="title-period">.</span></h1>
          <div className="intro-bottom"><p>{map.subtitle}</p><span className="intro-note">Места для неспешных<br />прогулок и новых историй.</span></div>
        </div>
        <div className="edition"><span>ИЗБРАННЫЕ МЕСТА</span><strong>03</strong><span>ОБНОВЛЕНО · 2026</span></div>
      </section>

      <section className="map-section">
        <div className="map-toolbar"><div className="map-label"><MapPin size={14} /> ИНТЕРАКТИВНАЯ КАРТА <span className="map-count">{String(visibleItems.length).padStart(2, "0")} МЕСТА</span></div>
          <label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти место" aria-label="Найти место" />{query && <button onClick={() => setQuery("")} aria-label="Очистить"><X size={13} /></button>}</label>
        </div>
        <div className="map-canvas" ref={mapRef} style={{ backgroundImage: `url("${map.ImageFonMain}")` }}>
          <div className="map-wash" />
          <div className="map-coordinate coordinate-one">ЛИТОВСКАЯ УЛ. <span>59.9462, 30.3551</span></div>
          <div className="map-coordinate coordinate-two">НАБЕРЕЖНАЯ <span>ПЕТРОГРАДСКАЯ СТОРОНА</span></div>
          {visibleItems.map((item, index) => <button key={item.id} className={`map-card ${active?.id === item.id ? "map-card-active" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}px`, "--card-delay": `${index * 100}ms` } as React.CSSProperties} onClick={() => setActive(item)} aria-label={`Открыть: ${item.title}`}>
            <span className="card-image-wrap"><img src={item.image} alt="" /><span className="card-open"><ArrowUpRight size={15} /></span><span className="card-index">0{map.items.indexOf(item) + 1}</span></span>
            <span className="card-meta"><span>{item.category}</span><span className="card-pin"><MapPin size={11} /></span></span>
            <span className="card-title">{item.title}</span>
          </button>)}
          {visibleItems.length === 0 && <div className="empty-search">Место не найдено. Попробуйте другой запрос.</div>}
          <div className="map-compass"><span>N</span><ArrowUpRight size={19} /><span className="compass-line" /></div>
          <div className="map-scale"><span>0</span><i /><span>500 м</span></div>
          <div className="map-caption"><span>САНКТ-ПЕТЕРБУРГ</span><span>РОССИЯ · 2026</span></div>
        </div>
        <div className="map-footer"><span><span className="footer-dot" /> НАЖМИТЕ НА КАРТОЧКУ, ЧТОБЫ ОТКРЫТЬ ИСТОРИЮ</span><span>ЛИСТАЙТЕ, ИССЛЕДУЙТЕ <ArrowDown size={13} /></span></div>
      </section>

      <section className="places-strip"><div className="strip-heading"><span>01 — 03</span><h2>Точки притяжения</h2><span className="strip-rule" /></div><div className="place-links">{map.items.map((item, index) => <button key={item.id} className="place-link" onClick={() => setActive(item)}><span className="place-number">0{index + 1}</span><span className="place-link-title">{item.title}</span><span className="place-link-category">{item.category}</span><ArrowUpRight size={16} /></button>)}</div></section>
      <footer className="footer"><span>ATLAS — НЕБОЛЬШИЕ ИСТОРИИ БОЛЬШИХ ГОРОДОВ</span><button className="update-button" onClick={checkForUpdates}>ПРОВЕРИТЬ ОБНОВЛЕНИЯ <ArrowUpRight size={12} /></button><span>СОЗДАНО С ЛЮБОПЫТСТВОМ <span className="footer-heart">✳</span></span></footer>

      <div className={`drawer-backdrop ${active ? "is-visible" : ""}`} onClick={() => setActive(null)} aria-hidden="true" />
      <aside className={`story-drawer ${active ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label={active?.title ?? "История места"}>
        {active && <><div className="drawer-top"><span><span className="drawer-live" /> ИСТОРИЯ МЕСТА <span className="drawer-separator">/</span> {active.category}</span><button className="close-button" onClick={() => setActive(null)} aria-label="Закрыть"><X size={18} /></button></div>
          <div className="drawer-scroll"><div className="drawer-heading"><span className="drawer-number">МЕСТО {String(map.items.indexOf(active) + 1).padStart(2, "0")} <span>— ИЗБРАННОЕ</span></span><h2>{active.title}<span>.</span></h2><div className="drawer-location"><MapPin size={13} /> САНКТ-ПЕТЕРБУРГ, РОССИЯ</div></div>
            <article className="story-content">{active.info.map((block, index) => <StoryBlockView key={`${active.id}-${index}`} block={block} />)}</article>
            <div className="drawer-footnote"><span>КООРДИНАТЫ НА КАРТЕ</span><span>{active.x.toFixed(2)}° N — {active.y.toFixed(2)}° E</span></div>
          </div>
          <div className="drawer-navigation"><button onClick={() => moveStory(-1)} aria-label="Предыдущее место"><ChevronLeft size={17} /><span>ПРЕДЫДУЩЕЕ</span></button><span>{String(Math.max(0, activeIndex + 1)).padStart(2, "0")} / {String(map.items.length).padStart(2, "0")}</span><button onClick={() => moveStory(1)} aria-label="Следующее место"><span>СЛЕДУЮЩЕЕ</span><ChevronRight size={17} /></button></div>
        </>}
      </aside>
      {loadError && <div className="toast"><BookOpen size={14} />{loadError}</div>}
      {updateStatus && <div className="toast update-toast" role="status"><span>{updateStatus}</span><button onClick={() => setUpdateStatus("")} aria-label="Закрыть"><X size={13} /></button></div>}
    </main>
  );
}

function StoryBlockView({ block }: { block: StoryBlock }) {
  if (block.type === "text") return <p className={`story-paragraph ${block.style ?? ""}`}>{block.content}</p>;
  if (block.type === "image") return <figure className="story-image"><img src={block.src} alt={block.caption ?? ""} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  return <div className="story-gallery">{block.images.map((image, index) => <figure key={`${image.src}-${index}`}><img src={image.src} alt={image.caption ?? ""} />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div>;
}

export default App;
