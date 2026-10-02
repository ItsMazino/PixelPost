export type Layer = {
  id: string;
  kind: "text" | "sticker";
  text: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  font: string;
};
export type Postcard = {
  id: string;
  name: string;
  template: string;
  paper: string;
  ink: string;
  photo: string;
  zoom: number;
  panX: number;
  panY: number;
  filter: string;
  layers: Layer[];
  message: string;
  recipient: string;
  sender: string;
  stamp: string;
  updated: number;
};
export const photos = [
  { src: "/photos/coast.jpg", name: "Santorini, Greece" },
  { src: "/photos/kyoto.jpg", name: "Kyoto, Japan" },
  { src: "/photos/paris.jpg", name: "Paris, France" },
];
export const templates = [
  {
    id: "summer",
    name: "Endless summer",
    note: "A sun-soaked classic",
    color: "#eee5cf",
  },
  {
    id: "scrapbook",
    name: "Little adventures",
    note: "Collected along the way",
    color: "#dce2cf",
  },
  {
    id: "minimal",
    name: "A quiet moment",
    note: "Less, but lovelier",
    color: "#f1dfda",
  },
  {
    id: "airmail",
    name: "From far away",
    note: "First-class nostalgia",
    color: "#dce7e9",
  },
];
export const uid = () => crypto.randomUUID();
export function makeCard(template = "summer"): Postcard {
  const i = Math.max(
    0,
    templates.findIndex((t) => t.id === template),
  );
  return {
    id: "",
    name: templates[i].name,
    template: templates[i].id,
    paper: templates[i].color,
    ink: "#a8312e",
    photo: photos[i === 1 ? 1 : i === 2 ? 2 : 0].src,
    zoom: 1,
    panX: 50,
    panY: 58,
    filter: "original",
    message:
      "Days like these deserve a little piece of paper.\n\nSending you sunshine, slow mornings, and a wish that you were here.",
    recipient: "Someone wonderful\nSomewhere lovely",
    sender: "With love, me",
    stamp: "sun",
    updated: 0,
    layers: [
      {
        id: "title",
        kind: "text",
        text:
          i === 1
            ? "little adventures"
            : i === 2
              ? "Paris, je t’aime"
              : "SANTORINI",
        x: 600,
        y: i === 2 ? 675 : 183,
        size: i === 1 ? 95 : i === 2 ? 62 : 148,
        rotation: i === 1 ? -4 : 0,
        color: i === 2 ? "#a8312e" : "#fff8dd",
        font: i === 1 ? "Caveat" : i === 2 ? "DM Serif Display" : "Bebas Neue",
      },
      {
        id: "note",
        kind: "text",
        text: i === 2 ? "a moment worth keeping" : "wish you were here",
        x: 600,
        y: i === 2 ? 743 : 660,
        size: 53,
        rotation: -5,
        color: i === 2 ? "#735f57" : "#fff8dd",
        font: "Caveat",
      },
      ...(i === 2
        ? []
        : [
            {
              id: "sun",
              kind: "sticker" as const,
              text: "sun",
              x: 1020,
              y: 606,
              size: 130,
              rotation: 12,
              color: "#f3c957",
              font: "DM Sans",
            },
          ]),
    ],
  };
}
export function isCard(value: unknown): value is Postcard {
  if (!value || typeof value !== "object") return false;
  const c = value as Postcard;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    templates.some((t) => t.id === c.template) &&
    typeof c.paper === "string" &&
    typeof c.ink === "string" &&
    typeof c.photo === "string" &&
    (photos.some((p) => p.src === c.photo) ||
      /^data:image\/(jpeg|png|webp);base64,/.test(c.photo)) &&
    ["zoom", "panX", "panY", "updated"].every((k) =>
      Number.isFinite(c[k as keyof Postcard]),
    ) &&
    c.zoom >= 1 &&
    c.zoom <= 3 &&
    typeof c.filter === "string" &&
    ["message", "recipient", "sender", "stamp"].every(
      (k) => typeof c[k as keyof Postcard] === "string",
    ) &&
    Array.isArray(c.layers) &&
    c.layers.length <= 30 &&
    c.layers.every(
      (l) =>
        l !== null &&
        typeof l === "object" &&
        typeof l.id === "string" &&
        ["text", "sticker"].includes(l.kind) &&
        typeof l.text === "string" &&
        l.text.length <= 120 &&
        typeof l.font === "string" &&
        typeof l.color === "string" &&
        [l.x, l.y, l.size, l.rotation].every(Number.isFinite),
    )
  );
}
const cache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  if (!cache.has(src))
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          cache.delete(src);
          reject(
            new Error("This photo could not be loaded. Try another image."),
          );
        };
        img.src = src;
      }),
    );
  return cache.get(src)!;
}
export function sticker(
  ctx: CanvasRenderingContext2D,
  type: string,
  size: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#a8312e";
  ctx.lineWidth = size * 0.024;
  if (type === "sun") {
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(-size * 0.06, -size * 0.49);
      ctx.lineTo(size * 0.06, -size * 0.49);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-size * 0.09, -size * 0.025, size * 0.014, 0, 7);
    ctx.arc(size * 0.09, -size * 0.025, size * 0.014, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, size * 0.01, size * 0.12, 0, Math.PI);
    ctx.stroke();
  } else if (type === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.35);
    ctx.bezierCurveTo(
      -size * 0.7,
      -size * 0.12,
      -size * 0.25,
      -size * 0.6,
      0,
      -size * 0.2,
    );
    ctx.bezierCurveTo(
      size * 0.25,
      -size * 0.6,
      size * 0.7,
      -size * 0.12,
      0,
      size * 0.35,
    );
    ctx.fill();
  } else if (type === "flower") {
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.25, size * 0.13, size * 0.23, 0, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#a8312e";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, 7);
    ctx.fill();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        r = size * (i % 2 ? 0.2 : 0.48);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
}
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  line: number,
  maxLines = 9,
) {
  let row = 0;
  for (const para of text.split("\n")) {
    let current = "";
    for (const word of para.split(" ")) {
      const next = current ? current + " " + word : word;
      if (ctx.measureText(next).width > width && current) {
        if (row >= maxLines) return;
        ctx.fillText(current, x, y + row++ * line, width);
        current = word;
      } else current = next;
    }
    if (row >= maxLines) return;
    ctx.fillText(current, x, y + row++ * line, width);
  }
}
export async function drawCard(
  canvas: HTMLCanvasElement,
  card: Postcard,
  side: "front" | "back",
  width = 1200,
) {
  await Promise.all(
    ["DM Sans", "DM Serif Display", "Caveat", "Bebas Neue"].map((font) =>
      document.fonts.load(`40px "${font}"`),
    ),
  );
  await document.fonts.ready;
  const img = side === "front" ? await loadImage(card.photo) : null;
  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = (width * 2) / 3;
  const ctx = buffer.getContext("2d")!;
  ctx.scale(width / 1200, width / 1200);
  ctx.fillStyle = card.paper;
  ctx.fillRect(0, 0, 1200, 800);
  if (card.template === "airmail") {
    for (let x = -800; x < 1300; x += 64) {
      ctx.fillStyle = Math.floor(x / 64) % 2 === 0 ? "#a8312e" : "#426c85";
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(-Math.PI / 4);
      ctx.fillRect(0, 0, 22, 1800);
      ctx.restore();
    }
    ctx.fillStyle = card.paper;
    ctx.fillRect(18, 18, 1164, 764);
  }
  if (side === "front" && img) {
    const minimal = card.template === "minimal",
      scrap = card.template === "scrapbook";
    const box = {
      x: minimal ? 70 : 40,
      y: minimal ? 45 : 40,
      w: minimal ? 1060 : 1120,
      h: minimal ? 540 : 720,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    const scale = Math.max(box.w / img.width, box.h / img.height) * card.zoom;
    const w = img.width * scale,
      h = img.height * scale;
    ctx.filter =
      card.filter === "vintage"
        ? "sepia(0.45) saturate(0.8)"
        : card.filter === "mono"
          ? "grayscale(1)"
          : card.filter === "warm"
            ? "sepia(0.25) saturate(1.4)"
            : "none";
    ctx.drawImage(
      img,
      box.x - ((w - box.w) * card.panX) / 100,
      box.y - ((h - box.h) * card.panY) / 100,
      w,
      h,
    );
    ctx.filter = "none";
    if (!minimal) {
      const g = ctx.createLinearGradient(0, 0, 0, 800);
      g.addColorStop(0, "#142c3522");
      g.addColorStop(0.6, "#142c3500");
      g.addColorStop(1, "#142c3555");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1200, 800);
    }
    ctx.restore();
    if (scrap) {
      ctx.save();
      ctx.translate(190, 45);
      ctx.rotate(-0.12);
      ctx.fillStyle = "#e8d5bccc";
      ctx.fillRect(-100, -20, 220, 55);
      ctx.restore();
    }
    if (!minimal) {
      ctx.font = '18px "DM Sans"';
      ctx.fillStyle = "#fff8dd";
      ctx.textAlign = "center";
      ctx.fillText("GREETINGS FROM A VERY GOOD PLACE", 600, 88);
    }
    for (const l of card.layers) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate((l.rotation * Math.PI) / 180);
      if (l.kind === "sticker") sticker(ctx, l.text, l.size, l.color);
      else {
        ctx.fillStyle = l.color;
        ctx.font = `${l.size}px "${l.font}"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(l.text, 0, 0, 1120);
      }
      ctx.restore();
    }
  } else {
    ctx.strokeStyle = card.ink + "66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(640, 155);
    ctx.lineTo(640, 705);
    ctx.stroke();
    ctx.fillStyle = card.ink;
    ctx.textAlign = "left";
    ctx.font = '25px "DM Sans"';
    ctx.fillText("POST CARD", 70, 95);
    ctx.font = '20px "DM Sans"';
    ctx.fillText("A LITTLE PIECE OF SOMEWHERE", 70, 740);
    ctx.font = "39px Caveat";
    wrap(ctx, card.message, 70, 210, 510, 48, 8);
    ctx.font = "37px Caveat";
    ctx.fillText(card.sender.slice(0, 45), 70, 670, 510);
    ctx.font = '30px "DM Serif Display"';
    wrap(ctx, card.recipient, 705, 415, 410, 58, 4);
    for (let y = 435; y < 650; y += 58) {
      ctx.beginPath();
      ctx.moveTo(705, y);
      ctx.lineTo(1115, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(1040, 158);
    ctx.strokeStyle = card.ink;
    ctx.setLineDash([5, 7]);
    ctx.strokeRect(-76, -88, 152, 176);
    ctx.setLineDash([]);
    ctx.fillStyle = card.ink;
    ctx.fillRect(-65, -77, 130, 154);
    sticker(ctx, card.stamp, 100, card.paper);
    ctx.fillStyle = card.paper;
    ctx.textAlign = "center";
    ctx.font = '14px "DM Sans"';
    ctx.fillText("PIXELPOST · 01", 0, 63);
    ctx.restore();
    ctx.save();
    ctx.translate(880, 175);
    ctx.rotate(-0.2);
    ctx.strokeStyle = card.ink + "99";
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, 7);
    ctx.stroke();
    ctx.font = '16px "DM Sans"';
    ctx.fillStyle = card.ink;
    ctx.textAlign = "center";
    ctx.fillText("SENT WITH", 0, -5);
    ctx.fillText("LOVE", 0, 20);
    ctx.restore();
  }
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 5500; i++) {
    ctx.fillStyle = i % 2 ? "#fff" : "#342817";
    ctx.fillRect((i * 137.508) % 1200, (i * 73.317) % 800, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  canvas.getContext("2d")!.drawImage(buffer, 0, 0);
}
export async function photoData(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose an image smaller than 15 MB.");
  const src = URL.createObjectURL(file);
  try {
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(src);
    cache.delete(src);
  }
}
