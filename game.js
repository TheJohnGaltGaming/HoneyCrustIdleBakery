(() => {
  "use strict";

  const SAVE_KEY = "cozyBakeryIdle_v1";
  const COST_GROWTH = 1.15;
  const PRESTIGE_DIVISOR = 250000;
  const STAR_BONUS = 0.5;
  const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
  const SAVE_INTERVAL_MS = 4000;
  const AD_DURATION_MS = 3000;
  const AD_COOLDOWN_MS = 2 * 60 * 1000;
  const BOOST_MS = 30 * 60 * 1000;
  const MILESTONES = [25, 50, 100, 200, 300, 400, 500, 750, 1000];

  const PRODUCERS = [
    { id: "helper", name: "Helper Baker", emoji: "👩‍🍳", baseCost: 15, baseProd: 0.1, desc: "A friendly baker lending a hand." },
    { id: "mixer", name: "Stand Mixer", emoji: "🥣", baseCost: 100, baseProd: 1, desc: "Whisks dough while you rest." },
    { id: "oven", name: "Brick Oven", emoji: "🔥", baseCost: 1100, baseProd: 8, desc: "A cozy oven that never sleeps." },
    { id: "stall", name: "Bakery Stall", emoji: "🏪", baseCost: 12000, baseProd: 47, desc: "Sells pastries in the square." },
    { id: "van", name: "Delivery Van", emoji: "🚚", baseCost: 130000, baseProd: 260, desc: "Fresh bread, door to door." },
    { id: "patisserie", name: "Patisserie", emoji: "🧁", baseCost: 1.4e6, baseProd: 1400, desc: "Fancy cakes for the whole town." },
    { id: "factory", name: "Cake Factory", emoji: "🏭", baseCost: 20e6, baseProd: 7800, desc: "Industrial-scale deliciousness." },
    { id: "empire", name: "Bakery Empire", emoji: "🏰", baseCost: 330e6, baseProd: 44000, desc: "A kingdom of crumbs and cream." }
  ];

  const SKIP_COSTS = { 1: 12, 4: 35, 24: 90 };

  const PASTRIES = ["🍞", "🥐", "🥖", "🧁", "🍪", "🍩", "🥧"];

  function defaultState() {
    return {
      coins: 0,
      gems: 8,
      runCoins: 0,
      lifetimeCoins: 0,
      recipeStars: 0,
      producers: Object.fromEntries(PRODUCERS.map((p) => [p.id, 0])),
      tapPower: 0,
      tapSync: 0,
      buyQty: 1,
      boostUntil: 0,
      doubleNextOffline: false,
      adCooldownUntil: { offline: 0, boost: 0 },
      awards: {},
      taps: 0,
      lastTick: Date.now(),
      lastSave: Date.now(),
      startedAt: Date.now(),
      seenTip: false
    };
  }

  let state = defaultState();
  let buyQty = 1;
  let uiDirty = true;
  let displayedCoins = 0;
  let lastUi = 0;
  let adBusy = false;
  let modalOpen = false;

  /* ---------------- numbers ---------------- */

  function formatSig(val) {
    if (val >= 100) return Math.round(val).toString();
    if (val >= 10) return val.toFixed(1).replace(/\.0$/, "");
    return val.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function alphaSuffix(tier) {
    const first = Math.floor(tier / 26);
    const second = tier % 26;
    return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
  }

  function formatNumber(n) {
    if (!isFinite(n)) return "∞";
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n < 1000) {
      if (n === 0) return "0";
      if (n < 10 && n % 1 !== 0) return sign + n.toFixed(1);
      if (n < 100 && n % 1 !== 0) return sign + n.toFixed(1);
      return sign + Math.floor(n).toString();
    }
    if (n < 1e15) {
      const tier = Math.min(4, Math.floor(Math.log10(n) / 3));
      const val = n / Math.pow(10, tier * 3);
      return sign + formatSig(val) + ["", "K", "M", "B", "T"][tier];
    }
    const exp = Math.floor(Math.log10(n));
    const tier = Math.floor((exp - 15) / 3);
    const val = n / Math.pow(10, 15 + tier * 3);
    return sign + formatSig(val) + alphaSuffix(tier);
  }

  function formatTime(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return h ? `${d}d ${h}h` : `${d}d`;
    if (h > 0) return m ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return sec && m < 5 ? `${m}m ${sec}s` : `${m}m`;
    return `${sec}s`;
  }

  /* ---------------- economy ---------------- */

  function milestoneMult(count) {
    let m = 1;
    for (const t of MILESTONES) {
      if (count >= t) m *= 2;
    }
    return m;
  }

  function nextMilestone(count) {
    return MILESTONES.find((t) => count < t) || null;
  }

  function prestigeMultiplier(stars = state.recipeStars) {
    return 1 + stars * STAR_BONUS;
  }

  function starsFromCoins(coins) {
    if (coins <= 0) return 0;
    return Math.floor(Math.sqrt(coins / PRESTIGE_DIVISOR));
  }

  function coinsForStars(n) {
    return n * n * PRESTIGE_DIVISOR;
  }

  function boostActive(now = Date.now()) {
    return now < state.boostUntil;
  }

  function currentCps(opts = {}) {
    const includeBoost = opts.includeBoost !== false;
    let cps = 0;
    for (const p of PRODUCERS) {
      const count = state.producers[p.id] || 0;
      cps += count * p.baseProd * milestoneMult(count);
    }
    cps *= prestigeMultiplier();
    if (includeBoost && boostActive()) cps *= 2;
    return cps;
  }

  function tapValue() {
    const cps = currentCps();
    const base = (1 + state.tapPower) * prestigeMultiplier();
    const sync = cps * (0.04 * state.tapSync);
    let v = base + sync;
    if (boostActive()) v *= 2;
    return v;
  }

  function geometricCost(base, owned, qty) {
    if (qty <= 0) return 0;
    const r = COST_GROWTH;
    return base * Math.pow(r, owned) * (Math.pow(r, qty) - 1) / (r - 1);
  }

  function maxAffordable(base, owned, coins) {
    if (coins < base * Math.pow(COST_GROWTH, owned)) return 0;
    const r = COST_GROWTH;
    const start = base * Math.pow(r, owned);
    const qty = Math.floor(Math.log((coins * (r - 1)) / start + 1) / Math.log(r));
    return Math.max(0, qty);
  }

  function producerQuote(id, qtyMode) {
    const p = PRODUCERS.find((x) => x.id === id);
    const owned = state.producers[id] || 0;
    let qty = qtyMode;
    if (qtyMode === "max") {
      qty = Math.max(1, maxAffordable(p.baseCost, owned, state.coins));
    }
    const cost = geometricCost(p.baseCost, owned, qty);
    return { qty, cost, canAfford: state.coins >= cost && qty > 0 };
  }

  function tapPowerCost(level = state.tapPower) {
    return Math.floor(20 * Math.pow(1.65, level));
  }

  function tapSyncCost(level = state.tapSync) {
    return Math.floor(200 * Math.pow(2.05, level));
  }

  /* ---------------- awards ---------------- */

  function grantGems(amount, reason, key) {
    if (key) {
      if (state.awards[key]) return;
      state.awards[key] = true;
    }
    state.gems += amount;
    toast(`+${amount} 💎  ${reason}`);
    uiDirty = true;
  }

  function checkAwards() {
    if (state.producers.helper >= 1) grantGems(3, "First helper hired!", "firstHelper");
    if (state.producers.mixer >= 1) grantGems(3, "A mixer of your own!", "firstMixer");
    if (state.producers.oven >= 1) grantGems(5, "The ovens are firing!", "firstOven");
    if (Object.values(state.producers).some((n) => n >= 25)) {
      grantGems(5, "First milestone reached!", "firstMilestone");
    }
    if (state.lifetimeCoins >= 1000) grantGems(2, "1,000 coins baked!", "life1k");
    if (state.lifetimeCoins >= 10000) grantGems(5, "10K lifetime coins!", "life10k");
    if (state.lifetimeCoins >= 100000) grantGems(8, "100K lifetime coins!", "life100k");
    if (state.lifetimeCoins >= 1e6) grantGems(15, "A million-coin bakery!", "life1m");
    if (state.taps >= 100) grantGems(2, "100 happy taps!", "taps100");
    if (state.taps >= 1000) grantGems(5, "1,000 taps of butter!", "taps1k");
  }

  function addCoins(amount) {
    if (amount <= 0) return;
    state.coins += amount;
    state.runCoins += amount;
    state.lifetimeCoins += amount;
    checkAwards();
    uiDirty = true;
  }

  /* ---------------- actions ---------------- */

  function doTap(clientX, clientY) {
    const value = tapValue();
    addCoins(value);
    state.taps += 1;
    checkAwards();
    spawnFloater(value, clientX, clientY);
    const oven = $("oven-btn");
    oven.classList.add("pressed");
    setTimeout(() => oven.classList.remove("pressed"), 90);
  }

  function buyProducer(id) {
    const quote = producerQuote(id, buyQty === "max" ? "max" : buyQty);
    if (!quote.canAfford) return false;
    state.coins -= quote.cost;
    state.producers[id] += quote.qty;
    checkAwards();
    uiDirty = true;
    save();
    return true;
  }

  function buyTapPower() {
    const cost = tapPowerCost();
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.tapPower += 1;
    uiDirty = true;
    save();
    return true;
  }

  function buyTapSync() {
    const cost = tapSyncCost();
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.tapSync += 1;
    uiDirty = true;
    save();
    return true;
  }

  function canPrestige() {
    return starsFromCoins(state.runCoins) > 0;
  }

  function doPrestige() {
    const gained = starsFromCoins(state.runCoins);
    if (gained <= 0) return;
    const first = state.recipeStars === 0;
    state.recipeStars += gained;
    state.coins = 0;
    state.runCoins = 0;
    state.producers = Object.fromEntries(PRODUCERS.map((p) => [p.id, 0]));
    state.tapPower = 0;
    state.tapSync = 0;
    state.boostUntil = 0;
    if (first) grantGems(15, "First Recipe Stars discovered!", "firstPrestige");
    uiDirty = true;
    displayedCoins = 0;
    save();
    toast(`You discovered ${gained} Recipe Star${gained === 1 ? "" : "s"}!`);
    renderAll();
  }

  function applyTimeSkip(hours) {
    const cost = SKIP_COSTS[hours];
    if (state.gems < cost) {
      toast("Not enough gems yet.");
      return;
    }
    const cps = currentCps({ includeBoost: false });
    if (cps <= 0) {
      toast("Hire a baker first — skips use your production.");
      return;
    }
    state.gems -= cost;
    const earned = cps * hours * 3600;
    addCoins(earned);
    toast(`Skipped ${hours}h and earned ${formatNumber(earned)} coins!`);
    save();
    renderAll();
  }

  function watchAd(kind) {
    if (adBusy) return;
    const now = Date.now();
    if (now < (state.adCooldownUntil[kind] || 0)) return;

    adBusy = true;
    const overlay = $("ad-overlay");
    const fill = $("ad-bar-fill");
    overlay.classList.remove("hidden");
    fill.style.width = "0%";
    const start = performance.now();

    function tickAd(t) {
      const p = Math.min(1, (t - start) / AD_DURATION_MS);
      fill.style.width = `${p * 100}%`;
      if (p < 1) {
        requestAnimationFrame(tickAd);
      } else {
        overlay.classList.add("hidden");
        adBusy = false;
        state.adCooldownUntil[kind] = Date.now() + AD_COOLDOWN_MS;
        if (kind === "boost") {
          const from = Math.max(Date.now(), state.boostUntil);
          state.boostUntil = from + BOOST_MS;
          toast("2× boost is baking for 30 minutes!");
        } else if (kind === "offline") {
          state.doubleNextOffline = true;
          toast("Your next offline earnings will be doubled!");
        } else if (kind === "doubleCollect") {
          /* handled by caller */
        }
        save();
        uiDirty = true;
        renderAll();
        if (kind === "doubleCollect" && watchAd._resolve) watchAd._resolve(true);
      }
    }

    if (kind === "doubleCollect") {
      return new Promise((resolve) => {
        watchAd._resolve = resolve;
        requestAnimationFrame(tickAd);
      });
    }
    requestAnimationFrame(tickAd);
  }

  /* ---------------- tick / offline / save ---------------- */

  function tick(dt) {
    const cps = currentCps();
    if (cps > 0 && dt > 0) addCoins(cps * dt);
    state.lastTick = Date.now();
  }

  function processOffline() {
    const now = Date.now();
    const elapsed = now - (state.lastTick || now);
    state.lastTick = now;
    if (elapsed < 10000) return null;
    const capped = Math.min(elapsed, OFFLINE_CAP_MS);
    const cps = currentCps({ includeBoost: false });
    if (cps <= 0) return null;
    let earned = cps * (capped / 1000);
    const doubled = !!state.doubleNextOffline;
    if (doubled) {
      earned *= 2;
      state.doubleNextOffline = false;
    }
    addCoins(earned);
    return { elapsed, capped, earned, doubled, cappedHit: elapsed > OFFLINE_CAP_MS };
  }

  function serialize() {
    return JSON.stringify({ ...state, buyQty, v: 1 });
  }

  function save() {
    try {
      state.lastSave = Date.now();
      localStorage.setItem(SAVE_KEY, serialize());
    } catch (err) {
      console.warn("Save failed", err);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const fresh = defaultState();
      state = { ...fresh, ...data };
      state.producers = { ...fresh.producers, ...(data.producers || {}) };
      state.adCooldownUntil = { ...fresh.adCooldownUntil, ...(data.adCooldownUntil || {}) };
      state.awards = { ...(data.awards || {}) };
      buyQty = data.buyQty === "max" || data.buyQty === 10 || data.buyQty === 25 ? data.buyQty : 1;
      displayedCoins = state.coins;
      return true;
    } catch (err) {
      console.warn("Load failed", err);
      state = defaultState();
      return false;
    }
  }

  function resetSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) { /* ignore */ }
    state = defaultState();
    buyQty = 1;
    displayedCoins = 0;
    uiDirty = true;
    renderAll();
    toast("Save reset. A fresh bakery awaits.");
  }

  /* ---------------- UI ---------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function toast(message) {
    const root = $("toast-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function spawnFloater(value, clientX, clientY) {
    const layer = $("float-layer");
    const rect = layer.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "floater";
    const pastry = PASTRIES[Math.floor(Math.random() * PASTRIES.length)];
    el.textContent = `+${formatNumber(value)} ${pastry}`;
    const dx = (Math.random() * 80 - 40).toFixed(0);
    el.style.setProperty("--dx", `${dx}px`);
    if (clientX && clientY) {
      el.style.left = `${clientX - rect.left}px`;
      el.style.top = `${clientY - rect.top}px`;
    } else {
      el.style.left = `${50 + Math.random() * 10 - 5}%`;
    }
    layer.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function closeModal() {
    $("modal-root").innerHTML = "";
    modalOpen = false;
  }

  function showModal(html) {
    modalOpen = true;
    $("modal-root").innerHTML = `<div class="modal-backdrop">${html}</div>`;
  }

  function showWelcomeBack(info) {
    const canDoubleAd = !info.doubled && Date.now() >= (state.adCooldownUntil.offline || 0);
    showModal(`
      <div class="modal" role="dialog" aria-labelledby="wb-title">
        <p class="tiny-tag">Welcome back</p>
        <h2 id="wb-title">The ovens stayed warm</h2>
        <p>You were away for ${formatTime(info.elapsed)}${info.cappedHit ? " (capped at 8 hours)" : ""}.</p>
        <div class="big">+${formatNumber(info.earned)} coins</div>
        ${info.doubled ? "<p>Your double-offline bonus was applied.</p>" : ""}
        <div class="modal-actions">
          ${canDoubleAd ? `<button type="button" class="primary-btn" id="wb-double">Watch ad: double it <span class="tiny-tag">Placeholder</span></button>` : ""}
          <button type="button" class="ghost-btn" id="wb-collect">Collect</button>
        </div>
      </div>
    `);
    const collect = () => closeModal();
    $("wb-collect").addEventListener("click", collect);
    const dbl = $("wb-double");
    if (dbl) {
      dbl.addEventListener("click", () => {
        if (adBusy) return;
        adBusy = true;
        const overlay = $("ad-overlay");
        const fill = $("ad-bar-fill");
        overlay.classList.remove("hidden");
        fill.style.width = "0%";
        const start = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - start) / AD_DURATION_MS);
          fill.style.width = `${p * 100}%`;
          if (p < 1) requestAnimationFrame(step);
          else {
            overlay.classList.add("hidden");
            adBusy = false;
            state.adCooldownUntil.offline = Date.now() + AD_COOLDOWN_MS;
            addCoins(info.earned);
            save();
            renderHeader();
            closeModal();
            toast(`Doubled! +${formatNumber(info.earned)} extra coins.`);
          }
        };
        requestAnimationFrame(step);
      });
    }
  }

  function showSettings() {
    showModal(`
      <div class="modal" role="dialog" aria-labelledby="set-title">
        <h2 id="set-title">Bakery settings</h2>
        <p>Progress is saved automatically on this device.</p>
        <div class="settings-list">
          <button type="button" class="danger-btn" id="reset-save-btn">Reset save</button>
          <button type="button" class="ghost-btn" id="close-settings">Close</button>
        </div>
        <p class="fine-print">Resetting erases coins, producers, stars, and gems on this device.</p>
      </div>
    `);
    $("close-settings").addEventListener("click", closeModal);
    $("reset-save-btn").addEventListener("click", () => {
      showModal(`
        <div class="modal" role="dialog" aria-labelledby="rst-title">
          <h2 id="rst-title">Reset this bakery?</h2>
          <p>This cannot be undone. All progress on this device will be lost.</p>
          <div class="modal-actions">
            <button type="button" class="danger-btn" id="confirm-reset">Yes, start over</button>
            <button type="button" class="ghost-btn" id="cancel-reset">Cancel</button>
          </div>
        </div>
      `);
      $("cancel-reset").addEventListener("click", closeModal);
      $("confirm-reset").addEventListener("click", () => {
        closeModal();
        resetSave();
      });
    });
  }

  function showFirstTip() {
    if (state.seenTip) return;
    state.seenTip = true;
    showModal(`
      <div class="modal" role="dialog" aria-labelledby="tip-title">
        <h2 id="tip-title">Welcome to Honeycrust</h2>
        <p>Tap the oven to bake coins. Hire helpers so the bakery keeps running even while you're away. Ads are optional bonuses — never forced.</p>
        <div class="modal-actions">
          <button type="button" class="primary-btn" id="tip-ok">Let's bake</button>
        </div>
      </div>
    `);
    $("tip-ok").addEventListener("click", () => {
      closeModal();
      save();
    });
  }

  function setTab(name) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === name);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("active", p.id === `panel-${name}`);
    });
    uiDirty = true;
    renderAll();
  }

  function renderHeader() {
    const target = state.coins;
    const delta = target - displayedCoins;
    displayedCoins = Math.abs(delta) < 0.5 ? target : displayedCoins + delta * 0.35;
    $("coin-count").textContent = formatNumber(displayedCoins);
    $("gem-count").textContent = formatNumber(state.gems);
    const cps = currentCps();
    $("cps-display").textContent = `${formatNumber(cps)}/s`;
    const boost = $("boost-chip");
    if (boostActive()) {
      boost.classList.remove("hidden");
      boost.textContent = `2× ${formatTime(state.boostUntil - Date.now())}`;
    } else {
      boost.classList.add("hidden");
    }
    const chip = $("prestige-chip");
    if (state.recipeStars > 0) {
      chip.classList.remove("hidden");
      chip.textContent = `★ ${prestigeMultiplier().toFixed(2)}×`;
    } else {
      chip.classList.add("hidden");
    }
  }

  function renderProducers() {
    const list = $("producer-list");
    const html = PRODUCERS.map((p, index) => {
      const owned = state.producers[p.id] || 0;
      const prevOwned = index === 0 ? Infinity : (state.producers[PRODUCERS[index - 1].id] || 0);
      const unlocked = index === 0 || owned > 0 || prevOwned > 0 || state.coins >= p.baseCost * 0.5;
      const quote = producerQuote(p.id, buyQty === "max" ? "max" : buyQty);
      const each = p.baseProd * milestoneMult(owned) * prestigeMultiplier() * (boostActive() ? 2 : 1);
      const total = each * owned;
      const next = nextMilestone(owned);
      const prev = [...MILESTONES].reverse().find((t) => owned >= t) || 0;
      const span = next ? next - prev : 1;
      const progress = next ? ((owned - prev) / span) * 100 : 100;
      const nextLabel = next ? `${owned}/${next} for ×${milestoneMult(owned) * 2}` : `${owned} · max listed bonus`;
      return `
        <article class="producer ${unlocked ? "" : "locked"}" data-id="${p.id}">
          <div class="producer-icon">${p.emoji}</div>
          <div class="producer-info">
            <h3>${p.name} <span class="meta">×${owned}</span></h3>
            <p class="meta">${unlocked ? `${formatNumber(each)}/s each · ${formatNumber(total)}/s total` : p.desc}</p>
            <div class="milestone" aria-hidden="true"><div class="milestone-fill" style="width:${progress}%"></div></div>
            <p class="milestone-label">${nextLabel}</p>
          </div>
          <button type="button" class="buy-btn" data-testid="buy-${p.id}" data-buy="${p.id}" ${(!unlocked || !quote.canAfford) ? "disabled" : ""}>
            <span>Buy ${quote.qty}</span>
            <span class="buy-cost">${formatNumber(quote.cost)} 🪙</span>
          </button>
        </article>
      `;
    }).join("");
    list.innerHTML = html;
  }

  function renderUpgrades() {
    const powerCost = tapPowerCost();
    const syncCost = tapSyncCost();
    const syncPct = state.tapSync * 4;
    $("upgrade-list").innerHTML = `
      <article class="upgrade-card">
        <div class="upgrade-icon">🥖</div>
        <div class="upgrade-info">
          <h3>Rolling Pin</h3>
          <p class="meta">+1 base coins per tap · Level ${state.tapPower}</p>
          <p class="meta">Tap now: ${formatNumber(tapValue())} coins</p>
        </div>
        <button type="button" class="buy-btn" id="buy-tap-power" ${state.coins < powerCost ? "disabled" : ""}>
          <span>Upgrade</span>
          <span class="buy-cost">${formatNumber(powerCost)} 🪙</span>
        </button>
      </article>
      <article class="upgrade-card">
        <div class="upgrade-icon">🎵</div>
        <div class="upgrade-info">
          <h3>Baker's Rhythm</h3>
          <p class="meta">Each tap also earns ${syncPct}% of your coins/sec · Level ${state.tapSync}</p>
          <p class="meta">Scales automatically as the bakery grows.</p>
        </div>
        <button type="button" class="buy-btn" id="buy-tap-sync" ${state.coins < syncCost ? "disabled" : ""}>
          <span>Upgrade</span>
          <span class="buy-cost">${formatNumber(syncCost)} 🪙</span>
        </button>
      </article>
    `;
    $("buy-tap-power").addEventListener("click", () => {
      if (buyTapPower()) renderAll();
    });
    $("buy-tap-sync").addEventListener("click", () => {
      if (buyTapSync()) renderAll();
    });
  }

  function renderPrestige() {
    const gained = starsFromCoins(state.runCoins);
    const nextStars = gained + 1;
    const need = coinsForStars(nextStars);
    const remain = Math.max(0, need - state.runCoins);
    $("stars-owned").textContent = formatNumber(state.recipeStars);
    $("stars-mult").textContent = `${prestigeMultiplier().toFixed(2)}×`;
    $("stars-run-coins").textContent = formatNumber(state.runCoins);
    const btn = $("prestige-btn");
    if (gained > 0) {
      const nextMult = prestigeMultiplier(state.recipeStars + gained);
      $("stars-preview").textContent =
        `Reset now to gain ${gained} Recipe Star${gained === 1 ? "" : "s"} and raise your permanent bonus to ${nextMult.toFixed(2)}×.`;
      btn.disabled = false;
      btn.textContent = `Discover ${gained} Recipe Star${gained === 1 ? "" : "s"}`;
    } else {
      $("stars-preview").textContent =
        `Bake ${formatNumber(remain)} more coins this run to earn your first ${need === coinsForStars(1) && state.recipeStars === 0 ? "" : "next "}Recipe Star. Need ${formatNumber(need)} this run.`;
      btn.disabled = true;
      btn.textContent = "Discover Recipe Stars";
    }
  }

  function renderShop() {
    const now = Date.now();
    const offlineBtn = $("ad-offline-btn");
    const boostBtn = $("ad-boost-btn");
    const offCd = (state.adCooldownUntil.offline || 0) - now;
    const boostCd = (state.adCooldownUntil.boost || 0) - now;
    if (state.doubleNextOffline) {
      offlineBtn.disabled = true;
      offlineBtn.textContent = "Ready for next return";
    } else if (offCd > 0) {
      offlineBtn.disabled = true;
      offlineBtn.textContent = `Ready in ${formatTime(offCd)}`;
    } else {
      offlineBtn.disabled = false;
      offlineBtn.textContent = "Watch ad";
    }
    if (boostCd > 0) {
      boostBtn.disabled = true;
      boostBtn.textContent = `Ready in ${formatTime(boostCd)}`;
    } else {
      boostBtn.disabled = false;
      boostBtn.textContent = "Watch ad";
    }
    document.querySelectorAll(".skip-btn").forEach((btn) => {
      const cost = Number(btn.dataset.cost);
      btn.disabled = state.gems < cost;
      btn.textContent = `${cost} 💎`;
    });
  }

  function renderAll() {
    renderHeader();
    const active = document.querySelector(".panel.active");
    if (active && active.id === "panel-bake") renderProducers();
    if (active && active.id === "panel-upgrades") renderUpgrades();
    if (active && active.id === "panel-stars") renderPrestige();
    if (active && active.id === "panel-shop") renderShop();
    document.querySelectorAll(".buy-toggle button").forEach((b) => {
      const q = b.dataset.qty === "max" ? "max" : Number(b.dataset.qty);
      b.classList.toggle("active", q === buyQty);
    });
    uiDirty = false;
  }

  function confirmPrestige() {
    const gained = starsFromCoins(state.runCoins);
    if (gained <= 0) return;
    const nextMult = prestigeMultiplier(state.recipeStars + gained);
    showModal(`
      <div class="modal" role="dialog" aria-labelledby="pr-title">
        <h2 id="pr-title">Discover new recipes?</h2>
        <p>Your bakery will reset. You will keep gems and gain Recipe Stars.</p>
        <div class="big">+${gained} ★ → ${nextMult.toFixed(2)}×</div>
        <div class="modal-actions">
          <button type="button" class="primary-btn" id="confirm-prestige">Reset &amp; ascend</button>
          <button type="button" class="ghost-btn" id="cancel-prestige">Keep baking</button>
        </div>
      </div>
    `);
    $("cancel-prestige").addEventListener("click", closeModal);
    $("confirm-prestige").addEventListener("click", () => {
      closeModal();
      doPrestige();
    });
  }

  /* ---------------- events / loop ---------------- */

  function bind() {
    const oven = $("oven-btn");
    const pointerTap = (ev) => {
      ev.preventDefault();
      const pt = ev.changedTouches ? ev.changedTouches[0] : ev;
      doTap(pt.clientX, pt.clientY);
    };
    oven.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      doTap(ev.clientX, ev.clientY);
    });

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => setTab(tab.dataset.tab));
    });

    document.querySelectorAll(".buy-toggle button").forEach((b) => {
      b.addEventListener("click", () => {
        buyQty = b.dataset.qty === "max" ? "max" : Number(b.dataset.qty);
        renderAll();
      });
    });

    $("producer-list").addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-buy]");
      if (!btn) return;
      if (buyProducer(btn.dataset.buy)) renderAll();
    });

    $("prestige-btn").addEventListener("click", confirmPrestige);
    $("settings-btn").addEventListener("click", showSettings);
    $("ad-offline-btn").addEventListener("click", () => watchAd("offline"));
    $("ad-boost-btn").addEventListener("click", () => watchAd("boost"));

    document.getElementById("panel-shop").addEventListener("click", (ev) => {
      const btn = ev.target.closest(".skip-btn");
      if (!btn) return;
      applyTimeSkip(Number(btn.dataset.hours));
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        save();
      } else {
        const info = processOffline();
        if (info) showWelcomeBack(info);
        renderAll();
      }
    });

    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && modalOpen) closeModal();
    });
  }

  let lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.25, (ts - lastTs) / 1000);
    lastTs = ts;
    if (!document.hidden) tick(dt);
    if (ts - lastUi > 100) {
      renderHeader();
      const active = document.querySelector(".panel.active");
      if (active && active.id === "panel-shop") renderShop();
      if (active && active.id === "panel-stars") renderPrestige();
      if (active && (active.id === "panel-bake" || active.id === "panel-upgrades") && uiDirty) {
        if (active.id === "panel-bake") renderProducers();
        if (active.id === "panel-upgrades") renderUpgrades();
        uiDirty = false;
      } else if (active && active.id === "panel-bake" && ts - lastUi > 400) {
        renderProducers();
      }
      lastUi = ts;
    }
    requestAnimationFrame(loop);
  }

  function init() {
    const loaded = load();
    bind();
    const info = processOffline();
    renderAll();
    if (info) showWelcomeBack(info);
    else if (!loaded) showFirstTip();
    setInterval(save, SAVE_INTERVAL_MS);
    requestAnimationFrame(loop);

    window.BakeryIdle = {
      getState: () => ({ ...state, producers: { ...state.producers }, cps: currentCps(), tapValue: tapValue() }),
      formatNumber,
      starsFromCoins,
      save,
      load
    };
  }

  init();
})();
