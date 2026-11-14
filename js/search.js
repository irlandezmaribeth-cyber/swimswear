/* Saltline Swim — search: ranked matching on name, SKU, colour, category and keywords,
   typo tolerance, "under $50" price phrases, "did you mean", and recommendations. */
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const flat = s => norm(s).replace(/ /g, "");
const STOP = new Set("a an the some something anything any me my i you do does have has show looking look for want need to of in with and or is are it its please got can get find".split(" "));
const toksOf = s => norm(s).split(" ").filter(w => w && !STOP.has(w));
const POPULAR = ["bikini", "yellow", "towel", "swim ring", "under $50", "SL-2P"];

/* Per-product index, built once */
const IDX = P.map(p => {
  const words = norm([p.n, p.c, p.k.map(k => k.n).join(" "), p.kw].join(" ")).split(" ");
  return {
    p,
    name: norm(p.n),
    nameW: norm(p.n).split(" "),
    words: [...new Set(words)],
    // every purchasable SKU, flattened: SL2PLMN, SL2PLMNM, SL2PLMNXS ...
    skus: [p.sku, ...sizesOf(p).map(z => vsku(p, z))].map(flat),
    text: norm([p.n, p.c, p.k.map(k => k.n).join(" "), p.kw, p.sku].join(" "))
  };
});
const VOCAB = [...new Set(IDX.flatMap(i => i.words).filter(w => w.length > 2))];

/* Edit distance, capped (cheap: words are short) */
const dist = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const tol = w => w.length >= 7 ? 2 : w.length >= 4 ? 1 : 0;

/* Pull "under $50" / "below 60" / "less than 40" out of a query */
const priceCap = q => {
  const m = q.toLowerCase().match(/(?:under|below|less than|cheaper than|max|<)\s*\$?\s*(\d+)/);
  return m ? { max: +m[1], rest: q.replace(m[0], " ") } : { max: Infinity, rest: q };
};

/* Score one token against one product; 0 = no match */
const tokScore = (t, i) => {
  let s = 0;
  if (i.nameW.some(w => w.startsWith(t))) s = Math.max(s, t.length > 2 ? 30 : 12);
  else if (i.name.includes(t) && t.length > 2) s = Math.max(s, 20);
  if (i.words.some(w => w.startsWith(t))) s = Math.max(s, 18);
  if (i.text.includes(t) && t.length > 2) s = Math.max(s, 10);
  if (!s && tol(t)) {
    const d = Math.min(...i.words.map(w => dist(t, w)));
    if (d <= tol(t)) s = 8 - d;
  }
  return s;
};

/* find(query) -> [{p, score, why}] best first. Every word of the query must match. */
const find = q => {
  const { max, rest } = priceCap(q), toks = toksOf(rest), fl = flat(rest);
  const out = [];
  IDX.forEach(i => {
    if (i.p.p > max) return;
    // SKU search wins outright: "sl2plmn", "SL-2P-LMN-M", even partials like "2p-lm"
    if (fl.length >= 3 && i.skus.some(s => s.includes(fl))) {
      const exact = i.skus.includes(fl);
      return out.push({ p: i.p, score: exact ? 200 : 100 + i.p.r, why: "sku" });
    }
    if (!toks.length) return out.push({ p: i.p, score: i.p.r, why: "price" });
    let tot = 0;
    for (const t of toks) { const s = tokScore(t, i); if (!s) return; tot += s; }
    out.push({ p: i.p, score: tot + i.p.r, why: "text" });
  });
  return out.sort((a, b) => b.score - a.score);
};

/* "yelow" -> "yellow". Returns a corrected query string, or null if nothing to fix. */
const didYouMean = q => {
  const { max, rest } = priceCap(q), toks = toksOf(rest);
  let changed = false;
  const fixed = toks.map(t => {
    if (VOCAB.some(w => w.startsWith(t)) || t.length < 4) return t;
    let best = t, bd = 3;
    VOCAB.forEach(w => { const d = dist(t, w); if (d < bd) { bd = d; best = w } });
    if (best != t) changed = true;
    return best;
  });
  if (!changed) return null;
  const s = fixed.join(" ") + (max < Infinity ? ` under $${max}` : "");
  return find(s).length ? s : null;
};

/* Recommendations: related to the products matched (same category), else top rated */
const recs = (ids = [], n = 3) => {
  const cats = new Set(ids.map(id => gp(id).c));
  const pool = P.filter(p => !ids.includes(p.id));
  const rel = cats.size ? pool.filter(p => cats.has(p.c)) : [];
  return [...rel, ...pool.filter(p => !rel.includes(p))].sort((a, b) => b.r - a.r).slice(0, n);
};

/* Suggestion dropdown under the header search box */
const sgRow = p => `<button data-a="open" data-v="${p.id}"><span class="th">${art(p.s, p.k[0])}</span><span class="sgt">${esc(p.n)}<small>${esc(p.sku)} · ${esc(p.k[0].n)}</small></span><b>${m(p.p)}</b></button>`;
const sgR = () => {
  const v = $("q").value.trim(), g = $("sg");
  let h;
  if (!v) {
    h = `<div class="sgh">Popular searches</div><div class="chips">${POPULAR.map(t => `<button data-a="sterm" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div><div class="sgh">Trending now</div>${recs([], 3).map(sgRow).join("")}`;
  } else {
    const r = find(v);
    if (r.length) {
      h = `<div class="sgh">${r.some(x => x.why == "sku") ? "Matching SKUs" : "Products"}</div>${r.slice(0, 4).map(x => sgRow(x.p)).join("")}<button data-a="sq"><b class="sgall">See all ${r.length} result${r.length == 1 ? "" : "s"} for “${esc(v)}”</b></button>`;
    } else {
      const dm = didYouMean(v);
      h = `<div class="sgh">No matches for “${esc(v)}”</div>${dm ? `<button data-a="sterm" data-v="${esc(dm)}">Did you mean <b class="sgall">${esc(dm)}</b>?</button>` : ""}<div class="sgh">You might like</div>${recs([], 3).map(sgRow).join("")}`;
    }
  }
  g.innerHTML = h;
  g.style.display = "block";
};
