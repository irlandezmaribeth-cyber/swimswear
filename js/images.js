/* Saltline Swim — image map
   Keys are referenced by products (P[].s) and by the hero/editorial sections.
   Replace a file in /assets/img and keep its name to swap a picture. */
const IM = {
  y:  "assets/img/product-limoncello-triangle-set.jpg",
  pk: "assets/img/product-fuchsia-string-set.jpg",
  tl: "assets/img/product-lagoon-tie-side-set.jpg",
  ol: "assets/img/product-olive-tie-set.jpg",
  rg: "assets/img/product-stripe-swim-ring.jpg",
  tw: "assets/img/product-fringe-beach-towel.jpg",
  h1: "assets/img/hero-umbrella-beach.jpg",
  h2: "assets/img/hero-beach-chairs.jpg",
  h3: "assets/img/hero-pool-floats.jpg",
  e1: "assets/img/editorial-pool-flatlay.jpg",
  e2: "assets/img/editorial-sea-sun-sand.jpg"
};
/* Per-product crop focus so faces stay in frame */
const POS = { pk: "50% 78%", tl: "50% 30%" };
const art = (s, k) => `<img src="${IM[s]}" alt=""${POS[s] ? ` style="object-position:${POS[s]}"` : ""} loading="lazy">`;
