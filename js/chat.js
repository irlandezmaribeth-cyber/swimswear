/* Saltline Swim — customer support chat.
   A rule-based assistant that runs entirely in the browser (demo: no server, no AI model).
   It answers store-policy questions, looks up products by SKU or description, recommends items,
   checks orders placed in this browser, and hands off to a human by capturing an email address.
   To connect a real service later, replace reply() with a call to your backend and keep the UI. */
const CH = { open: false, log: L("chat", []), wait: null };
const CHIPS = ["Shipping", "Returns", "Sizing", "Track my order", "Recommend something", "Talk to a human"];
const saveChat = () => Wr("chat", CH.log.slice(-60));

/* message bodies are trusted HTML built here; anything the user typed goes through esc() first */
const miniP = p => `<button class="cpm" data-a="open" data-v="${p.id}"><span class="th">${art(p.s, p.k[0])}</span><span class="sgt">${esc(p.n)}<small>${esc(p.sku)} · ${esc(p.k[0].n)}</small></span><b>${m(p.p)}</b></button>`;
const prods = l => `<div class="cps">${l.map(miniP).join("")}</div>`;
const links = l => `<div class="chips">${l.map(t => `<button data-a="chq" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div>`;

const has = (t, re) => re.test(t);
const reply = raw => {
  const t = norm(raw), orig = raw.trim();

  /* waiting for an email address to hand off to a human */
  if (CH.wait == "email") {
    const em = orig.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    if (em) {
      CH.wait = null;
      return `Thanks! A teammate will email <b>${esc(em[0])}</b> within 1 business day. Your reference is <b>SUP-${10000 + Math.floor(Math.random() * 89999)}</b>. <small class="mu">(Demo: no email is actually sent.)</small>`;
    }
    if (!has(t, /cancel|never ?mind|stop|back/)) return "That doesn’t look like an email address. Could you type it like name@example.com? Or say “cancel”.";
    CH.wait = null;
    return "No problem, I’m still here if you need anything.";
  }

  /* order lookup: orders are stored in this browser only */
  const on = orig.match(/SL[- ]?(\d{5})/i), isSku = /sl[- ]?(2p|ac)/i.test(orig);
  if (on && !isSku || has(t, /\b(order|track|tracking|parcel|package|delivery status|where is my)\b/)) {
    if (on) {
      const no = "SL-" + on[1], o = S.orders.find(x => x.no == no);
      return o
        ? `Order <b>${no}</b>, placed ${esc(o.d)}: ${o.items.map(i => `${i.q} × ${esc(i.n)}`).join(", ")}. Total ${m(o.t)}. Status: <b>Processing</b>. Standard delivery takes 3–6 days after dispatch.`
        : `I can’t find <b>${no}</b> in this browser. Orders show up here only on the device where they were placed. I can pass this to a person if you’d like.${links(["Talk to a human"])}`;
    }
    return S.orders.length
      ? `Which order? Type the order number (like SL-12345), or pick a recent one:${links(S.orders.slice(0, 3).map(o => o.no))}`
      : "I can look up an order if you send the order number (it starts with SL-). I don’t see any orders placed in this browser yet.";
  }

  if (has(t, /^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/)) return `Hi${S.user ? " " + esc(S.user.n) : ""}! How can I help today?${links(CHIPS)}`;
  if (has(t, /\b(thanks|thank you|thx|cheers)\b/)) return "You’re welcome! Anything else I can help with?";
  if (has(t, /^(bye|goodbye|that s all|no thanks)\b/)) return "Happy swimming! I’m here whenever you need me.";

  if (has(t, /\b(human|agent|person|representative|someone|staff|call|email us|complain)\b/)) {
    CH.wait = "email";
    return "Of course. What email address should our team reply to?";
  }

  if (has(t, /\b(ship|shipping|delivery|deliver|express|how long|arrive)\b/))
    return "<b>Shipping</b><br>Standard: <b>$6</b>, 3–6 days, and <b>free over $120</b>.<br>Express: <b>$12</b>, 1–2 days.";
  if (has(t, /\b(return|returns|refund|exchange|send (it )?back)\b/))
    return "<b>Returns</b><br>You have 30 days. Items must be unworn with tags attached. Start a return by chatting with us here with your order number, and I’ll connect you with the team.";
  if (has(t, /\b(size|sizes|sizing|fit|fits|measurement|measurements|small|medium|large)\b/))
    return "Two-pieces come in <b>XS, S, M, L and XL</b> with an adjustable fit (ties and strings), so you can fine-tune the cut. Accessories are one size. Not sure which to pick? Tell me which suit you’re eyeing.";
  if (has(t, /\b(fabric|material|chlorine|nylon|uv|upf|sun|care|wash|quick dry|recycled)\b/))
    return "Every suit is recycled nylon blended with elastane. It resists chlorine, salt and sunscreen, dries quickly, holds colour for 200+ hours in the pool, and has UPF 50+ protection.";
  if (has(t, /\b(promo|code|discount|coupon|voucher|sale|splash10|offer)\b/))
    return "Use code <b>SPLASH10</b> in your bag for <b>10% off</b> your first order.";
  if (has(t, /\b(pay|payment|card|paypal|checkout|charge|charged)\b/))
    return "Saltline is a demo store, so no payment is taken and no orders are really placed. Feel free to use the demo details at checkout.";
  if (has(t, /\b(sku|item code|product code|article number)\b/) && !/sl[- ]?(2p|ac)/i.test(orig))
    return "Every product has a SKU shown on its page, in your bag and in order history. The base code looks like <b>SL-2P-LMN</b>, and each size adds a suffix (for example <b>SL-2P-LMN-M</b>). Send me one and I’ll find it, or search by SKU in the header.";

  /* products: SKU, name, colour, price or "recommend" */
  const rec = has(t, /\b(recommend|suggest|best|popular|bestsellers?|gift|favou?rite|what should|new in|trending)\b/);
  const hits = find(orig).filter(x => x.why != "price" || /under|below|less than|cheaper|<|\d/.test(orig));
  const cleaned = norm(orig.replace(/recommend\w*|suggest\w*|best ?sellers?|popular|trending|new in|gift|favou?rite|please|something|anything|for me|\?/gi, " "));
  const narrowed = cleaned ? find(cleaned) : [];
  if (rec && !narrowed.length) {
    const top = P.filter(p => p.b == "Bestseller" || p.b == "New").sort((a, b) => b.r - a.r).slice(0, 3);
    return `Here are our most-loved picks right now:${prods(top)}`;
  }
  if (rec && narrowed.length) return `Based on what you asked, I’d start with:${prods(narrowed.slice(0, 3).map(x => x.p))}`;
  if (hits.length && hits.length < P.length && (hits[0].why == "sku" || norm(orig).split(" ").length <= 6)) {
    const lead = hits[0].why == "sku" ? "That SKU matches" : hits.length == 1 ? "I found this" : "These might be what you’re after";
    return `${lead}:${prods(hits.slice(0, 3).map(x => x.p))}${hits.some(x => x.why == "sku") ? "" : ""}`;
  }
  const dm = didYouMean(orig);
  if (dm) return `I couldn’t find “${esc(orig)}”. Did you mean <b>${esc(dm)}</b>?${links([dm])}`;

  return `I’m not sure I understood that. I can help with shipping, returns, sizing, order tracking, product SKUs and recommendations, or connect you to a person.${links(CHIPS)}`;
};

/* UI */
const msgR = m_ => `<div class="cm ${m_.r}">${m_.h}</div>`;
const chatR = () => {
  const box = $("cl");
  box.innerHTML = CH.log.map(msgR).join("") + (CH.typing ? `<div class="cm bot typing" aria-label="Typing"><i></i><i></i><i></i></div>` : "");
  box.scrollTop = box.scrollHeight;
};
const say = (r, h) => { CH.log.push({ r, h }); saveChat(); chatR() };
const chatSend = text => {
  text = String(text).trim().slice(0, 300);
  if (!text) return;
  say("me", esc(text));
  CH.typing = true; chatR();
  setTimeout(() => { CH.typing = false; say("bot", reply(text)) }, 450);
};
const chatToggle = v => {
  CH.open = v == null ? !CH.open : v;
  $("cw").classList.toggle("on", CH.open);
  $("chb").setAttribute("aria-expanded", CH.open);
  $("chb").classList.toggle("open", CH.open);
  if (CH.open) {
    if (!CH.log.length) say("bot", `Hi${S.user ? " " + esc(S.user.n) : ""}! I’m the Saltline support assistant. Ask me about shipping, returns, sizing, a SKU or an order, or I can recommend something.${links(CHIPS)}`);
    else chatR();
    setTimeout(() => $("ci").focus(), 50);
  }
};

document.body.insertAdjacentHTML("beforeend", `<div id="ch">
<section id="cw" role="dialog" aria-label="Customer support chat">
 <div class="chh"><div><b>Saltline Support</b><small><i class="dot"></i>Online · replies instantly</small></div><button data-a="chatx" aria-label="Close chat">×</button></div>
 <div id="cl" role="log" aria-live="polite"></div>
 <form id="cf" autocomplete="off"><input id="ci" placeholder="Type a message or SKU" aria-label="Message" maxlength="300"><button class="cta" aria-label="Send">Send</button></form>
 <div class="cfn"><button data-a="chclr">Clear chat</button><span>Demo assistant · not a live agent</span></div>
</section>
<button id="chb" data-a="chat" aria-expanded="false" aria-label="Open customer support chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg><span>Chat</span></button>
</div>`);
$("cf").onsubmit = e => { e.preventDefault(); const i = $("ci"), v = i.value; i.value = ""; chatSend(v) };
Object.assign(A, {
  chat: () => chatToggle(),
  chatx: () => { chatToggle(false); $("chb").focus() },
  chq: v => chatSend(v),
  chclr: () => { CH.log = []; CH.wait = null; saveChat(); chatToggle(true); }
});
addEventListener("keydown", e => { if (e.key == "Escape" && CH.open && !$("ov").classList.contains("on")) chatToggle(false) });
