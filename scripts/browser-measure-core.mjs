import { isAbsolute, join } from "node:path";

// The pure half of `browser-measure.mjs`, kept apart so `src/lib/browserMeasure.test.ts` can import it without running it.

/** What a mozLz4 file may declare before it is refused; a session file is tens of megabytes at the very most. */
export const MAX_DECODED = 512 * 1024 * 1024;

/** The matcher's comparison form (`matcher::normalize`): lower case, every run of non-alphanumerics one space. */
export function norm(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Words that say where in a series something is rather than what it is, so they never make a title distinctive. */
const MARKER_WORDS = new Set(["episode", "ep", "e", "folge", "chapter", "ch", "part", "season", "staffel", "s"]);

/** Two words and six letters left once numbers and episode words are gone, so "Episode 1" never links a tab. */
export function distinctive(s) {
  const words = norm(s)
    .split(" ")
    .filter((w) => w && !/^\p{N}+$/u.test(w) && !MARKER_WORDS.has(w));
  return words.length >= 2 && words.join("").length >= 6;
}

/** How a tab or window relates to a session title: "equal", "contains" (whole words), or null for no evidence. */
export function relation(title, sessionTitle) {
  const t = norm(title);
  const s = norm(sessionTitle);
  if (!s) return null;
  if (t === s) return "equal";
  return distinctive(s) && ` ${t} `.includes(` ${s} `) ? "contains" : null;
}

/** Hides what shared output must not carry: brand names, URL hosts unless kept, and the home folder. */
export function redactText(s, { brands = [], keepHosts = false, home = "" } = {}) {
  if (typeof s !== "string") return s;
  let out = s;
  if (!keepHosts) out = out.replace(/\b([a-z][a-z0-9+.-]*):\/\/[^/\s?#]+/gi, "$1://<host>");
  for (const brand of brands) {
    if (brand) out = out.replace(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<SITE>");
  }
  return home ? out.split(home).join("~") : out;
}

/** Decodes one raw LZ4 block (no frame), refusing anything that would read or write outside its buffers. */
export function lz4Block(src, size) {
  const out = new Uint8Array(size);
  let s = 0;
  let d = 0;
  const length = (n) => {
    if (n !== 15) return n;
    let b;
    do {
      if (s >= src.length) throw new Error("lz4: a length runs past the input");
      b = src[s++];
      n += b;
    } while (b === 255);
    return n;
  };
  while (s < src.length) {
    const token = src[s++];
    const lit = length(token >> 4);
    if (s + lit > src.length || d + lit > size) throw new Error("lz4: literals run past a buffer");
    out.set(src.subarray(s, s + lit), d);
    s += lit;
    d += lit;
    if (s >= src.length) break;
    if (s + 2 > src.length) throw new Error("lz4: an offset runs past the input");
    const offset = src[s] | (src[s + 1] << 8);
    s += 2;
    const len = length(token & 15) + 4;
    if (offset === 0 || offset > d || d + len > size) throw new Error("lz4: a match reaches outside the output");
    for (let k = 0; k < len; k++, d++) out[d] = out[d - offset];
  }
  return out.subarray(0, d);
}

/** The bytes "mozLz40\0" every Firefox session file starts with. */
const MOZ_MAGIC = [0x6d, 0x6f, 0x7a, 0x4c, 0x7a, 0x34, 0x30, 0x00];

/** Firefox's session format: the magic, the decoded size as u32 LE, then one LZ4 block. */
export function mozLz4(bytes, cap = MAX_DECODED) {
  if (bytes.length < 12 || MOZ_MAGIC.some((b, i) => bytes[i] !== b)) throw new Error("not a mozLz4 file");
  const size = (bytes[8] | (bytes[9] << 8) | (bytes[10] << 16) | (bytes[11] << 24)) >>> 0;
  if (size > cap) throw new Error(`declares ${size} bytes, past the cap of ${cap}`);
  return lz4Block(bytes.subarray(12), size);
}

/** Every open tab's current entry; closed tabs, closed windows and back history are never read. */
export function tabsOf(state) {
  const tabs = [];
  (state.windows ?? []).forEach((w, wi) => {
    (w.tabs ?? []).forEach((t, ti) => {
      const entries = t.entries ?? [];
      const e = entries[(t.index ?? entries.length) - 1] ?? {};
      tabs.push({
        window: wi + 1,
        tab: ti + 1,
        selected: w.selected === ti + 1,
        hidden: Boolean(t.hidden),
        lastAccessed: t.lastAccessed ?? null,
        title: e.title ?? "",
        url: e.url ?? "",
      });
    });
  });
  return tabs;
}

/** busctl's JSON wraps every value as {type, data}; this takes the wrapping off, nested dictionaries included. */
export function unvariant(v) {
  if (Array.isArray(v)) return v.map(unvariant);
  if (v && typeof v === "object") {
    if ("type" in v && "data" in v && Object.keys(v).length === 2) return unvariant(v.data);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, unvariant(x)]));
  }
  return v;
}

/** The sections of an ini file as {name: {key: value}}; enough for profiles.ini and installs.ini. */
export function parseIni(text) {
  const sections = {};
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const head = line.match(/^\[(.+)\]$/);
    if (head) {
      current = sections[head[1]] = {};
    } else if (current) {
      const i = line.indexOf("=");
      if (i > 0) current[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return sections;
}

/** Each profile the ini lists, with the install hashes that name it as their default. */
export function profilesOf(root, iniText) {
  const ini = parseIni(iniText);
  const resolve = (path, relative) => (relative && !isAbsolute(path) ? join(root, path) : path);
  const defaults = new Map();
  for (const [name, s] of Object.entries(ini)) {
    if (name.startsWith("Install") && s.Default) {
      const dir = resolve(s.Default, true);
      defaults.set(dir, [...(defaults.get(dir) ?? []), name.slice("Install".length)]);
    }
  }
  return Object.entries(ini)
    .filter(([name, s]) => name.startsWith("Profile") && s.Path)
    .map(([, s]) => {
      const dir = resolve(s.Path, s.IsRelative !== "0");
      return { name: s.Name ?? s.Path, dir, installs: defaults.get(dir) ?? [], legacyDefault: s.Default === "1" };
    });
}
