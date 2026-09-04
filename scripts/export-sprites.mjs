/**
 * Exports each sprite in the cyberpunk sheet as its own PNG and refreshes the
 * "Collection of Images" tileset in map.json.  `node scripts/export-sprites.mjs`
 *
 * Sprites are auto-found by flood-filling non-transparent islands; curated rects
 * (below) override islands they contain, since some objects are drawn as several
 * islands. Existing tile ids are preserved so placed objects keep their art.
 */
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const SHEET = "public/assets/pixel_cyberpunk_interior_free_1.0.1/pixel-cyberpunk-interior.png";
const OUT_DIR = "public/assets/furniture";
const MAP = "public/assets/map.json";
const TILESET_NAME = "furniture";

/** Hand-named regions. These win over auto-detected islands. */
const CURATED = {
  computer: { x: 208, y: 64, w: 64, h: 32 },
  computerOrange: { x: 208, y: 97, w: 64, h: 32 },
  poster: { x: 417, y: 1, w: 62, h: 29 },
  window: { x: 584, y: 4, w: 78, h: 25 },
  window2: { x: 584, y: 35, w: 78, h: 25 },
  window3: { x: 585, y: 67, w: 78, h: 25 },
  shelf: { x: 226, y: 170, w: 28, h: 46 },
  mailbox: { x: 230, y: 3, w: 20, h: 26 },
  stairs: { x: 195, y: 242, w: 42, h: 46 },
  closet: { x: 243, y: 242, w: 42, h: 46 },
  ac: { x: 352, y: 9, w: 32, h: 19 },
  desk: { x: 387, y: 162, w: 59, h: 29 },
  chair1: { x: 323, y: 64, w: 25, h: 30 },
  chair2: { x: 353, y: 96, w: 23, h: 30 },
  bed: { x: 515, y: 97, w: 58, h: 25 },
  blanket: { x: 264, y: 300, w: 46, h: 35 },
  bedShelf: { x: 393, y: 300, w: 46, h: 8 },
  bedAlt: { x: 204, y: 294, w: 41, h: 48 },
  blanketOrange: { x: 330, y: 300, w: 46, h: 35 },
  doorOrange: { x: 195, y: 242, w: 42, h: 46 },
  terminalOrange: { x: 198, y: 3, w: 20, h: 26 },
  arcade: { x: 611, y: 97, w: 26, h: 30 },
  lamp: { x: 586, y: 163, w: 10, h: 28 },
  fan: { x: 260, y: 5, w: 57, h: 25 },
  vending: { x: 258, y: 170, w: 28, h: 48 },
  locker: { x: 322, y: 228, w: 28, h: 28 },
  screenWide: { x: 352, y: 38, w: 30, h: 22 },
  pillow: { x: 582, y: 201, w: 21, h: 14 },

  // Room outline, sliced out of the pack's plus-shaped border. Straight runs
  // only, taken clear of its corners, so they can be laid along an edge by hand.
  outlineTop: { x: 72, y: 150, w: 16, h: 10 },
  outlineBottom: { x: 72, y: 256, w: 16, h: 14 },
  outlineLeft: { x: 23, y: 200, w: 9, h: 16 },
  outlineRight: { x: 128, y: 200, w: 9, h: 16 },

  // Capped corners and side edges from the wall block at the sheet's origin.
  outlineCornerTL: { x: 0, y: 0, w: 8, h: 8 },
  outlineCornerTR: { x: 56, y: 0, w: 8, h: 8 },
  outlineSideL: { x: 0, y: 16, w: 8, h: 16 },
  outlineSideR: { x: 56, y: 16, w: 8, h: 16 },
  kitchen: { x: 384, y: 64, w: 96, h: 67 },
  wallBlock: { x: 0, y: 0, w: 160, h: 128 },
  roomOutline: { x: 23, y: 150, w: 114, h: 120 },
};

function decode(file) {
  const b = fs.readFileSync(file);
  let pos = 8,
    w = 0,
    h = 0,
    ctype = 0;
  const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const type = b.toString("ascii", pos + 4, pos + 8);
    const data = b.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      ctype = data[9];
    } else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const line = raw.subarray(p, p + stride);
    p += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0,
        bb = prev[x],
        c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += bb;
      else if (f === 3) v += (a + bb) >> 1;
      else if (f === 4) {
        const pp = a + bb - c,
          pa = Math.abs(pp - a),
          pb = Math.abs(pp - bb),
          pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      }
      cur[x] = v & 0xff;
    }
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r,
      g,
      bl,
      al = 255;
    if (ch === 4) {
      r = out[i * 4];
      g = out[i * 4 + 1];
      bl = out[i * 4 + 2];
      al = out[i * 4 + 3];
    } else if (ch === 3) {
      r = out[i * 3];
      g = out[i * 3 + 1];
      bl = out[i * 3 + 2];
    } else {
      r = g = bl = out[i];
    }
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = bl;
    rgba[i * 4 + 3] = al;
  }
  return { w, h, rgba };
}

let TABLE = null;
function crc32(buf) {
  if (!TABLE) {
    TABLE = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const x of buf) c = TABLE[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Colour type 6 so transparency survives. */
function encodeRGBA(w, h, rgba) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 4);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Flood-fill islands of non-transparent pixels. */
function findIslands(im, minPixels = 24) {
  const alpha = (x, y) => im.rgba[(y * im.w + x) * 4 + 3];
  const seen = new Uint8Array(im.w * im.h);
  const boxes = [];
  for (let y = 0; y < im.h; y++) {
    for (let x = 0; x < im.w; x++) {
      const i = y * im.w + x;
      if (seen[i] || alpha(x, y) < 16) continue;
      let minx = x,
        maxx = x,
        miny = y,
        maxy = y,
        n = 0;
      const st = [i];
      seen[i] = 1;
      while (st.length) {
        const cur = st.pop();
        const cx = cur % im.w,
          cy = (cur / im.w) | 0;
        n++;
        if (cx < minx) minx = cx;
        if (cx > maxx) maxx = cx;
        if (cy < miny) miny = cy;
        if (cy > maxy) maxy = cy;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx,
              ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= im.w || ny >= im.h) continue;
            const ni = ny * im.w + nx;
            if (seen[ni] || alpha(nx, ny) < 16) continue;
            seen[ni] = 1;
            st.push(ni);
          }
        }
      }
      if (n >= minPixels) boxes.push({ x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 });
    }
  }
  return boxes;
}

const sheet = decode(SHEET);
const inside = (a, b) =>
  a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;

const regions = new Map(Object.entries(CURATED));
const curatedRects = Object.values(CURATED);
for (const box of findIslands(sheet)) {
  if (curatedRects.some((c) => inside(box, c))) continue;
  regions.set(`spr_${String(box.x).padStart(3, "0")}_${String(box.y).padStart(3, "0")}`, box);
}

// Preserve existing tile ids so already-placed objects keep their art.
const map = JSON.parse(fs.readFileSync(MAP, "utf8"));
const existing = map.tilesets.find((t) => t.name === TILESET_NAME);
const order = [];
const seenNames = new Set();
if (existing?.tiles) {
  for (const t of [...existing.tiles].sort((a, b) => a.id - b.id)) {
    const stem = path.basename(t.image).replace(/\.[^.]+$/, "");
    order.push(stem);
    seenNames.add(stem);
  }
}
for (const name of regions.keys()) if (!seenNames.has(name)) order.push(name);

fs.mkdirSync(OUT_DIR, { recursive: true });
const tiles = [];
let written = 0;
order.forEach((name, id) => {
  const r = regions.get(name);
  if (!r) {
    console.warn(`  ! tile id ${id} "${name}" no longer detected; slot left empty`);
    return;
  }
  const sub = Buffer.alloc(r.w * r.h * 4);
  for (let y = 0; y < r.h; y++) {
    const from = ((r.y + y) * sheet.w + r.x) * 4;
    sheet.rgba.copy(sub, y * r.w * 4, from, from + r.w * 4);
  }
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), encodeRGBA(r.w, r.h, sub));
  tiles.push({ id, image: `furniture/${name}.png`, imagewidth: r.w, imageheight: r.h });
  written++;
});

const firstgid = existing?.firstgid ?? map.tilesets[0].firstgid + map.tilesets[0].tilecount;
map.tilesets = map.tilesets.filter((t) => t.name !== TILESET_NAME);
map.tilesets.push({
  columns: 0,
  firstgid,
  name: TILESET_NAME,
  margin: 0,
  spacing: 0,
  grid: { orientation: "orthogonal", width: 1, height: 1 },
  tilecount: tiles.length,
  tilewidth: Math.max(...tiles.map((t) => t.imagewidth)),
  tileheight: Math.max(...tiles.map((t) => t.imageheight)),
  tiles,
});
fs.writeFileSync(MAP, JSON.stringify(map, null, 1));

console.log(`exported ${written} sprites to ${OUT_DIR}/`);
console.log(`tileset "${TILESET_NAME}" firstgid ${firstgid}, ${tiles.length} tiles`);
