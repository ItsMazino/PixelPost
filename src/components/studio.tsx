"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Heart,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Mail,
  Move,
  Palette,
  Plus,
  Redo2,
  RotateCw,
  Save,
  Stamp,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  drawCard,
  isCard,
  makeCard,
  photos,
  photoData,
  templates,
  uid,
  type Layer,
  type Postcard,
} from "@/lib/postcard";

const KEY = "pixelpost.workspace.v1";
const templateCards = templates.map((template) => makeCard(template.id));
const palette = [
  "#eee5cf",
  "#f1dfda",
  "#dce2cf",
  "#dce7e9",
  "#fff8dd",
  "#a8312e",
  "#304f45",
  "#283d67",
  "#f3c957",
];
type Tool = "templates" | "photos" | "text" | "stickers" | "paper" | "layers";
const tools = [
  { id: "templates", name: "Templates", icon: LayoutTemplate },
  { id: "photos", name: "Photos", icon: ImagePlus },
  { id: "text", name: "Text", icon: Type },
  { id: "stickers", name: "Stickers", icon: Stamp },
  { id: "paper", name: "Paper", icon: Palette },
  { id: "layers", name: "Layers", icon: Layers },
] as const;
function Preview({
  card,
  side = "front",
  className = "",
}: {
  card: Postcard;
  side?: "front" | "back";
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    const buffer = document.createElement("canvas");
    drawCard(buffer, card, side)
      .then(() => {
        if (live && ref.current) {
          ref.current.width = buffer.width;
          ref.current.height = buffer.height;
          ref.current.getContext("2d")!.drawImage(buffer, 0, 0);
          setError(false);
        }
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [card, side]);
  return (
    <>
      <canvas
        ref={ref}
        width={1200}
        height={800}
        className={className}
        role="img"
        aria-label={`${card.name}, ${side} of postcard`}
      />
      {error && (
        <span className="canvas-error">
          Photo unavailable. Choose another photo.
        </span>
      )}
    </>
  );
}
function Range({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="range-label">
      <span>
        {label}
        <output>
          {Math.round(value * 100) / 100}
          {label === "Rotation" ? "°" : ""}
        </output>
      </span>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </label>
  );
}
function Swatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="swatches">
      {palette.map((color) => (
        <button
          key={color}
          aria-label={`Use color ${color}`}
          aria-pressed={value === color}
          style={{ background: color }}
          onClick={() => onChange(color)}
        >
          {value === color && (
            <Check
              size={14}
              color={color === "#a8312e" ? "white" : "#29221f"}
            />
          )}
        </button>
      ))}
      <label className="custom-color" title="Custom color">
        <Plus size={15} />
        <input
          type="color"
          aria-label="Custom color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export default function Studio() {
  const [card, setCard] = useState<Postcard>(() => makeCard());
  const [saved, setSaved] = useState<Postcard[]>([]);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<Postcard[]>([]);
  const [future, setFuture] = useState<Postcard[]>([]);
  const [tool, setTool] = useState<Tool>("templates");
  const [side, setSide] = useState<"front" | "back">("front");
  const [selected, setSelected] = useState<string | null>(null);
  const [gallery, setGallery] = useState(false);
  const [about, setAbout] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [printTip, setPrintTip] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    card: Postcard;
    x: number;
    y: number;
    layer: Layer;
    mode: "move" | "resize" | "rotate";
  } | null>(null);
  const layer = card.layers.find((l) => l.id === selected);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (
            data.version !== 1 ||
            !isCard(data.draft) ||
            !Array.isArray(data.saved) ||
            !data.saved.every(isCard)
          )
            throw new Error();
          setCard(data.draft);
          setSaved(data.saved);
        }
      } catch {
        setStorageError(
          "Saved data could not be loaded. This session still works; export your postcards before closing.",
        );
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ version: 1, draft: card, saved }),
        );
        setStorageError("");
      } catch {
        setStorageError(
          "Browser storage is full or unavailable. Export your postcard to keep it, or remove old gallery cards.",
        );
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [card, saved, ready]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  function commit(next: Postcard) {
    setHistory((h) => [...h.slice(-39), card]);
    setFuture([]);
    setCard(next);
  }
  function patch(partial: Partial<Postcard>) {
    commit({ ...card, ...partial });
  }
  function editLayer(partial: Partial<Layer>) {
    if (layer)
      patch({
        layers: card.layers.map((l) =>
          l.id === layer.id ? { ...l, ...partial } : l,
        ),
      });
  }
  function undo() {
    if (!history.length) return;
    setFuture((f) => [card, ...f]);
    setCard(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setHistory((h) => [...h, card]);
    setCard(future[0]);
    setFuture((f) => f.slice(1));
  }
  function newTemplate(id: string) {
    commit(makeCard(id));
    setSelected(null);
    setSide("front");
    setPendingTemplate(null);
    setMobilePanel(false);
    setNotice("A fresh postcard, just for you.");
  }
  function add(kind: "text" | "sticker", text: string, font = "Caveat") {
    if (card.layers.length >= 30) {
      setNotice("This postcard has 30 layers. Remove one to add another.");
      return;
    }
    const item: Layer = {
      id: uid(),
      kind,
      text,
      font,
      x: 600,
      y: 400,
      size: kind === "text" ? 72 : 150,
      rotation: kind === "text" ? -4 : 10,
      color: kind === "text" ? "#fff8dd" : "#f3c957",
    };
    patch({ layers: [...card.layers, item] });
    setSelected(item.id);
    setSide("front");
    setMobilePanel(false);
  }
  function save() {
    if (!card.id && saved.length >= 12) {
      setNotice("Your gallery holds 12 postcards. Export or remove one first.");
      return;
    }
    const next = { ...card, id: card.id || uid(), updated: Date.now() };
    setCard(next);
    setSaved((items) => [next, ...items.filter((c) => c.id !== next.id)]);
    setNotice("Tucked away in your gallery.");
  }
  async function download() {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      await drawCard(canvas, card, side, 2400);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("Could not export image.")),
          "image/png",
        ),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "postcard"}-${side}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your postcard is ready. Check your downloads.");
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Export failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function downloadPdf() {
    if (busy) return;
    setBusy(true);
    setPdfBusy(true);
    try {
      const { createPostcardPdf } = await import("@/lib/printable");
      const sides: Uint8Array[] = [];
      const canvas = document.createElement("canvas");
      for (const face of ["front", "back"] as const) {
        await drawCard(canvas, card, face, 2400);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) =>
              value
                ? resolve(value)
                : reject(new Error("Could not render the postcard.")),
            "image/png",
          ),
        );
        sides.push(new Uint8Array(await blob.arrayBuffer()));
      }
      const bytes = await createPostcardPdf(sides[0], sides[1], card.name);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${card.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "postcard"}-postcard.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setPrintTip(true);
      setNotice("Both sides are in your postcard PDF. Check your downloads.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "PDF export failed. Please try again.",
      );
    } finally {
      setPdfBusy(false);
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const photo = await photoData(file);
      patch({ photo, zoom: 1, panX: 50, panY: 50 });
      setNotice("Your photo is in. Make it yours.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load photo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function begin(
    e: PointerEvent<HTMLButtonElement>,
    l: Layer,
    mode: "move" | "resize" | "rotate" = "move",
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(l.id);
    gesture.current = { card, x: e.clientX, y: e.clientY, layer: l, mode };
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current,
      box = stageRef.current?.getBoundingClientRect();
    if (!g || !box) return;
    const dx = ((e.clientX - g.x) * 1200) / box.width,
      dy = ((e.clientY - g.y) * 800) / box.height;
    let change: Partial<Layer>;
    if (g.mode === "resize")
      change = { size: Math.max(20, Math.min(300, g.layer.size + dx)) };
    else if (g.mode === "rotate")
      change = {
        rotation: Math.max(-180, Math.min(180, g.layer.rotation + dx / 2)),
      };
    else
      change = {
        x: Math.max(20, Math.min(1180, g.layer.x + dx)),
        y: Math.max(20, Math.min(780, g.layer.y + dy)),
      };
    setCard({
      ...g.card,
      layers: g.card.layers.map((l) =>
        l.id === g.layer.id ? { ...l, ...change } : l,
      ),
    });
  }
  function end() {
    if (gesture.current) {
      const old = gesture.current.card;
      if (card !== old) {
        setHistory((h) => [...h.slice(-39), old]);
        setFuture([]);
      }
      gesture.current = null;
    }
  }
  function layerWidth(l: Layer) {
    return l.kind === "sticker"
      ? l.size
      : Math.min(
          1120,
          Math.max(
            l.size,
            l.text.length *
              l.size *
              (l.font === "Bebas Neue"
                ? 0.46
                : l.font === "Caveat"
                  ? 0.42
                  : 0.53),
          ),
        );
  }
  const panel = (
    <>
      <div className="panel-heading">
        <span>{tools.find((t) => t.id === tool)?.name}</span>
        <button
          className="mobile-close"
          aria-label="Close tools"
          onClick={() => setMobilePanel(false)}
        >
          <X size={18} />
        </button>
      </div>
      {tool === "templates" && (
        <>
          <p className="panel-intro">
            Start with a little inspiration.
            <br />
            Leave with something all yours.
          </p>
          <div className="template-list">
            {templates.map((t, i) => (
              <button
                className={`template-option ${card.template === t.id ? "chosen" : ""}`}
                key={t.id}
                onClick={() => setPendingTemplate(t.id)}
              >
                <div className="template-preview">
                  <Preview card={templateCards[i]} />
                  {card.template === t.id && (
                    <span className="chosen-badge">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <span className="template-name">
                  {t.name}
                  <span>0{i + 1}</span>
                </span>
                <small>{t.note}</small>
              </button>
            ))}
          </div>
        </>
      )}
      {tool === "photos" && (
        <>
          <p className="panel-intro">
            Somewhere you’ve been.
            <br />
            Somewhere you dream of.
          </p>
          <Button
            variant="outline"
            className="upload-button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload size={16} /> Upload a photo
          </Button>
          <small className="help">
            JPG, PNG, WebP · up to 15 MB
            <br />
            Your photos stay in this browser.
          </small>
          <div className="photo-list">
            {photos.map((p) => (
              <button
                key={p.src}
                onClick={() =>
                  patch({ photo: p.src, zoom: 1, panX: 50, panY: 58 })
                }
              >
                <Image src={p.src} alt={p.name} width={96} height={80} />
                <span>{p.name}</span>
                {card.photo === p.src && <Check size={14} />}
              </button>
            ))}
          </div>
          <h3>Make it feel like a memory</h3>
          <div className="filter-grid">
            {["original", "warm", "vintage", "mono"].map((f) => (
              <button
                className={card.filter === f ? "active" : ""}
                key={f}
                onClick={() => patch({ filter: f })}
              >
                {f}
              </button>
            ))}
          </div>
          <Range
            label="Photo zoom"
            min={1}
            max={3}
            step={0.05}
            value={card.zoom}
            onChange={(zoom) => patch({ zoom })}
          />
          <Range
            label="Crop horizontal"
            value={card.panX}
            onChange={(panX) => patch({ panX })}
          />
          <Range
            label="Crop vertical"
            value={card.panY}
            onChange={(panY) => patch({ panY })}
          />
        </>
      )}
      {tool === "text" && (
        <>
          <p className="panel-intro">A few words can take you places.</p>
          {[
            { text: "Hello, sunshine", font: "DM Serif Display" },
            { text: "wish you were here", font: "Caveat" },
            { text: "GOOD TIMES", font: "Bebas Neue" },
            { text: "A little note from me", font: "DM Sans" },
          ].map((t) => (
            <button
              className="type-sample"
              style={{ fontFamily: t.font }}
              key={t.font}
              onClick={() => add("text", t.text, t.font)}
            >
              {t.text}
              <Plus size={15} />
            </button>
          ))}
          <p className="help">
            Add a style, then select it on your postcard to change the words.
          </p>
        </>
      )}
      {tool === "stickers" && (
        <>
          <p className="panel-intro">
            For the joy of sticking things
            <br />
            wherever you like.
          </p>
          <div className="sticker-grid">
            {["sun", "heart", "flower", "star"].map((s, i) => (
              <button
                key={s}
                onClick={() => add("sticker", s)}
                aria-label={`Add ${s} sticker`}
              >
                <span className={`sticker-symbol sticker-${s}`}>
                  {["☀", "♥", "✿", "★"][i]}
                </span>
                <small>{s}</small>
              </button>
            ))}
          </div>
          <div className="paper-note">
            A little imperfect.
            <br />A little more you.
            <Heart size={20} />
          </div>
        </>
      )}
      {tool === "paper" && (
        <>
          <p className="panel-intro">The little details make it personal.</p>
          <h3>Paper color</h3>
          <Swatches value={card.paper} onChange={(paper) => patch({ paper })} />
          <h3>Ink on the back</h3>
          <Swatches value={card.ink} onChange={(ink) => patch({ ink })} />
          <h3>A stamp for the journey</h3>
          <div className="stamp-options">
            {["sun", "heart", "flower", "star"].map((s, i) => (
              <button
                key={s}
                aria-label={`${s} postage stamp`}
                aria-pressed={card.stamp === s}
                onClick={() => patch({ stamp: s })}
              >
                {["☀", "♥", "✿", "★"][i]}
              </button>
            ))}
          </div>
          <p className="help">Flip your postcard to see the stamp and ink.</p>
        </>
      )}
      {tool === "layers" && (
        <>
          <p className="panel-intro">Top of this list, top of the postcard.</p>
          <div className="layer-list">
            {[...card.layers].reverse().map((l) => (
              <button
                key={l.id}
                className={selected === l.id ? "active" : ""}
                onClick={() => {
                  setSelected(l.id);
                  setSide("front");
                  setMobilePanel(false);
                }}
              >
                {l.kind === "text" ? <Type size={16} /> : <Stamp size={16} />}
                <span>{l.text}</span>
              </button>
            ))}
          </div>
          {card.layers.length === 0 && (
            <p className="help">
              A clean slate. Add text or a sticker to begin.
            </p>
          )}
        </>
      )}
    </>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <div className="announcement">
          LESS SCROLLING. MORE SOUVENIRS.
          <span>MADE FOR THE MOMENTS IN BETWEEN</span>
        </div>
        <header className="header">
          <button
            className="brand"
            onClick={() => setGallery(false)}
            aria-label="PixelPost studio"
          >
            <Mail strokeWidth={1.4} />
            <span>
              pixelpost<span className="brand-dot">®</span>
            </span>
          </button>
          <nav aria-label="Main navigation">
            <button
              className={!gallery ? "nav-active" : ""}
              onClick={() => setGallery(false)}
            >
              The studio
            </button>
            <button
              className={gallery ? "nav-active" : ""}
              onClick={() => setGallery(true)}
            >
              My postcards <span className="count">{saved.length}</span>
            </button>
            <button onClick={() => setAbout(true)}>
              A little about us <span>↗</span>
            </button>
          </nav>
          <span className="header-note">
            From somewhere,
            <br />
            <em>with love.</em>
          </span>
        </header>
        {storageError && (
          <div role="alert" className="storage-error">
            {storageError}
          </div>
        )}
        {gallery ? (
          <main className="gallery">
            <div className="gallery-heading">
              <div>
                <span className="eyebrow">YOUR PERSONAL POSTCARD BOX</span>
                <h1>
                  Good times. <em>Kept close.</em>
                </h1>
                <p>
                  A little collection of places, people, and everything in
                  between.
                </p>
              </div>
              <Button
                onClick={() => {
                  setGallery(false);
                  setTool("templates");
                }}
              >
                <Plus size={17} /> Make a postcard
              </Button>
            </div>
            {saved.length ? (
              <div className="gallery-grid">
                {saved.map((c) => (
                  <motion.article layout key={c.id}>
                    <button
                      className="gallery-card"
                      onClick={() => {
                        commit(c);
                        setGallery(false);
                        setSelected(null);
                        setSide("front");
                      }}
                    >
                      <Preview card={c} />
                    </button>
                    <div className="gallery-card-meta">
                      <div>
                        <h2>{c.name}</h2>
                        <small>
                          {new Date(c.updated).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </small>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${c.name} from gallery`}
                        onClick={() => {
                          setSaved((items) =>
                            items.filter((item) => item.id !== c.id),
                          );
                          if (card.id === c.id) setCard({ ...card, id: "" });
                          setNotice(
                            "Removed from gallery. Your open draft is kept.",
                          );
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="empty-gallery">
                <Mail size={60} strokeWidth={1} />
                <h2>Your next memory goes here.</h2>
                <p>Save a postcard from the studio to start your collection.</p>
                <Button onClick={() => setGallery(false)}>
                  Back to the studio <ArrowLeft size={16} />
                </Button>
              </div>
            )}
            <p className="gallery-footnote">
              Saved on this device · No account, no cloud, just your little
              corner of the internet.
            </p>
          </main>
        ) : (
          <>
            <section className="intro">
              <div>
                <span className="eyebrow">THE DIGITAL POSTCARD ATELIER</span>
                <h1>
                  A little piece of <em>somewhere.</em>
                </h1>
              </div>
              <p>
                Turn a moment into something worth keeping.
                <br /> Pick a starting point. Make it yours. Send some joy.
              </p>
              <span className="intro-doodle">
                hello,
                <br />
                good times <span>↙</span>
              </span>
            </section>
            <main className="workspace">
              <aside className="tool-rail" aria-label="Editor tools">
                {tools.map((t) => (
                  <button
                    className={tool === t.id ? "active" : ""}
                    key={t.id}
                    onClick={() => {
                      setTool(t.id);
                      setMobilePanel(true);
                    }}
                  >
                    <t.icon size={21} strokeWidth={1.6} />
                    <span>{t.name}</span>
                  </button>
                ))}
                <div className="rail-bottom">
                  <Heart size={17} strokeWidth={1.4} />
                </div>
              </aside>
              <aside
                className={`tool-panel ${mobilePanel ? "panel-open" : ""}`}
              >
                {panel}
              </aside>
              <section className="editor">
                <div className="editor-toolbar">
                  <div className="document-title">
                    <Input
                      aria-label="Postcard name"
                      value={card.name}
                      maxLength={45}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                    <span>
                      <span className="status-dot" />
                      {storageError
                        ? "Not saved — export to keep"
                        : ready
                          ? "Autosaved in this browser"
                          : "Opening your studio…"}
                    </span>
                  </div>
                  <div className="toolbar-actions">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Undo"
                      onClick={undo}
                      disabled={!history.length}
                    >
                      <Undo2 size={17} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Redo"
                      onClick={redo}
                      disabled={!future.length}
                    >
                      <Redo2 size={17} />
                    </Button>
                    <span className="toolbar-divider" />
                    <Button
                      variant="outline"
                      className="save-button"
                      onClick={save}
                    >
                      <Save size={15} />
                      <span>Save</span>
                    </Button>
                    <Button
                      onClick={download}
                      disabled={busy}
                      className="export-button"
                    >
                      <ArrowDownToLine size={16} />
                      {busy && !pdfBusy ? "Working…" : "Export PNG"}
                    </Button>
                    <Button
                      onClick={downloadPdf}
                      disabled={busy}
                      variant="outline"
                      className="pdf-button"
                    >
                      <ArrowDownToLine size={16} />
                      {pdfBusy ? "Making PDF…" : "Download postcard PDF"}
                    </Button>
                  </div>
                </div>
                <div className="print-hint">
                  PDF includes both sides · 6 × 4 inches{" "}
                  <button onClick={() => setPrintTip(true)}>
                    Printing tips ↗
                  </button>
                </div>
                <div className="desk">
                  <div className="desk-topline">
                    <span>YOUR CANVAS, YOUR LITTLE ESCAPE</span>
                    <span>01 / {side === "front" ? "FRONT" : "BACK"}</span>
                  </div>
                  <div className="postcard-wrap">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={side}
                        initial={{ rotateY: -80, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 80, opacity: 0 }}
                        transition={{ duration: 0.23 }}
                        className="postcard-stage"
                        ref={stageRef}
                        onClick={() => setSelected(null)}
                      >
                        <Preview card={card} side={side} />
                        {side === "front" &&
                          card.layers.map((l) => (
                            <button
                              key={l.id}
                              className={`layer-hit ${selected === l.id ? "selected" : ""}`}
                              style={{
                                left: `${l.x / 12}%`,
                                top: `${l.y / 8}%`,
                                width: `${layerWidth(l) / 12}%`,
                                height: `${(l.size * 1.1) / 8}%`,
                                transform: `translate(-50%,-50%) rotate(${l.rotation}deg)`,
                              }}
                              aria-label={`Edit ${l.kind}: ${l.text}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(l.id);
                              }}
                              onPointerDown={(e) => begin(e, l)}
                              onPointerMove={move}
                              onPointerUp={end}
                              onPointerCancel={end}
                              onKeyDown={(e) => {
                                const directions: Record<
                                  string,
                                  [number, number]
                                > = {
                                  ArrowLeft: [-1, 0],
                                  ArrowRight: [1, 0],
                                  ArrowUp: [0, -1],
                                  ArrowDown: [0, 1],
                                };
                                if (directions[e.key]) {
                                  e.preventDefault();
                                  const [x, y] = directions[e.key],
                                    n = e.shiftKey ? 10 : 2;
                                  patch({
                                    layers: card.layers.map((item) =>
                                      item.id === l.id
                                        ? {
                                            ...item,
                                            x: Math.max(
                                              20,
                                              Math.min(1180, item.x + x * n),
                                            ),
                                            y: Math.max(
                                              20,
                                              Math.min(780, item.y + y * n),
                                            ),
                                          }
                                        : item,
                                    ),
                                  });
                                }
                              }}
                            >
                              {selected === l.id && (
                                <>
                                  <span className="selection-label">
                                    {l.kind === "text" ? "TEXT" : "STICKER"} ·
                                    DRAG TO MOVE
                                  </span>
                                  <span className="corner tl" />
                                  <span className="corner tr" />
                                  <span className="corner bl" />
                                  <span className="corner br" />
                                </>
                              )}
                            </button>
                          ))}
                      </motion.div>
                    </AnimatePresence>
                    <div className="canvas-controls">
                      {layer && side === "front" && (
                        <div
                          className="selection-actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            aria-label="Drag to resize selected layer"
                            onPointerDown={(e) => begin(e, layer, "resize")}
                            onPointerMove={move}
                            onPointerUp={end}
                            onPointerCancel={end}
                          >
                            <Move size={13} /> Resize
                          </button>
                          <button
                            aria-label="Drag to rotate selected layer"
                            onPointerDown={(e) => begin(e, layer, "rotate")}
                            onPointerMove={move}
                            onPointerUp={end}
                            onPointerCancel={end}
                          >
                            <RotateCw size={13} /> Rotate
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="desk-caption">a memory in the making</span>
                  </div>
                  <div className="canvas-bottom">
                    <span>6 × 4 IN · LANDSCAPE</span>
                    <Tabs
                      value={side}
                      onValueChange={(v) => {
                        setSide(v as "front" | "back");
                        setSelected(null);
                      }}
                    >
                      <TabsList>
                        <TabsTrigger value="front">The front</TabsTrigger>
                        <TabsTrigger value="back">
                          A little note <RotateCw size={13} />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <span>2400 × 1600 PX EXPORT</span>
                  </div>
                </div>
                <div className="editor-bottom">
                  <span>
                    <Move size={14} /> Select an element to move, resize, or
                    make it yours.
                  </span>
                  <button onClick={() => setAbout(true)}>
                    A few helpful tips <span>↗</span>
                  </button>
                </div>
                {(layer && side === "front") || side === "back" ? (
                  <section className="inspector">
                    <div className="inspector-heading">
                      <h2>
                        {side === "back"
                          ? "Words worth sending"
                          : layer?.kind === "text"
                            ? "Make it say something"
                            : "A little finishing touch"}
                      </h2>
                      {side === "front" && (
                        <button
                          aria-label="Deselect layer"
                          onClick={() => setSelected(null)}
                        >
                          <X size={17} />
                        </button>
                      )}
                    </div>
                    {side === "back" ? (
                      <div className="back-fields">
                        <label>
                          Your message
                          <Textarea
                            value={card.message}
                            maxLength={220}
                            onChange={(e) =>
                              patch({
                                message: e.target.value
                                  .split("\n")
                                  .slice(0, 8)
                                  .join("\n"),
                              })
                            }
                          />
                          <small>
                            {card.message.length}/220 characters · Keep line
                            breaks to 8 lines.
                          </small>
                        </label>
                        <div>
                          <label>
                            To
                            <Textarea
                              value={card.recipient}
                              maxLength={80}
                              onChange={(e) =>
                                patch({
                                  recipient: e.target.value
                                    .split("\n")
                                    .slice(0, 4)
                                    .join("\n"),
                                })
                              }
                            />
                          </label>
                          <label>
                            Sign it off
                            <Input
                              value={card.sender}
                              maxLength={40}
                              onChange={(e) =>
                                patch({ sender: e.target.value })
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      layer && (
                        <div className="layer-properties">
                          <div className="layer-text-controls">
                            {layer.kind === "text" && (
                              <>
                                <label>
                                  Your words
                                  <Input
                                    value={layer.text}
                                    maxLength={80}
                                    onChange={(e) =>
                                      editLayer({ text: e.target.value })
                                    }
                                  />
                                </label>
                                <label>
                                  Typeface
                                  <select
                                    value={layer.font}
                                    onChange={(e) =>
                                      editLayer({ font: e.target.value })
                                    }
                                  >
                                    {[
                                      "Bebas Neue",
                                      "Caveat",
                                      "DM Serif Display",
                                      "DM Sans",
                                    ].map((f) => (
                                      <option key={f}>{f}</option>
                                    ))}
                                  </select>
                                </label>
                              </>
                            )}
                            <Swatches
                              value={layer.color}
                              onChange={(color) => editLayer({ color })}
                            />
                          </div>
                          <div>
                            <Range
                              label="Size"
                              min={20}
                              max={300}
                              value={layer.size}
                              onChange={(size) => editLayer({ size })}
                            />
                            <Range
                              label="Rotation"
                              min={-180}
                              max={180}
                              value={layer.rotation}
                              onChange={(rotation) => editLayer({ rotation })}
                            />
                          </div>
                          <div className="layer-commands">
                            <Button
                              variant="outline"
                              onClick={() => {
                                const copy = {
                                  ...layer,
                                  id: uid(),
                                  x: Math.min(1180, layer.x + 30),
                                  y: Math.min(780, layer.y + 30),
                                };
                                if (card.layers.length < 30) {
                                  patch({ layers: [...card.layers, copy] });
                                  setSelected(copy.id);
                                }
                              }}
                            >
                              <Copy size={14} /> Duplicate
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                patch({
                                  layers: [
                                    ...card.layers.filter(
                                      (l) => l.id !== layer.id,
                                    ),
                                    layer,
                                  ],
                                })
                              }
                            >
                              <ArrowUp size={14} /> Bring forward
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                patch({
                                  layers: card.layers.filter(
                                    (l) => l.id !== layer.id,
                                  ),
                                });
                                setSelected(null);
                              }}
                            >
                              <Trash2 size={14} /> Remove
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </section>
                ) : (
                  <div className="studio-note">
                    <span className="small-star">✳</span>
                    <p>
                      No likes. No algorithms.
                      <br />
                      <strong>Just a little something you made.</strong>
                    </p>
                    <span className="privacy-note">
                      Your creativity stays yours.
                      <br />
                      Everything is saved in your browser.
                    </span>
                  </div>
                )}
              </section>
            </main>
          </>
        )}
        <footer>
          <span className="footer-brand">pixelpost</span>
          <span>A SMALL STUDIO FOR BIG LITTLE MEMORIES.</span>
          <span>
            Made with a little love <Heart size={12} />
          </span>
        </footer>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload postcard photo"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Dialog open={printTip} onOpenChange={setPrintTip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your postcard, on paper.</DialogTitle>
            <DialogDescription>
              One PDF, two 6 × 4 inch pages: the front first, your little note
              second.
            </DialogDescription>
          </DialogHeader>
          <div className="tips">
            <p>
              <b>01</b>
              <span>
                Print at <strong>Actual size / 100%</strong>. Choose 6 × 4 inch
                paper, or center on a larger sheet and trim.
              </span>
            </p>
            <p>
              <b>02</b>
              <span>
                Choose <strong>double-sided, flip on short edge</strong>. Try a
                plain-paper test first—printer feed and duplex settings vary.
              </span>
            </p>
            <p>
              <b>03</b>
              <span>
                Use cardstock supported by your printer. For manual duplex,
                follow its paper-reloading instructions.
              </span>
            </p>
          </div>
          <p className="help">
            This is a home-printing PDF without bleed or crop marks.
            Edge-to-edge printing needs a borderless printer; the illustrated
            stamp is decorative.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="about-dialog">
          <DialogHeader>
            <span className="eyebrow">A NOTE FROM THE STUDIO</span>
            <DialogTitle>A slower kind of sharing.</DialogTitle>
            <DialogDescription>
              PixelPost turns everyday photos into little keepsakes. No account
              required. No photos uploaded. Just you and a blank piece of
              (digital) paper.
            </DialogDescription>
          </DialogHeader>
          <div className="tips">
            <p>
              <b>01</b>
              <span>
                Pick a template, swap the photo, and add your own words.
              </span>
            </p>
            <p>
              <b>02</b>
              <span>
                Drag any text or sticker. Use the controls below the canvas to
                resize, rotate, and reorder. Arrow keys move a focused element;
                Shift moves it further.
              </span>
            </p>
            <p>
              <b>03</b>
              <span>
                Flip to write a note. Save to your local gallery or export
                either side as a 2400 × 1600 PNG.
              </span>
            </p>
          </div>
          <p className="help">
            Gallery and drafts stay in this browser. Clearing browser data
            removes them, so download the postcards you love. PNGs can be shared
            yourself; this studio does not send physical mail.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTemplate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A fresh piece of paper?</DialogTitle>
            <DialogDescription>
              This starts a new postcard. Save your current design to the
              gallery first if you’d like to keep it. You can also undo this
              change.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>
              Keep creating
            </Button>
            <Button
              onClick={() => pendingTemplate && newTemplate(pendingTemplate)}
            >
              Start fresh
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast"
            role="status"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} />
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
