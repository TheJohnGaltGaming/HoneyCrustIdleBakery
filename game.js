(() => {
  "use strict";

  const SAVE_KEY = "cozyBakeryIdle_v3";
  const OLD_SAVE_KEYS = ["cozyBakeryIdle_v2", "cozyBakeryIdle_v1"];
  const SAVE_VERSION = 3;
  const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
  const SAVE_INTERVAL_MS = 4000;
  const AD_DURATION_MS = 3000;
  const AD_COOLDOWN_MS = 2 * 60 * 1000;
  const BOOST_MS = 30 * 60 * 1000;
  const SKIP_COSTS = { 1: 12, 4: 35, 24: 90 };
  const OVEN_SLOT_COSTS = [0, 400, 3500, 20000, 120000, 800000, 5e6];
  const DOOR = { x: 18, y: 20 };
  const COUNTER_Y = 54;
  const WORK_Y = 72;

  const GOODS = [
    { id: "bread", name: "Bread", emoji: "🍞", price: 6, bakeTime: 3.2, unlock: 0, loc: 0 },
    { id: "croissant", name: "Croissant", emoji: "🥐", price: 18, bakeTime: 4.0, unlock: 50, loc: 0 },
    { id: "muffin", name: "Muffin", emoji: "🧁", price: 48, bakeTime: 5.0, unlock: 250, loc: 0 },
    { id: "cupcake", name: "Cupcake", emoji: "🍰", price: 140, bakeTime: 6.5, unlock: 1000, loc: 0 },
    { id: "pie", name: "Pie", emoji: "🥧", price: 340, bakeTime: 8.0, unlock: 9000, loc: 1 },
    { id: "cake", name: "Cake", emoji: "🎂", price: 980, bakeTime: 10.0, unlock: 42000, loc: 1 },
    { id: "macaron", name: "Macaron", emoji: "🍪", price: 2800, bakeTime: 9.0, unlock: 2e5, loc: 2 },
    { id: "tart", name: "Fruit Tart", emoji: "🍮", price: 8200, bakeTime: 11.0, unlock: 1.1e6, loc: 2 },
    { id: "donut", name: "Artisan Donut", emoji: "🍩", price: 24000, bakeTime: 8.5, unlock: 6e6, loc: 3 },
    { id: "souffle", name: "Souffle", emoji: "✨", price: 78000, bakeTime: 12.0, unlock: 4e7, loc: 3 },
    { id: "opera", name: "Opera Cake", emoji: "🍫", price: 2.6e5, bakeTime: 13.0, unlock: 3e8, loc: 4 },
    { id: "cloud", name: "Cloud Meringue", emoji: "☁️", price: 9.5e5, bakeTime: 14.0, unlock: 2.5e9, loc: 5 }
  ];

  const LOCATIONS = [
    { id: "corner", name: "Cozy Corner Shop", emoji: "🏠", maxOvens: 2, maxQueue: 3, multiplier: 1, cost: 0, startGoods: 1 },
    { id: "town", name: "Town Bakery", emoji: "🏪", maxOvens: 3, maxQueue: 4, multiplier: 2, cost: 50000, startGoods: 2 },
    { id: "city", name: "City Patisserie", emoji: "🏙️", maxOvens: 4, maxQueue: 5, multiplier: 4, cost: 2.5e6, startGoods: 3 },
    { id: "harbor", name: "Harbor Bakehouse", emoji: "⚓", maxOvens: 5, maxQueue: 6, multiplier: 8, cost: 1.2e8, startGoods: 4 },
    { id: "capital", name: "Capital Grand Bakery", emoji: "🏰", maxOvens: 6, maxQueue: 7, multiplier: 20, cost: 8e9, startGoods: 5 },
    { id: "atelier", name: "Skyline Atelier", emoji: "🌙", maxOvens: 7, maxQueue: 8, multiplier: 50, cost: 6e11, startGoods: 6 }
  ];

  const DECOR_CATS = [
    { id: "wallpaper", name: "Wallpaper", emoji: "🖼️", stat: "tips" },
    { id: "floor", name: "Floor", emoji: "🪵", stat: "tips" },
    { id: "counter", name: "Counter", emoji: "🪑", stat: "tips" },
    { id: "tables", name: "Tables", emoji: "🪑", stat: "tips" },
    { id: "sign", name: "Sign", emoji: "🪧", stat: "spawn" },
    { id: "plants", name: "Plants", emoji: "🪴", stat: "spawn" },
    { id: "lights", name: "Lights", emoji: "💡", stat: "spawn" }
  ];


  const DECOR = {
    wallpaper: [
      { id: "wp_cream", name: "Cream Walls", cost: 0, bonus: 0, look: "wp-cream", starter: true },
      { id: "wp_peach", name: "Peach Stripe", cost: 150, bonus: 0.05, look: "wp-peach" },
      { id: "wp_mint", name: "Mint Tile", cost: 900, bonus: 0.10, look: "wp-mint" },
      { id: "wp_sky", name: "Sky Blue", cost: 5000, bonus: 0.16, look: "wp-sky" },
      { id: "wp_rose", name: "Rose Garden", cost: 25000, bonus: 0.24, look: "wp-rose" },
      { id: "wp_gingham", name: "Picnic Gingham", cost: 0, bonus: 0, look: "wp-gingham", achievement: "served25" }
    ],
    floor: [
      { id: "fl_pine", name: "Pine Boards", cost: 0, bonus: 0, look: "fl-pine", starter: true },
      { id: "fl_cherry", name: "Cherry Wood", cost: 180, bonus: 0.05, look: "fl-cherry" },
      { id: "fl_tile", name: "Clay Tile", cost: 1100, bonus: 0.10, look: "fl-tile" },
      { id: "fl_checker", name: "Cafe Check", cost: 6000, bonus: 0.16, look: "fl-checker" },
      { id: "fl_marble", name: "Soft Marble", cost: 28000, bonus: 0.24, look: "fl-marble" },
      { id: "fl_prize", name: "Honey Checkers", cost: 0, bonus: 0, look: "fl-checkered-prize", achievement: "twoOvens" }
    ],
    counter: [
      { id: "ct_oak", name: "Oak Counter", cost: 0, bonus: 0, look: "ct-oak", starter: true },
      { id: "ct_white", name: "Ivory Counter", cost: 200, bonus: 0.05, look: "ct-white" },
      { id: "ct_pink", name: "Rosewood Pink", cost: 1300, bonus: 0.10, look: "ct-pink" },
      { id: "ct_mintc", name: "Mint Shopfront", cost: 7000, bonus: 0.16, look: "ct-mintc" },
      { id: "ct_walnut", name: "Walnut Bar", cost: 30000, bonus: 0.24, look: "ct-walnut" },
      { id: "ct_marblec", name: "Marble Counter", cost: 0, bonus: 0, look: "ct-marblec", achievement: "coins10k" }
    ],
    tables: [
      { id: "tb_pine", name: "Pine Tables", cost: 0, bonus: 0, look: "tb-pine", starter: true },
      { id: "tb_white", name: "Ivory Tables", cost: 220, bonus: 0.04, look: "tb-white" },
      { id: "tb_mint", name: "Mint Cafe", cost: 1400, bonus: 0.08, look: "tb-mint" },
      { id: "tb_rose", name: "Rose Bistro", cost: 8000, bonus: 0.14, look: "tb-rose" },
      { id: "tb_bistro", name: "Night Bistro", cost: 26000, bonus: 0.20, look: "tb-bistro" }
    ],
    sign: [
      { id: "sg_wood", name: "Painted Wood", cost: 0, bonus: 0, look: "sg-wood", starter: true },
      { id: "sg_cream", name: "Cream Board", cost: 120, bonus: 0.05, look: "sg-cream" },
      { id: "sg_mint", name: "Mint Hanging", cost: 800, bonus: 0.10, look: "sg-mint" },
      { id: "sg_night", name: "Night Board", cost: 4500, bonus: 0.16, look: "sg-night" },
      { id: "sg_berry", name: "Berry Sign", cost: 22000, bonus: 0.24, look: "sg-berry" },
      { id: "sg_gold", name: "Golden Bell", cost: 0, bonus: 0, look: "sg-gold", achievement: "firstStaff" }
    ],
    plants: [
      { id: "pl_succulent", name: "Tiny Succulent", cost: 0, bonus: 0, look: "pl-succulent", starter: true },
      { id: "pl_fern", name: "Shop Fern", cost: 140, bonus: 0.06, look: "pl-fern" },
      { id: "pl_flowers", name: "Flower Pots", cost: 850, bonus: 0.12, look: "pl-flowers" },
      { id: "pl_ivy", name: "Window Ivy", cost: 4800, bonus: 0.18, look: "pl-ivy" },
      { id: "pl_sunflower", name: "Sunflower", cost: 0, bonus: 0, look: "pl-sunflower", achievement: "firstSale" }
    ],
    lights: [
      { id: "lt_warm", name: "Warm Bulbs", cost: 0, bonus: 0, look: "lt-warm", starter: true },
      { id: "lt_string", name: "Party String", cost: 160, bonus: 0.06, look: "lt-string" },
      { id: "lt_pendant", name: "Pendants", cost: 950, bonus: 0.12, look: "lt-pendant" },
      { id: "lt_lantern", name: "Paper Lanterns", cost: 5200, bonus: 0.18, look: "lt-lantern" },
      { id: "lt_starry", name: "Starry Lights", cost: 0, bonus: 0, look: "lt-starry", achievement: "firstMove" }
    ]
  };

  const OUTFITS = [
    { id: "of_pink", name: "Pink Apron", cost: 0, speed: 0, tips: 0, look: "outfit-pink", starter: true },
    { id: "of_mint", name: "Mint Apron", cost: 180, speed: 0.10, tips: 0.03, look: "outfit-mint" },
    { id: "of_chef", name: "Chef Jacket", cost: 900, speed: 0.18, tips: 0.06, look: "outfit-chef" },
    { id: "of_berry", name: "Berry Apron", cost: 4500, speed: 0.28, tips: 0.10, look: "outfit-berry" },
    { id: "of_night", name: "Night Baker", cost: 20000, speed: 0.40, tips: 0.14, look: "outfit-night" },
    { id: "of_gold", name: "Golden Apron", cost: 0, speed: 0, tips: 0, look: "outfit-gold", achievement: "served100" }
  ];

  const PLANT_HTML = {
    "pl-none": "",
    "pl-succulent": '<div class="plant-pot"></div><div class="sprout"></div>',
    "pl-fern": '<div class="plant-pot"></div><div class="frond" style="left:4px;transform:rotate(-25deg)"></div><div class="frond" style="left:12px;transform:rotate(20deg)"></div>',
    "pl-flowers": '<div class="plant-pot"></div><div class="bloom"></div>',
    "pl-ivy": '<div class="plant-pot"></div><div class="vine"></div>',
    "pl-sunflower": '<div class="plant-pot"></div><div class="stem"></div><div class="sunf"></div>'
  };

  const CUSTOMER_TYPES = [
    { hair: "#3b241f", body: "#7eb0d8", legs: "#3a3550" },
    { hair: "#c45c26", body: "#f3b8c5", legs: "#6b3f4a" },
    { hair: "#f4c95d", body: "#a8d5c2", legs: "#3d5c4a" },
    { hair: "#6b3f2a", body: "#e09f3e", legs: "#5a3a18" },
    { hair: "#2a2a2a", body: "#9b8fd8", legs: "#3a3550" },
    { hair: "#efe6d2", body: "#d4537e", legs: "#5a2038", skin: "#e8b898" },
    { hair: "#8b4a24", body: "#7ec9a8", legs: "#2f4a3c" },
    { hair: "#4a2c2a", body: "#f6c9b3", legs: "#6a4450" }
  ];

  const ACHIEVEMENTS = [
    { id: "firstSale", name: "First Sale", desc: "Complete your first order.", unlocks: "Sunflower plant" },
    { id: "served25", name: "Neighborhood Favorite", desc: "Serve 25 happy customers.", unlocks: "Picnic Gingham wallpaper" },
    { id: "firstStaff", name: "Helping Hands", desc: "Hire your first staff member.", unlocks: "Golden Bell sign" },
    { id: "twoOvens", name: "Hot Kitchen", desc: "Install a second oven.", unlocks: "Honey Checkers floor" },
    { id: "coins10k", name: "Sweet Savings", desc: "Earn 10,000 lifetime coins.", unlocks: "Marble Counter" },
    { id: "firstMove", name: "Bigger Dreams", desc: "Move to a new location.", unlocks: "Starry Lights" },
    { id: "served100", name: "Head Baker", desc: "Serve 100 happy customers.", unlocks: "Golden Apron" }
  ];


  function starterDecorOwned() {
    const owned = {};
    for (const cat of DECOR_CATS) {
      owned[cat.id] = DECOR[cat.id].filter((i) => i.starter).map((i) => i.id);
    }
    return owned;
  }
  function starterDecorEquipped() {
    const eq = {};
    for (const cat of DECOR_CATS) {
      eq[cat.id] = DECOR[cat.id].find((i) => i.starter).id;
    }
    return eq;
  }
  function starterOutfits() {
    return OUTFITS.filter((o) => o.starter).map((o) => o.id);
  }

  function defaultState() {
    return {
      v: SAVE_VERSION,
      coins: 0,
      gems: 8,
      runCoins: 0,
      lifetimeCoins: 0,
      locationIndex: 0,
      ovens: 1,
      ovenSpeedLevel: 0,
      qualityLevel: 0,
      aromaLevel: 0,
      staff: { cashier: 0, cook: 0, server: 0 },
      unlockedGoods: ["bread"],
      decorOwned: starterDecorOwned(),
      decorEquipped: starterDecorEquipped(),
      outfitsOwned: starterOutfits(),
      outfitEquipped: "of_pink",
      achievements: {},
      served: 0,
      boostUntil: 0,
      doubleNextOffline: false,
      adCooldownUntil: { offline: 0, boost: 0 },
      awards: {},
      lastTick: Date.now(),
      lastSave: Date.now(),
      startedAt: Date.now(),
      seenTip: false
    };
  }

  let state = defaultState();
  let customers = [];
  let ovens = [{ job: null }];
  let pendingOrders = [];
  let nextCustomerId = 1;
  let spawnTimer = 0.4;
  let staffAcc = { cashier: 0, cook: 0, server: 0 };
  let uiDirty = true;
  let displayedCoins = 0;
  let lastUi = 0;
  let adBusy = false;
  let modalOpen = false;
  let sheetOpen = false;
  let currentSheet = null;
  let currentScreen = "shop";
  let hadOldSave = false;
  let oldSaveVersion = 0;
  let migratedFromV2 = false;
  let frozen = false;

  function makeWalker(x, y) {
    return {
      x: x, y: y,
      walking: false,
      walkFrom: { x: x, y: y },
      walkTo: { x: x, y: y },
      walkT: 0,
      walkDur: 0,
      face: "down",
      task: null,
      arriveWait: 0,
      present: false
    };
  }

  let player = makeWalker(52, 91);
  player.present = true;
  const staffActors = {
    cashier: makeWalker(24, 80),
    cook: makeWalker(34, 84),
    server: makeWalker(66, 70)
  };
  const STAFF_HOME = {
    cashier: { x: 24, y: 80 },
    cook: { x: 34, y: 84 },
    server: { x: 66, y: 70 }
  };

  function formatSig(val) {
    if (val >= 100) return Math.round(val).toString();
    if (val >= 10) return val.toFixed(1).replace(/\.0$/, "");
    return val.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }
  function alphaSuffix(tier) {
    return String.fromCharCode(97 + Math.floor(tier / 26)) + String.fromCharCode(97 + (tier % 26));
  }
  function formatNumber(n) {
    if (!isFinite(n)) return "Infinity";
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n < 1000) {
      if (n === 0) return "0";
      if (n < 100 && n % 1 !== 0) return sign + n.toFixed(1);
      return sign + Math.floor(n).toString();
    }
    if (n < 1e15) {
      const tier = Math.min(4, Math.floor(Math.log10(n) / 3));
      return sign + formatSig(n / Math.pow(10, tier * 3)) + ["", "K", "M", "B", "T"][tier];
    }
    const exp = Math.floor(Math.log10(n));
    const tier = Math.floor((exp - 15) / 3);
    return sign + formatSig(n / Math.pow(10, 15 + tier * 3)) + alphaSuffix(tier);
  }
  function formatTime(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return h ? d + "d " + h + "h" : d + "d";
    if (h > 0) return m ? h + "h " + m + "m" : h + "h";
    if (m > 0) return sec && m < 5 ? m + "m " + sec + "s" : m + "m";
    return sec + "s";
  }

  function $(id) { return document.getElementById(id); }
  function currentLocation() { return LOCATIONS[state.locationIndex]; }
  function nextLocation() { return LOCATIONS[state.locationIndex + 1] || null; }
  function goodById(id) { return GOODS.find((g) => g.id === id); }
  function decorItem(cat, id) { return (DECOR[cat] || []).find((i) => i.id === id); }
  function outfitById(id) { return OUTFITS.find((o) => o.id === id); }
  function boostActive(now) { return (now || Date.now()) < state.boostUntil; }
  function locationMultiplier() { return currentLocation().multiplier; }
  function qualityMult() { return 1 + state.qualityLevel * 0.08; }
  function ovenSpeedMult() { return 1 + state.ovenSpeedLevel * 0.18; }
  function bakeDuration(goodId) { return goodById(goodId).bakeTime / ovenSpeedMult(); }

  function bestOutfitStats() {
    let speed = 0, tips = 0;
    for (const id of state.outfitsOwned || []) {
      const o = outfitById(id);
      if (!o) continue;
      if (o.speed > speed) speed = o.speed;
      if (o.tips > tips) tips = o.tips;
    }
    return { speed, tips };
  }
  function playerSpeedMult() { return 1 + bestOutfitStats().speed; }
  function playerWorkTime() { return 0.12 / playerSpeedMult(); }
  function playerWalkSpeed() { return 58 * playerSpeedMult(); }
  function staffWalkSpeed() { return 32; }

  function decorBonus(stat) {
    let sum = 0;
    for (const cat of DECOR_CATS) {
      if (cat.stat !== stat) continue;
      let best = 0;
      for (const id of state.decorOwned[cat.id] || []) {
        const item = decorItem(cat.id, id);
        if (item && item.bonus > best) best = item.bonus;
      }
      sum += best;
    }
    return sum;
  }
  function tipChance() {
    return Math.min(0.75, 0.12 + decorBonus("tips") * 0.85 + bestOutfitStats().tips);
  }
  function tipAmount() { return 0.25 + decorBonus("tips") * 0.5; }
  function spawnInterval() {
    const mult = (1 + state.aromaLevel * 0.12) * (1 + decorBonus("spawn"));
    return Math.max(1.6, 4.8 / mult);
  }
  function staffInterval(role, base) {
    const level = state.staff[role] || 0;
    if (level <= 0) return Infinity;
    return Math.max(0.4, base * Math.pow(0.85, level - 1));
  }
  function cashierInterval() { return staffInterval("cashier", 2.4); }
  function cookInterval() { return staffInterval("cook", 1.5); }
  function serverInterval() { return staffInterval("server", 1.3); }

  function unlockedGoodsList() { return GOODS.filter((g) => state.unlockedGoods.includes(g.id)); }
  function pickGood() {
    const list = unlockedGoodsList();
    if (!list.length) return GOODS[0];
    const weights = list.map((g, i) => (list.length === 1 ? 1 : i === 0 ? 0.7 : i === list.length - 1 ? 1.15 : 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }
  function expectedPay() {
    const list = unlockedGoodsList();
    if (!list.length) return 0;
    const avg = list.reduce((s, g) => s + g.price, 0) / list.length;
    return avg * locationMultiplier() * qualityMult() * (1 + tipChance() * tipAmount());
  }
  function expectedBakeTime() {
    const list = unlockedGoodsList();
    if (!list.length) return 3.2;
    return list.reduce((s, g) => s + bakeDuration(g.id), 0) / list.length;
  }
  function automatedCps(opts) {
    opts = opts || {};
    const includeBoost = opts.includeBoost !== false;
    if (!state.staff.cashier || !state.staff.cook || !state.staff.server) return 0;
    const spawn = 1 / spawnInterval();
    const take = 1 / cashierInterval();
    const bake = state.ovens / Math.max(0.4, expectedBakeTime() / ((includeBoost && boostActive()) ? 2 : 1));
    const deliver = 1 / serverInterval();
    let pay = expectedPay();
    if (includeBoost && boostActive()) pay *= 2;
    return Math.min(spawn, take, bake, deliver) * pay;
  }
  function computePay(goodId) {
    const g = goodById(goodId);
    let pay = g.price * locationMultiplier() * qualityMult();
    let tipped = false;
    if (Math.random() < tipChance()) {
      pay *= 1 + tipAmount();
      tipped = true;
    }
    if (boostActive()) pay *= 2;
    return { amount: pay, tipped };
  }

  function ovenSpeedCost(level) { if (level == null) level = state.ovenSpeedLevel; return Math.floor(40 * Math.pow(1.75, level)); }
  function qualityCost(level) { if (level == null) level = state.qualityLevel; return Math.floor(100 * Math.pow(2.0, level)); }
  function aromaCost(level) { if (level == null) level = state.aromaLevel; return Math.floor(70 * Math.pow(1.8, level)); }
  function ovenSlotCost() { return OVEN_SLOT_COSTS[state.ovens] || null; }
  function staffHireCost(role) {
    const bases = { cashier: 800, cook: 2200, server: 5000 };
    const level = state.staff[role] || 0;
    if (level === 0) return bases[role];
    return Math.floor(bases[role] * 0.7 * Math.pow(1.85, level));
  }
  function nextPurchasableDecor(cat) {
    return DECOR[cat].find((i) => !i.achievement && !i.starter && !(state.decorOwned[cat] || []).includes(i.id));
  }
  function nextPurchasableOutfit() {
    return OUTFITS.find((o) => !o.achievement && !o.starter && !(state.outfitsOwned || []).includes(o.id));
  }
  function canAfford(cost) { return cost != null && state.coins >= cost; }


  function ovenPos(index) {
    const n = Math.max(state.ovens, currentLocation().maxOvens);
    const right = 86;
    const spacing = 12;
    return { x: right - (n - 1 - index) * spacing, y: 80 };
  }
  function counterSlotPos(index) {
    const n = Math.max(1, currentLocation().maxQueue);
    const start = 34;
    const end = 70;
    const x = n === 1 ? 52 : start + (end - start) * (index / Math.max(1, n - 1));
    return { x: x, y: COUNTER_Y };
  }
  function holdingPos(index) {
    return { x: 24 + index * 11, y: 30 + (index % 2) * 5 };
  }
  function slotPos(index, total) {
    return counterSlotPos(index);
  }
  const HOLD_CAP = 2;
  function isAtCounter(c) {
    return c && c.area !== "hold" && ["entering", "waiting", "ordered", "ready"].includes(c.status);
  }
  function occupiedSlots() {
    const used = new Set();
    for (const c of customers) {
      if (isAtCounter(c) && c.slot != null) used.add(c.slot);
    }
    return used;
  }
  function nextFreeSlot() {
    const n = currentLocation().maxQueue;
    const used = occupiedSlots();
    for (let i = 0; i < n; i++) if (!used.has(i)) return i;
    return -1;
  }
  function holdingCount() {
    return customers.filter((c) => c.area === "hold" && c.status !== "leaving").length;
  }
  function promoteHolder() {
    const slot = nextFreeSlot();
    if (slot < 0) return false;
    const holder = customers.find((c) => c.area === "hold" && c.status !== "leaving");
    if (!holder) return false;
    holder.area = "counter";
    holder.slot = slot;
    if (holder.status === "waiting") holder.status = "entering";
    startWalk(holder, counterSlotPos(slot), false);
    holder.walkDur = Math.max(0.6, holder.walkDur);
    return true;
  }
  function takeSpot(customer) { return { x: customer.x, y: WORK_Y }; }
  function serveSpot(customer) { return { x: customer.x, y: WORK_Y }; }

  function dist(a, b) { return Math.hypot((a.x - b.x), (a.y - b.y)); }
  function startWalk(actor, dest, isPlayer) {
    if (!dest) return;
    const d = dist(actor, dest);
    if (d < 1.2) {
      actor.x = dest.x;
      actor.y = dest.y;
      actor.walking = false;
      actor.arriveWait = isPlayer ? playerWorkTime() : 0.18;
      return;
    }
    actor.walkFrom = { x: actor.x, y: actor.y };
    actor.walkTo = { x: dest.x, y: dest.y };
    actor.walkT = 0;
    const speed = isPlayer ? playerWalkSpeed() : staffWalkSpeed();
    actor.walkDur = Math.max(0.16, d / speed);
    actor.walking = true;
    const dx = dest.x - actor.x;
    const dy = dest.y - actor.y;
    if (Math.abs(dx) > Math.abs(dy)) actor.face = dx < 0 ? "left" : "right";
    else actor.face = dy < 0 ? "up" : "down";
  }
  function tickWalk(actor, dt) {
    if (!actor.walking) return false;
    actor.walkT += dt;
    const p = Math.min(1, actor.walkT / actor.walkDur);
    const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    actor.x = actor.walkFrom.x + (actor.walkTo.x - actor.walkFrom.x) * ease;
    actor.y = actor.walkFrom.y + (actor.walkTo.y - actor.walkFrom.y) * ease;
    if (p >= 1) {
      actor.x = actor.walkTo.x;
      actor.y = actor.walkTo.y;
      actor.walking = false;
      return true;
    }
    return false;
  }

  function queuedCount() {
    return customers.filter((c) => c.status === "entering" || c.status === "waiting" || c.status === "ordered" || c.status === "ready").length;
  }
  function ringBell() {
    const bell = document.querySelector(".bell");
    if (!bell) return;
    bell.classList.remove("ring");
    void bell.offsetWidth;
    bell.classList.add("ring");
  }

  function spawnCustomer(goodId) {
    const loc = currentLocation();
    let slot = nextFreeSlot();
    let area = "counter";
    let dest;
    if (slot >= 0) {
      dest = counterSlotPos(slot);
    } else if (holdingCount() < HOLD_CAP) {
      area = "hold";
      slot = holdingCount();
      dest = holdingPos(slot);
    } else {
      return null;
    }
    const type = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
    const good = goodId ? goodById(goodId) : pickGood();
    const customer = {
      id: nextCustomerId++,
      type, goodId: good.id,
      status: "entering",
      patience: 70, maxPatience: 70,
      x: DOOR.x, y: DOOR.y,
      slot,
      area,
      walkFrom: { x: DOOR.x, y: DOOR.y },
      walkTo: dest,
      walkT: 0,
      walkDur: 0,
      walking: false,
      face: "down",
      happy: false
    };
    startWalk(customer, dest, false);
    customer.walkDur = Math.max(0.7, customer.walkDur);
    customers.push(customer);
    ringBell();
    return customer;
  }

  function reassignSlots() {
    /* Intentionally a no-op: assigned counter spots stay put until that customer leaves. */
  }

  function takeOrder(customer) {
    if (!customer || customer.status !== "waiting" || customer.area === "hold") return false;
    customer.status = "ordered";
    pendingOrders.push({ customerId: customer.id, goodId: customer.goodId });
    uiDirty = true;
    return true;
  }
  function startBake(ovenIndex, order) {
    const oven = ovens[ovenIndex];
    if (!oven || oven.job) return false;
    if (!order) order = pendingOrders[0];
    if (!order) return false;
    const idx = pendingOrders.indexOf(order);
    if (idx >= 0) pendingOrders.splice(idx, 1);
    oven.job = { customerId: order.customerId, goodId: order.goodId, progress: 0, duration: bakeDuration(order.goodId) };
    uiDirty = true;
    return true;
  }
  function startBakeForOrder(order) {
    const idx = ovens.findIndex((o) => !o.job);
    if (idx < 0) return false;
    return startBake(idx, order);
  }
  function findDeliverableOven(customer) {
    const exact = ovens.find((o) => o.job && o.job.progress >= o.job.duration && o.job.customerId === customer.id);
    if (exact) return exact;
    return ovens.find((o) => o.job && o.job.progress >= o.job.duration && o.job.goodId === customer.goodId && (customer.status === "ordered" || customer.status === "ready"));
  }
  function beginLeave(customer, happy) {
    customer.status = "leaving";
    customer.happy = happy;
    startWalk(customer, DOOR, false);
    customer.walkDur = Math.max(0.7, customer.walkDur);
    if (!happy) {
      pendingOrders = pendingOrders.filter((o) => o.customerId !== customer.id);
      for (const oven of ovens) {
        if (oven.job && oven.job.customerId === customer.id) {
          const other = customers.find((c) => c.id !== customer.id && (c.status === "ordered" || c.status === "ready") && c.goodId === oven.job.goodId);
          if (other) oven.job.customerId = other.id;
          else if (oven.job.progress >= oven.job.duration) oven.job = null;
        }
      }
    }
    promoteHolder();
  }
  function deliverTo(customer) {
    if (!customer || (customer.status !== "ready" && customer.status !== "ordered")) return false;
    const oven = findDeliverableOven(customer);
    if (!oven) return false;
    const result = computePay(oven.job.goodId);
    addCoins(result.amount);
    const el = document.querySelector('[data-customer="' + customer.id + '"]');
    const layer = $("float-layer");
    if (layer) {
      const rect = layer.getBoundingClientRect();
      let x = rect.width * (customer.x / 100);
      let y = rect.height * (customer.y / 100);
      if (el) {
        const cr = el.getBoundingClientRect();
        x = cr.left + cr.width / 2 - rect.left;
        y = cr.top - rect.top + 10;
      }
      spawnFloater(result.amount, result.tipped, x, y);
    }
    oven.job = null;
    state.served += 1;
    checkAchievements();
    beginLeave(customer, true);
    uiDirty = true;
    return true;
  }
  function deliverOven(oven) {
    if (!oven || !oven.job || oven.job.progress < oven.job.duration) return false;
    let customer = customers.find((c) => c.id === oven.job.customerId && (c.status === "ready" || c.status === "ordered"));
    if (!customer) customer = customers.find((c) => (c.status === "ready" || c.status === "ordered") && c.goodId === oven.job.goodId);
    if (!customer) { oven.job = null; return false; }
    return deliverTo(customer);
  }
  function markReadyOvens() {
    for (const oven of ovens) {
      if (oven.job && oven.job.progress >= oven.job.duration) {
        const c = customers.find((x) => x.id === oven.job.customerId);
        if (c && c.status === "ordered") c.status = "ready";
      }
    }
  }


  function commandPlayer(task) {
    player.task = task;
    let dest = STAFF_HOME.cashier;
    if (task.type === "take" || task.type === "serve") {
      const c = customers.find((x) => x.id === task.customerId);
      dest = c ? takeSpot(c) : { x: 52, y: WORK_Y };
    } else if (task.type === "bake") {
      const p = ovenPos(task.ovenIndex != null ? task.ovenIndex : 0);
      dest = { x: p.x - 8, y: Math.min(90, p.y + 8) };
    }
    startWalk(player, dest, true);
    if (!player.walking && player.arriveWait <= 0) player.arriveWait = playerWorkTime();
  }
  function finishPlayerTask() {
    const task = player.task;
    player.task = null;
    if (!task) return;
    if (task.type === "take") {
      const c = customers.find((x) => x.id === task.customerId);
      if (c) takeOrder(c);
    } else if (task.type === "bake") {
      const order = pendingOrders.find((o) => o.customerId === task.customerId) || pendingOrders[0];
      const idx = task.ovenIndex != null ? task.ovenIndex : ovens.findIndex((o) => !o.job);
      if (idx >= 0 && order) startBake(idx, order);
    } else if (task.type === "serve") {
      if (task.customerId) {
        const c = customers.find((x) => x.id === task.customerId);
        if (c) deliverTo(c);
      } else {
        const oven = ovens.find((o) => o.job && o.job.progress >= o.job.duration);
        if (oven) deliverOven(oven);
      }
    }
    uiDirty = true;
    startWalk(player, { x: 52, y: 91 }, true);
  }

  function onCustomerTap(id) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    if (c.status === "waiting") {
      commandPlayer({ type: "take", customerId: c.id });
      return;
    }
    if (c.status === "ready" || c.status === "ordered") {
      if (findDeliverableOven(c)) commandPlayer({ type: "serve", customerId: c.id });
    }
  }
  function onOvenTap(index) {
    const oven = ovens[index];
    if (!oven) return;
    if (oven.job && oven.job.progress >= oven.job.duration) {
      commandPlayer({ type: "serve", ovenIndex: index, customerId: oven.job.customerId });
      return;
    }
    if (!oven.job && pendingOrders.length) {
      commandPlayer({ type: "bake", ovenIndex: index, customerId: pendingOrders[0].customerId });
      return;
    }
    openSheet("oven", { index: index });
  }

  function pickStaffTask(role) {
    if (role === "cashier") {
      const waiter = customers.find((c) => c.status === "waiting" && c.area !== "hold");
      if (waiter) return { type: "take", customerId: waiter.id };
    } else if (role === "cook") {
      if (pendingOrders.length) {
        const idx = ovens.findIndex((o) => !o.job);
        if (idx >= 0) return { type: "bake", ovenIndex: idx, customerId: pendingOrders[0].customerId };
      }
    } else if (role === "server") {
      const oven = ovens.find((o) => o.job && o.job.progress >= o.job.duration);
      if (oven) return { type: "serve", customerId: oven.job.customerId };
    }
    return null;
  }
  function destForStaff(role, task) {
    if (!task) return STAFF_HOME[role];
    if (task.type === "take" || task.type === "serve") {
      const c = customers.find((x) => x.id === task.customerId);
      return c ? takeSpot(c) : STAFF_HOME[role];
    }
    if (task.type === "bake") return ovenPos(task.ovenIndex || 0);
    return STAFF_HOME[role];
  }
  function finishStaffTask(role) {
    const actor = staffActors[role];
    const task = actor.task;
    actor.task = null;
    if (!task) return;
    if (task.type === "take") {
      const c = customers.find((x) => x.id === task.customerId);
      if (c) takeOrder(c);
    } else if (task.type === "bake") {
      const order = pendingOrders.find((o) => o.customerId === task.customerId) || pendingOrders[0];
      if (order) startBake(task.ovenIndex, order);
    } else if (task.type === "serve") {
      const c = customers.find((x) => x.id === task.customerId);
      if (c) deliverTo(c);
      else {
        const oven = ovens.find((o) => o.job && o.job.progress >= o.job.duration);
        if (oven) deliverOven(oven);
      }
    }
    startWalk(actor, STAFF_HOME[role], false);
  }
  function tickStaff(role, dt, intervalFn) {
    const actor = staffActors[role];
    if (!state.staff[role]) {
      actor.present = false;
      return;
    }
    actor.present = true;
    const arrived = tickWalk(actor, dt);
    if (arrived) {
      if (actor.task) actor.arriveWait = 0.2;
    }
    if (actor.walking) return;
    if (actor.arriveWait > 0) {
      actor.arriveWait -= dt;
      if (actor.arriveWait <= 0) finishStaffTask(role);
      return;
    }
    staffAcc[role] += dt;
    if (staffAcc[role] >= intervalFn()) {
      const task = pickStaffTask(role);
      if (task) {
        staffAcc[role] = 0;
        actor.task = task;
        startWalk(actor, destForStaff(role, task), false);
        if (!actor.walking) actor.arriveWait = 0.2;
      }
    }
  }

  function tickFloor(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      if (nextFreeSlot() >= 0 || holdingCount() < HOLD_CAP) spawnCustomer();
      spawnTimer = spawnInterval() * (0.85 + Math.random() * 0.3);
    }

    for (const oven of ovens) {
      if (!oven.job) continue;
      oven.job.progress += dt * (boostActive() ? 2 : 1);
      if (oven.job.progress >= oven.job.duration) {
        oven.job.progress = oven.job.duration;
        const c = customers.find((x) => x.id === oven.job.customerId);
        if (c && c.status === "ordered") c.status = "ready";
      }
    }

    const playerArrived = tickWalk(player, dt);
    if (playerArrived) player.arriveWait = Math.max(player.arriveWait, playerWorkTime());
    if (!player.walking && player.arriveWait > 0) {
      player.arriveWait -= dt;
      if (player.arriveWait <= 0) finishPlayerTask();
    }

    tickStaff("cashier", dt, cashierInterval);
    tickStaff("cook", dt, cookInterval);
    tickStaff("server", dt, serverInterval);

    for (const c of customers) {
      const arrived = tickWalk(c, dt);
      if (arrived) {
        if (c.status === "entering") c.status = "waiting";
        if (c.status === "leaving") c.gone = true;
      }
      if (c.status === "waiting") c.patience -= dt;
      else if (c.status === "ordered" || c.status === "ready") c.patience -= dt * 0.55;
      if ((c.status === "waiting" || c.status === "ordered" || c.status === "ready") && c.patience <= 0) {
        beginLeave(c, false);
      }
    }
    if (customers.some((c) => c.gone)) {
      customers = customers.filter((c) => !c.gone);
      promoteHolder();
    }
  }

  function clearFloor() {
    customers = [];
    pendingOrders = [];
    ovens = Array.from({ length: state.ovens }, () => ({ job: null }));
    spawnTimer = 0.8;
    staffAcc = { cashier: 0, cook: 0, server: 0 };
    player = makeWalker(52, 91);
    player.present = true;
    staffActors.cashier = makeWalker(24, 80);
    staffActors.cook = makeWalker(34, 84);
    staffActors.server = makeWalker(66, 70);
    const cl = $("customers-layer");
    if (cl) cl.innerHTML = "";
  }
  function syncOvenCount() {
    while (ovens.length < state.ovens) ovens.push({ job: null });
    if (ovens.length > state.ovens) ovens.length = state.ovens;
  }


  function grantGems(amount, reason, key) {
    if (key) {
      if (state.awards[key]) return;
      state.awards[key] = true;
    }
    state.gems += amount;
    toast("+" + amount + " 💎  " + reason);
    uiDirty = true;
  }
  function unlockAchievement(id) {
    if (state.achievements[id]) return;
    state.achievements[id] = true;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    for (const cat of DECOR_CATS) {
      for (const item of DECOR[cat.id]) {
        if (item.achievement === id && !state.decorOwned[cat.id].includes(item.id)) {
          state.decorOwned[cat.id].push(item.id);
        }
      }
    }
    for (const o of OUTFITS) {
      if (o.achievement === id && !state.outfitsOwned.includes(o.id)) state.outfitsOwned.push(o.id);
    }
    if (def) toast("Achievement: " + def.name + "! Unlocked " + def.unlocks + ".");
    applyDecorLooks();
    uiDirty = true;
  }
  function checkAchievements() {
    if (state.served >= 1) unlockAchievement("firstSale");
    if (state.served >= 25) unlockAchievement("served25");
    if (state.staff.cashier + state.staff.cook + state.staff.server >= 1) unlockAchievement("firstStaff");
    if (state.ovens >= 2) unlockAchievement("twoOvens");
    if (state.lifetimeCoins >= 10000) unlockAchievement("coins10k");
    if (state.locationIndex >= 1) unlockAchievement("firstMove");
    if (state.served >= 100) unlockAchievement("served100");

    if (state.served >= 1) grantGems(2, "First sale!", "firstSaleGems");
    if (state.unlockedGoods.includes("croissant")) grantGems(3, "Croissants on the menu!", "croissantMenu");
    if (state.staff.cashier + state.staff.cook + state.staff.server >= 1) grantGems(5, "First teammate hired!", "firstStaffGems");
    if (state.ovens >= 2) grantGems(3, "A second oven!", "secondOvenGems");
    if (state.served >= 25) grantGems(4, "25 happy customers!", "served25Gems");
    if (state.served >= 100) grantGems(8, "100 customers served!", "served100Gems");
    if (state.lifetimeCoins >= 1000) grantGems(2, "1,000 coins baked!", "life1k");
    if (state.lifetimeCoins >= 10000) grantGems(5, "10K lifetime coins!", "life10k");
    if (state.lifetimeCoins >= 100000) grantGems(8, "100K lifetime coins!", "life100k");
    if (state.lifetimeCoins >= 1e6) grantGems(15, "A million-coin bakery!", "life1m");
  }
  function addCoins(amount) {
    if (amount <= 0) return;
    state.coins += amount;
    state.runCoins += amount;
    state.lifetimeCoins += amount;
    checkAchievements();
    uiDirty = true;
  }

  function buyOvenSpeed() {
    const cost = ovenSpeedCost();
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.ovenSpeedLevel += 1;
    uiDirty = true; save(); return true;
  }
  function buyOvenSlot() {
    const cost = ovenSlotCost();
    if (cost == null || state.ovens >= currentLocation().maxOvens || state.coins < cost) return false;
    state.coins -= cost;
    state.ovens += 1;
    syncOvenCount();
    checkAchievements();
    uiDirty = true; save();
    renderOvens(true);
    return true;
  }
  function buyGood(id) {
    const g = goodById(id);
    if (!g || state.unlockedGoods.includes(id) || g.loc > state.locationIndex) return false;
    if (state.coins < g.unlock) return false;
    state.coins -= g.unlock;
    state.unlockedGoods.push(id);
    checkAchievements();
    uiDirty = true; save();
    renderMenuPreview();
    return true;
  }
  function buyQuality() {
    const cost = qualityCost();
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.qualityLevel += 1;
    uiDirty = true; save(); return true;
  }
  function buyAroma() {
    const cost = aromaCost();
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.aromaLevel += 1;
    uiDirty = true; save(); return true;
  }
  function buyStaff(role) {
    const cost = staffHireCost(role);
    if (state.coins < cost) return false;
    state.coins -= cost;
    state.staff[role] += 1;
    staffActors[role].present = true;
    const home = STAFF_HOME[role];
    if (state.staff[role] === 1) { staffActors[role].x = home.x; staffActors[role].y = home.y; }
    checkAchievements();
    uiDirty = true; save();
    return true;
  }
  function buyDecor(cat, id) {
    const item = decorItem(cat, id);
    if (!item || item.achievement || (state.decorOwned[cat] || []).includes(id)) return false;
    if (state.coins < item.cost) return false;
    const next = nextPurchasableDecor(cat);
    if (!next || next.id !== id) return false;
    state.coins -= item.cost;
    state.decorOwned[cat].push(id);
    state.decorEquipped[cat] = id;
    applyDecorLooks();
    uiDirty = true; save();
    return true;
  }
  function equipDecor(cat, id) {
    if (!(state.decorOwned[cat] || []).includes(id)) return false;
    state.decorEquipped[cat] = id;
    applyDecorLooks();
    uiDirty = true; save();
    return true;
  }
  function buyOutfit(id) {
    const item = outfitById(id);
    if (!item || item.achievement || (state.outfitsOwned || []).includes(id)) return false;
    if (state.coins < item.cost) return false;
    const next = nextPurchasableOutfit();
    if (!next || next.id !== id) return false;
    state.coins -= item.cost;
    state.outfitsOwned.push(id);
    state.outfitEquipped = id;
    uiDirty = true; save();
    return true;
  }
  function equipOutfit(id) {
    if (!(state.outfitsOwned || []).includes(id)) return false;
    state.outfitEquipped = id;
    uiDirty = true; save();
    return true;
  }
  function startingGoods(locIndex) {
    const loc = LOCATIONS[locIndex];
    const available = GOODS.filter((g) => g.loc <= locIndex);
    return available.filter((g, i) => i < loc.startGoods || g.unlock === 0).map((g) => g.id);
  }
  function canMove() {
    const next = nextLocation();
    return next && state.runCoins >= next.cost;
  }
  function doMove() {
    const next = nextLocation();
    if (!next || !canMove()) return false;
    const first = state.locationIndex === 0;
    state.locationIndex += 1;
    state.coins = 0;
    state.runCoins = 0;
    state.ovens = 1;
    state.ovenSpeedLevel = 0;
    state.qualityLevel = 0;
    state.aromaLevel = 0;
    state.staff = { cashier: 0, cook: 0, server: 0 };
    state.unlockedGoods = startingGoods(state.locationIndex);
    state.boostUntil = 0;
    clearFloor();
    if (first) grantGems(15, "Moved into a bigger bakery!", "firstMoveGems");
    checkAchievements();
    displayedCoins = 0;
    applyLocationClass();
    applyDecorLooks();
    renderOvens(true);
    uiDirty = true; save();
    toast("Welcome to the " + next.name + "!");
    renderAll();
    setScreen("shop");
    return true;
  }

  function applyTimeSkip(hours) {
    const cost = SKIP_COSTS[hours];
    if (state.gems < cost) { toast("Not enough gems yet."); return; }
    const cps = automatedCps({ includeBoost: false });
    if (cps <= 0) { toast("Hire a cashier, cook, and server first — skips use your staff."); return; }
    state.gems -= cost;
    const earned = cps * hours * 3600;
    addCoins(earned);
    toast("Skipped " + hours + "h and earned " + formatNumber(earned) + " coins!");
    save(); renderAll();
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
      fill.style.width = (p * 100) + "%";
      if (p < 1) requestAnimationFrame(tickAd);
      else {
        overlay.classList.add("hidden");
        adBusy = false;
        state.adCooldownUntil[kind] = Date.now() + AD_COOLDOWN_MS;
        if (kind === "boost") {
          state.boostUntil = Math.max(Date.now(), state.boostUntil) + BOOST_MS;
          toast("2x boost is baking for 30 minutes!");
        } else if (kind === "offline") {
          state.doubleNextOffline = true;
          toast("Your next offline earnings will be doubled!");
        }
        save(); uiDirty = true; renderAll();
      }
    }
    requestAnimationFrame(tickAd);
  }

  function processOffline() {
    const now = Date.now();
    const elapsed = now - (state.lastTick || now);
    state.lastTick = now;
    if (elapsed < 10000) return null;
    const capped = Math.min(elapsed, OFFLINE_CAP_MS);
    const cps = automatedCps({ includeBoost: false });
    if (cps <= 0) return null;
    let earned = cps * (capped / 1000);
    const doubled = !!state.doubleNextOffline;
    if (doubled) { earned *= 2; state.doubleNextOffline = false; }
    addCoins(earned);
    return { elapsed, capped, earned, doubled, cappedHit: elapsed > OFFLINE_CAP_MS };
  }

  function serialize() { return JSON.stringify(Object.assign({}, state, { v: SAVE_VERSION })); }
  function save() {
    try { state.lastSave = Date.now(); localStorage.setItem(SAVE_KEY, serialize()); }
    catch (err) { console.warn("Save failed", err); }
  }
  function hydrateState(data) {
    const fresh = defaultState();
    state = Object.assign({}, fresh, data);
    state.v = SAVE_VERSION;
    state.staff = Object.assign({}, fresh.staff, data.staff || {});
    state.adCooldownUntil = Object.assign({}, fresh.adCooldownUntil, data.adCooldownUntil || {});
    state.awards = Object.assign({}, data.awards || {});
    state.achievements = Object.assign({}, data.achievements || {});
    state.unlockedGoods = Array.isArray(data.unlockedGoods) && data.unlockedGoods.length ? data.unlockedGoods : ["bread"];
    state.decorOwned = starterDecorOwned();
    if (data.decorOwned) {
      for (const cat of DECOR_CATS) {
        const ids = data.decorOwned[cat.id];
        if (Array.isArray(ids)) state.decorOwned[cat.id] = Array.from(new Set((state.decorOwned[cat.id] || []).concat(ids)));
      }
    }
    state.decorEquipped = Object.assign({}, starterDecorEquipped(), data.decorEquipped || {});
    state.outfitsOwned = Array.isArray(data.outfitsOwned) && data.outfitsOwned.length ? data.outfitsOwned : starterOutfits();
    if (data.outfitEquipped) state.outfitEquipped = data.outfitEquipped;
    displayedCoins = state.coins;
    syncOvenCount();
  }
  function load() {
    try {
      for (const key of OLD_SAVE_KEYS) {
        try { if (localStorage.getItem(key)) { hadOldSave = true; oldSaveVersion = key.endsWith("v2") ? 2 : 1; } } catch (e) { /* ignore */ }
      }
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        hydrateState(data);
        return true;
      }
      const raw2 = localStorage.getItem("cozyBakeryIdle_v2");
      if (raw2) {
        hydrateState(JSON.parse(raw2));
        state.v = SAVE_VERSION;
        save();
        hadOldSave = true;
        oldSaveVersion = 2;
        migratedFromV2 = true;
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Load failed", err);
      state = defaultState();
      return false;
    }
  }
  function resetSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    state = defaultState();
    displayedCoins = 0;
    currentSheet = null;
    closeSheet();
    clearFloor();
    applyLocationClass();
    applyDecorLooks();
    renderOvens(true);
    uiDirty = true;
    renderAll();
    toast("Save reset. A fresh bakery awaits.");
  }


  function toast(message) {
    const root = $("toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
  function spawnFloater(value, tipped, x, y) {
    const layer = $("float-layer");
    if (!layer) return;
    const el = document.createElement("div");
    el.className = "floater";
    el.textContent = "+" + formatNumber(value) + " 🪙" + (tipped ? " ✨" : "");
    el.style.setProperty("--dx", (Math.random() * 70 - 35).toFixed(0) + "px");
    el.style.left = x + "px";
    el.style.top = y + "px";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function closeModal() { $("modal-root").innerHTML = ""; modalOpen = false; }
  function showModal(html) { modalOpen = true; $("modal-root").innerHTML = '<div class="modal-backdrop">' + html + "</div>"; }

  function closeSheet() {
    const root = $("sheet-root");
    root.classList.add("hidden");
    root.innerHTML = "";
    sheetOpen = false;
    currentSheet = null;
  }
  function openSheet(kind, opts) {
    opts = opts || {};
    currentSheet = { kind, opts };
    sheetOpen = true;
    const root = $("sheet-root");
    root.classList.remove("hidden");
    root.innerHTML = '<div class="sheet-backdrop" data-close-sheet="1"></div><div class="sheet" role="dialog"><div class="sheet-handle"></div><button type="button" class="sheet-close" data-close-sheet="1" aria-label="Close">×</button><div id="sheet-body"></div></div>';
    renderSheet();
  }
  function renderSheet() {
    const body = $("sheet-body");
    if (!body || !currentSheet) return;
    const kind = currentSheet.kind;
    if (kind === "oven") body.innerHTML = sheetOven();
    else if (kind === "register") body.innerHTML = sheetStaff("cashier", "Register", "💁", "Takes orders at the till. You are still faster when you tap a customer yourself.");
    else if (kind === "prep") body.innerHTML = sheetStaff("cook", "Prep station", "👨‍🍳", "A cook starts bakes at free ovens. You are still faster when you tap an oven yourself.");
    else if (kind === "pickup" || kind === "counter") body.innerHTML = sheetCounter();
    else if (kind === "menu") body.innerHTML = sheetMenu();
    else if (kind === "sign") body.innerHTML = sheetSign();
    else if (kind === "player") body.innerHTML = sheetOutfits();
    else if (kind === "decor" || (kind && kind.startsWith("decor:"))) {
      const cat = currentSheet.opts.cat || kind.slice(6);
      body.innerHTML = sheetDecor(cat);
    } else if (kind === "door") body.innerHTML = '<h2>🚪 Entrance</h2><p class="lede">Customers come in through this door and walk down to the counter. Tap them when they arrive.</p>';
    bindSheetButtons();
  }
  function upgradeRow(icon, title, meta, cost, action, extra) {
    const can = cost == null || state.coins >= cost;
    const btn = cost == null
      ? '<span class="owned-tag">Owned</span>'
      : '<button type="button" class="buy-btn" data-up="' + action + '"' + (can ? "" : " disabled") + ">" +
        "<span>" + (extra || "Buy") + "</span><span class=\"buy-cost\">" + formatNumber(cost) + " 🪙</span></button>";
    return '<article class="upgrade-card"><div class="upgrade-icon">' + icon + "</div><div class=\"upgrade-info\"><h3>" + title + "</h3><p class=\"meta\">" + meta + "</p></div>" + btn + "</article>";
  }

  function sheetOven() {
    const loc = currentLocation();
    const atCap = state.ovens >= loc.maxOvens;
    const slotCost = ovenSlotCost();
    let html = "<h2>🔥 Ovens</h2><p class=\"lede\">Tap an oven with a ticket to bake. Use this sheet to make them faster or add another.</p>";
    html += upgradeRow("🔥", "Faster Ovens · Lv " + state.ovenSpeedLevel, "Bake speed " + Math.round(ovenSpeedMult() * 100) + "%. Next: " + Math.round((ovenSpeedMult() + 0.18) * 100) + "%.", ovenSpeedCost(), "ovenSpeed", "Upgrade");
    if (atCap) html += upgradeRow("➕", "Oven slots · " + state.ovens + "/" + loc.maxOvens, "This shop is full. Move to a bigger location for more ovens.", null, "ovenSlot");
    else html += upgradeRow("➕", "Oven slots · " + state.ovens + "/" + loc.maxOvens, "Add another oven so you can bake more orders at once.", slotCost, "ovenSlot", "Install");
    return html;
  }
  function sheetStaff(role, title, icon, blurb) {
    const lv = state.staff[role];
    const names = { cashier: "Cashier", cook: "Cook", server: "Server" };
    const meta = {
      cashier: lv ? "Takes an order every " + cashierInterval().toFixed(1) + "s (plus a short walk)." : "Automatically takes orders from waiting customers.",
      cook: lv ? "Starts a bake every " + cookInterval().toFixed(1) + "s." : "Automatically starts baking pending orders.",
      server: lv ? "Serves a finished treat every " + serverInterval().toFixed(1) + "s." : "Automatically hands finished orders to customers."
    };
    const label = lv === 0 ? "Hire " + names[role] : names[role] + " · Lv " + lv;
    return "<h2>" + icon + " " + title + "</h2><p class=\"lede\">" + blurb + "</p>" +
      upgradeRow(icon, label, meta[role], staffHireCost(role), "staff:" + role, lv === 0 ? "Hire" : "Upgrade");
  }
  function sheetCounter() {
    return "<h2>🛎️ Service counter</h2><p class=\"lede\">Hire a server to hand over finished orders, or change the look of the counter.</p>" +
      sheetStaff("server", "Pickup", "🏃", "A server carries finished bakes to waiting customers. You are still faster when you tap to serve.").replace(/<h2>.*?<\/h2><p class="lede">.*?<\/p>/, "") +
      "<p class=\"section-label\">Counter look</p>" + wardrobeGrid("counter");
  }
  function sheetMenu() {
    let html = "<h2>📋 Menu board</h2><p class=\"lede\">Unlock new baked goods and improve recipe quality. Customers order from whatever is on the board.</p>";
    html += '<p class="section-label">On the menu</p>';
    for (const g of unlockedGoodsList()) {
      html += upgradeRow(g.emoji, g.name, formatNumber(g.price * locationMultiplier() * qualityMult()) + " coins · " + bakeDuration(g.id).toFixed(1) + "s bake", null, "good:" + g.id);
    }
    const locked = GOODS.filter((g) => g.loc <= state.locationIndex && !state.unlockedGoods.includes(g.id));
    for (const g of locked) {
      html += upgradeRow(g.emoji, "Unlock " + g.name, "Sells for " + formatNumber(g.price * locationMultiplier() * qualityMult()) + " coins.", g.unlock, "good:" + g.id, "Unlock");
    }
    const later = GOODS.filter((g) => g.loc > state.locationIndex);
    if (later.length) html += '<p class="meta">Later locations can add ' + later.map((g) => g.name).slice(0, 3).join(", ") + ".</p>";
    html += upgradeRow("⭐", "Recipe Quality · Lv " + state.qualityLevel, "All sales +" + Math.round((qualityMult() - 1) * 100) + "%. Each level adds +8%.", qualityCost(), "quality", "Upgrade");
    return html;
  }
  function sheetSign() {
    return "<h2>🪧 Shop sign</h2><p class=\"lede\">A tastier aroma draws more customers. You can still hang any sign look you own.</p>" +
      upgradeRow("🔔", "Shop Aroma · Lv " + state.aromaLevel, "Customers arrive every " + spawnInterval().toFixed(1) + "s.", aromaCost(), "aroma", "Upgrade") +
      "<p class=\"section-label\">Sign look</p>" + wardrobeGrid("sign");
  }
  function sheetDecor(cat) {
    const def = DECOR_CATS.find((c) => c.id === cat) || DECOR_CATS[0];
    const next = nextPurchasableDecor(def.id);
    let bonus = 0;
    for (const id of state.decorOwned[def.id] || []) {
      const item = decorItem(def.id, id);
      if (item && item.bonus > bonus) bonus = item.bonus;
    }
    const statLabel = def.stat === "tips" ? "tips" : "customer visits";
    let html = "<h2>" + def.emoji + " " + def.name + "</h2>";
    html += '<p class="lede">Buying a better piece always keeps the boost. The look you show is up to you — including older styles and achievement rewards.</p>';
    html += '<p class="meta">Owned ' + statLabel + " bonus: +" + Math.round(bonus * 100) + "% (from your best purchase, not the look on display).</p>";
    if (next) html += upgradeRow(def.emoji, "Upgrade to " + next.name, "Raises this category's " + statLabel + " bonus to +" + Math.round(next.bonus * 100) + "%.", next.cost, "decor:" + def.id + ":" + next.id, "Buy");
    else html += '<p class="owned-tag" style="display:block;text-align:center;margin:8px 0">Every coin upgrade in this category is yours.</p>';
    html += wardrobeGrid(def.id);
    return html;
  }
  function sheetOutfits() {
    const stats = bestOutfitStats();
    const next = nextPurchasableOutfit();
    let html = "<h2>👕 Outfits</h2><p class=\"lede\">A better outfit makes you walk and work faster, and can earn bigger tips. You can still wear any look you have unlocked.</p>";
    html += '<p class="meta">Best owned bonus: walk/work +' + Math.round(stats.speed * 100) + "%, tips +" + Math.round(stats.tips * 100) + "%.</p>";
    if (next) html += upgradeRow("👕", "Unlock " + next.name, "Work speed +" + Math.round(next.speed * 100) + "%, tips +" + Math.round(next.tips * 100) + "%.", next.cost, "outfit:" + next.id, "Buy");
    html += wardrobeGrid("outfit");
    return html;
  }


  function lookSwatchStyle(item) {
    const map = {
      "wp-cream": "#f8e0c4",
      "wp-peach": "repeating-linear-gradient(90deg,#f7cbb4 0 8px,#f3b49a 8px 16px)",
      "wp-mint": "#cfe8dc",
      "wp-sky": "#c9e4f7",
      "wp-rose": "#f3cdd6",
      "wp-gingham": "repeating-linear-gradient(90deg,#fde8ee 0 6px,#f3b8c5 6px 12px)",
      "fl-pine": "#e8c39a",
      "fl-cherry": "#c88762",
      "fl-tile": "#efe6d8",
      "fl-checker": "repeating-conic-gradient(#d9c4a0 0% 25%, #efe6d8 0% 50%) 0 0 / 16px 16px",
      "fl-marble": "#ece8f0",
      "fl-checkered-prize": "repeating-conic-gradient(#c4814a 0% 25%, #f4efe8 0% 50%) 0 0 / 16px 16px",
      "ct-oak": "#c8894c",
      "ct-white": "#efe8de",
      "ct-pink": "#f3b8c5",
      "ct-mintc": "#8fcebc",
      "ct-walnut": "#6e3d24",
      "ct-marblec": "#d8d4e0",
      "tb-pine": "#e8c39a",
      "tb-white": "#f4efe8",
      "tb-mint": "#a8d5c2",
      "tb-rose": "#f3b8c5",
      "tb-bistro": "#3b241f",
      "sg-wood": "#c4814a",
      "sg-cream": "#fff4e5",
      "sg-mint": "#8fcebc",
      "sg-night": "#3b241f",
      "sg-berry": "#d4537e",
      "sg-gold": "linear-gradient(180deg,#ffe9a0,#e0b84a)",
      "pl-succulent": "#7ec98a",
      "pl-fern": "#5aaa6a",
      "pl-flowers": "#f3b8c5",
      "pl-ivy": "#5aaa6a",
      "pl-sunflower": "#f4c95d",
      "lt-warm": "#ffe9a0",
      "lt-string": "#ff9aa8",
      "lt-pendant": "#ffe7a0",
      "lt-lantern": "#f6c9b3",
      "lt-starry": "#fff6c8",
      "outfit-pink": "#f3b8c5",
      "outfit-mint": "#8fcebc",
      "outfit-chef": "#f2ebe3",
      "outfit-berry": "#d4537e",
      "outfit-gold": "linear-gradient(180deg,#ffe9a0,#e0b84a)",
      "outfit-night": "#3b241f"
    };
    return "background:" + (map[item.look] || "#ffefd4");
  }

  function wardrobeGrid(cat) {
    const isOutfit = cat === "outfit";
    const items = isOutfit ? OUTFITS : (DECOR[cat] || []);
    const ownedList = isOutfit ? (state.outfitsOwned || []) : (state.decorOwned[cat] || []);
    const equipped = isOutfit ? state.outfitEquipped : state.decorEquipped[cat];
    const cards = items.map((item) => {
      const owned = ownedList.includes(item.id);
      const selected = equipped === item.id;
      const locked = !owned;
      const why = item.achievement ? ((ACHIEVEMENTS.find((a) => a.id === item.achievement) || {}).name || "") : "";
      const tag = locked && item.achievement
        ? why
        : selected ? (isOutfit ? "Wearing" : "On display") : owned ? (isOutfit ? "Tap to wear" : "Tap to display") : (isOutfit ? ("+" + Math.round((item.speed || 0) * 100) + "% spd") : ("+" + Math.round((item.bonus || 0) * 100) + "%"));
      return (
        '<button type="button" class="look-card' + (selected ? " selected" : "") + (locked ? " locked" : "") +
        '" data-testid="look-' + item.id + '" data-look="' + item.id + '" data-cat="' + cat + '"' + (locked ? " disabled" : "") + ">" +
        (item.achievement ? '<span class="prize">🏆</span>' : "") +
        '<div class="look-swatch" style="' + lookSwatchStyle(item) + '"></div>' +
        "<h4>" + (locked && item.achievement ? "???" : item.name) + "</h4>" +
        '<span class="tag">' + tag + "</span></button>"
      );
    }).join("");
    return '<div class="look-grid">' + cards + "</div>";
  }

  function bindSheetButtons() {
    /* Close / buy / look are handled by delegated listeners on #sheet-root (bindSheetRoot). */
  }

  function bindSheetRoot() {
    const root = $("sheet-root");
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";
    root.addEventListener("click", (ev) => {
      const closer = ev.target.closest("[data-close-sheet]");
      if (closer) {
        ev.preventDefault();
        ev.stopPropagation();
        closeSheet();
        return;
      }
      const up = ev.target.closest("[data-up]");
      if (up) {
        if (up.disabled) return;
        ev.preventDefault();
        ev.stopPropagation();
        const key = up.dataset.up;
        let ok = false;
        if (key === "ovenSpeed") ok = buyOvenSpeed();
        else if (key === "ovenSlot") ok = buyOvenSlot();
        else if (key === "quality") ok = buyQuality();
        else if (key === "aroma") ok = buyAroma();
        else if (key.startsWith("good:")) ok = buyGood(key.slice(5));
        else if (key.startsWith("staff:")) ok = buyStaff(key.slice(6));
        else if (key.startsWith("decor:")) ok = buyDecor(key.split(":")[1], key.split(":")[2]);
        else if (key.startsWith("outfit:")) ok = buyOutfit(key.slice(7));
        if (ok) { renderSheet(); renderAll(); }
        return;
      }
      const look = ev.target.closest("[data-look]");
      if (look) {
        if (look.disabled) return;
        ev.preventDefault();
        ev.stopPropagation();
        const cat = look.dataset.cat;
        if (cat === "outfit") { if (equipOutfit(look.dataset.look)) { renderSheet(); renderAll(); } }
        else if (equipDecor(cat, look.dataset.look)) { renderSheet(); renderAll(); }
      }
    });

    let swipeStart = null;
    root.addEventListener("pointerdown", (ev) => {
      const handle = ev.target.closest(".sheet-handle");
      if (!handle) return;
      swipeStart = ev.clientY;
      try { handle.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    });
    root.addEventListener("pointerup", (ev) => {
      if (swipeStart == null) return;
      const dy = ev.clientY - swipeStart;
      swipeStart = null;
      if (dy > 48) closeSheet();
    });
    root.addEventListener("pointercancel", () => { swipeStart = null; });
  }

  function applyLocationClass() {
    const scene = $("scene");
    if (!scene) return;
    scene.className = "scene loc-" + currentLocation().id;
    if ($("location-subtitle")) $("location-subtitle").textContent = currentLocation().name;
  }

  function ensureDot(el, key) {
    if (!el) return null;
    let dot = el.querySelector(':scope > .upgrade-dot, :scope > [data-dot="' + key + '"]');
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "upgrade-dot hidden";
      dot.dataset.dot = key;
      el.appendChild(dot);
    }
    return dot;
  }
  function setDot(el, key, on) {
    const dot = ensureDot(el, key);
    if (dot) dot.classList.toggle("hidden", !on);
  }

  function applyDecorLooks() {
    const wp = decorItem("wallpaper", state.decorEquipped.wallpaper);
    const fl = decorItem("floor", state.decorEquipped.floor);
    const ct = decorItem("counter", state.decorEquipped.counter);
    const sg = decorItem("sign", state.decorEquipped.sign);
    const pl = decorItem("plants", state.decorEquipped.plants);
    const lt = decorItem("lights", state.decorEquipped.lights);
    const tb = decorItem("tables", state.decorEquipped.tables);
    const wall = $("decor-wallpaper");
    const floor = $("decor-floor");
    const counter = $("decor-counter");
    const sign = $("decor-sign");
    const plants = $("decor-plants");
    const lights = $("decor-lights");
    const tables = $("decor-tables");
    if (wall) wall.className = "back-wall " + (wp ? wp.look : "wp-cream");
    if (floor) floor.className = "floor " + (fl ? fl.look : "fl-pine");
    if (counter) counter.className = "counter " + (ct ? ct.look : "ct-oak");
    if (sign) sign.className = "sign " + (sg ? sg.look : "sg-wood");
    if (plants) {
      plants.className = "plants " + (pl ? pl.look : "pl-succulent");
      plants.innerHTML = (PLANT_HTML[pl ? pl.look : "pl-succulent"] || "") + '<span class="upgrade-dot hidden" data-dot="plants"></span>';
    }
    if (lights) lights.className = "lights " + (lt ? lt.look : "lt-warm");
    if (tables) {
      tables.className = "tables " + (tb ? tb.look : "tb-pine");
      tables.innerHTML =
        '<div class="cafe-table" style="left:62%;top:22%" data-tap="decor:tables"><div class="top"></div><div class="leg"></div><span class="upgrade-dot hidden" data-dot="tables"></span></div>' +
        '<div class="cafe-table" style="left:78%;top:30%" data-tap="decor:tables"><div class="top"></div><div class="leg"></div></div>';
    }
    if (sign && !sign.querySelector(".upgrade-dot")) sign.insertAdjacentHTML("beforeend", '<span class="upgrade-dot hidden" data-dot="sign"></span>');
  }

  function sceneHint() {
    const waiting = customers.find((c) => c.status === "waiting");
    const pending = pendingOrders.length;
    const baking = ovens.some((o) => o.job && o.job.progress < o.job.duration);
    const ready = ovens.some((o) => o.job && o.job.progress >= o.job.duration) || customers.some((c) => c.status === "ready");
    const freeOven = ovens.some((o) => !o.job);
    if (!state.seenHint && waiting && !state.staff.cashier) return "Customers come in at the door up top. Tap one to take their order.";
    if (waiting && !state.staff.cashier) return "Tap the customer to take their order.";
    if (pending && freeOven && !state.staff.cook) return "Tap the oven to start baking.";
    if (ready && !state.staff.server) return "It's ready! Tap the oven or the customer to serve.";
    if (queuedCount() >= currentLocation().maxQueue && ready) return "The line is full — serve someone to make room.";
    if (baking) return "Something delicious is in the oven...";
    if (state.staff.cashier && state.staff.cook && state.staff.server) return "Your staff has the shop humming along. Tap furniture to upgrade.";
    return "Tap ovens, the register, or decor in the shop to upgrade.";
  }

  function affordableDots() {
    const loc = currentLocation();
    const slot = ovenSlotCost();
    return {
      oven: canAfford(ovenSpeedCost()) || (slot != null && state.ovens < loc.maxOvens && canAfford(slot)),
      register: canAfford(staffHireCost("cashier")),
      prep: canAfford(staffHireCost("cook")),
      pickup: canAfford(staffHireCost("server")),
      counter: canAfford(staffHireCost("server")) || (nextPurchasableDecor("counter") && canAfford(nextPurchasableDecor("counter").cost)),
      menu: canAfford(qualityCost()) || unlockedGoodsList().length < GOODS.filter((g) => g.loc <= state.locationIndex).length && GOODS.some((g) => g.loc <= state.locationIndex && !state.unlockedGoods.includes(g.id) && canAfford(g.unlock)),
      sign: canAfford(aromaCost()) || (nextPurchasableDecor("sign") && canAfford(nextPurchasableDecor("sign").cost)),
      plants: nextPurchasableDecor("plants") && canAfford(nextPurchasableDecor("plants").cost),
      wallpaper: nextPurchasableDecor("wallpaper") && canAfford(nextPurchasableDecor("wallpaper").cost),
      floor: nextPurchasableDecor("floor") && canAfford(nextPurchasableDecor("floor").cost),
      lights: nextPurchasableDecor("lights") && canAfford(nextPurchasableDecor("lights").cost),
      tables: nextPurchasableDecor("tables") && canAfford(nextPurchasableDecor("tables").cost),
      player: nextPurchasableOutfit() && canAfford(nextPurchasableOutfit().cost)
    };
  }

  function updateUpgradeDots() {
    const dots = affordableDots();
    setDot($("register"), "register", dots.register);
    setDot($("prep-station"), "prep", dots.prep);
    setDot($("pickup-spot"), "pickup", dots.pickup);
    setDot($("decor-counter"), "counter", dots.counter);
    setDot($("menu-board"), "menu", dots.menu);
    setDot($("decor-sign"), "sign", dots.sign);
    setDot($("decor-plants"), "plants", dots.plants);
    setDot($("decor-wallpaper"), "wallpaper", dots.wallpaper);
    setDot($("decor-floor"), "floor", dots.floor);
    setDot($("decor-lights"), "lights", dots.lights);
    setDot(document.querySelector("#decor-tables .cafe-table") || $("decor-tables"), "tables", dots.tables);
    const playerEl = document.querySelector(".actor.player");
    if (playerEl) setDot(playerEl, "player", dots.player);
    document.querySelectorAll(".oven .upgrade-dot, .oven-slot .upgrade-dot").forEach((d) => {
      d.classList.toggle("hidden", !dots.oven);
    });
  }

  function renderHeader() {
    const target = state.coins;
    const delta = target - displayedCoins;
    displayedCoins = Math.abs(delta) < 0.5 ? target : displayedCoins + delta * 0.35;
    $("coin-count").textContent = formatNumber(displayedCoins);
    $("gem-count").textContent = formatNumber(state.gems);
    const cps = automatedCps();
    $("cps-display").textContent = cps > 0 ? formatNumber(cps) + "/s" : "manual";
    const boost = $("boost-chip");
    if (boostActive()) {
      boost.classList.remove("hidden");
      boost.textContent = "2× " + formatTime(state.boostUntil - Date.now());
    } else {
      boost.classList.add("hidden");
    }
    const chip = $("location-chip");
    const loc = currentLocation();
    if (chip) chip.textContent = loc.emoji + " " + loc.multiplier.toFixed(2) + "×";
    const hint = $("scene-hint");
    if (hint) {
      hint.textContent = sceneHint();
      hint.style.visibility = (sheetOpen || modalOpen || currentScreen !== "shop") ? "hidden" : "visible";
    }
    if ($("location-subtitle")) $("location-subtitle").textContent = loc.name;
    updateUpgradeDots();
  }

  function renderMenuPreview() {
    const el = $("menu-preview");
    if (!el) return;
    el.textContent = unlockedGoodsList().map((g) => g.emoji).join(" ");
  }

  function bakerChibi(extraClass, hair, skin) {
    hair = hair || "#5a3a28";
    skin = skin || "#f9d7be";
    return (
      '<div class="chibi">' +
      '<div class="chibi-head" style="background:' + skin + '"><div class="hair" style="background:' + hair + '"></div>' +
      '<div class="eyes"></div><div class="blush"></div><div class="smile"></div></div>' +
      '<div class="chibi-body"><div class="apron"></div></div>' +
      '<div class="chibi-legs"><span></span><span></span></div></div>'
    );
  }
  function customerChibi(type) {
    const skin = type.skin || "#f9d7be";
    return (
      '<div class="chibi">' +
      '<div class="chibi-head" style="background:' + skin + '"><div class="hair" style="background:' + type.hair + '"></div>' +
      '<div class="eyes"></div><div class="blush"></div><div class="smile"></div></div>' +
      '<div class="chibi-body" style="background:' + type.body + '"></div>' +
      '<div class="chibi-legs"><span style="background:' + type.legs + '"></span><span style="background:' + type.legs + '"></span></div></div>'
    );
  }

  function placeActor(el, actor, extraClass) {
    if (!el || !actor) return;
    el.style.left = actor.x + "%";
    el.style.top = actor.y + "%";
    el.style.zIndex = String(Math.round(actor.y));
    const walking = !!actor.walking;
    const faceLeft = actor.face === "left";
    const base = extraClass || el.dataset.baseClass || "actor";
    let cls = base;
    if (walking) cls += " walking";
    if (faceLeft) cls += " face-left";
    if (el.className !== cls) el.className = cls;
  }

  function syncCustomers() {
    const layer = $("customers-layer");
    if (!layer) return;
    const existing = new Set();
    for (const c of customers) {
      existing.add(String(c.id));
      let el = layer.querySelector('[data-customer="' + c.id + '"]');
      if (!el) {
        el = document.createElement("button");
        el.type = "button";
        el.className = "actor customer";
        el.dataset.customer = String(c.id);
        el.dataset.testid = "customer";
        el.dataset.baseClass = "actor customer";
        el.innerHTML = '<div class="bubble" data-testid="order-bubble"></div><div class="patience"><div class="patience-fill"></div></div>' + customerChibi(c.type) + '<div class="shadow"></div>';
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onCustomerTap(c.id);
        });
        layer.appendChild(el);
      }
    }
    for (const el of [...layer.children]) {
      if (!existing.has(el.dataset.customer)) el.remove();
    }
  }

  function updateCustomers() {
    const layer = $("customers-layer");
    if (!layer) return;
    syncCustomers();
    for (const c of customers) {
      const el = layer.querySelector('[data-customer="' + c.id + '"]');
      if (!el) continue;
      const walking = !!c.walking;
      el.dataset.baseClass = "actor customer " + c.status + (c.happy ? " happy" : "");
      placeActor(el, c, el.dataset.baseClass);
      const bubble = el.querySelector(".bubble");
      const fill = el.querySelector(".patience-fill");
      const good = goodById(c.goodId);
      if (c.status === "leaving") {
        bubble.textContent = c.happy ? "💕" : "💨";
        fill.parentElement.style.visibility = "hidden";
      } else if (c.status === "entering") {
        bubble.textContent = good.emoji;
        fill.parentElement.style.visibility = "hidden";
      } else if (c.status === "ready") {
        bubble.textContent = good.emoji;
        fill.parentElement.style.visibility = "visible";
      } else if (c.status === "ordered") {
        bubble.textContent = "...";
        fill.parentElement.style.visibility = "visible";
      } else {
        bubble.textContent = good.emoji;
        fill.parentElement.style.visibility = "visible";
      }
      const ratio = Math.max(0, c.patience / c.maxPatience);
      fill.style.width = (ratio * 100) + "%";
      fill.className = "patience-fill" + (ratio < 0.28 ? " low" : ratio < 0.55 ? " mid" : "");
    }
  }

  function syncStaffPresence() {
    for (const role of ["cashier", "cook", "server"]) {
      staffActors[role].present = (state.staff[role] || 0) > 0;
      if (!staffActors[role].present) {
        staffActors[role].task = null;
        staffActors[role].walking = false;
      }
    }
  }

  function renderStaffAndPlayer() {
    const sLayer = $("staff-layer");
    const pLayer = $("player-layer");
    if (!sLayer || !pLayer) return;
    const outfit = outfitById(state.outfitEquipped) || OUTFITS[0];
    let playerEl = pLayer.querySelector(".actor.player");
    if (!playerEl) {
      playerEl = document.createElement("button");
      playerEl.type = "button";
      playerEl.dataset.tap = "player";
      playerEl.dataset.testid = "player";
      playerEl.innerHTML = '<div class="chef-hat"></div>' + bakerChibi() + '<div class="shadow"></div><span class="upgrade-dot hidden" data-dot="player"></span>';
      pLayer.appendChild(playerEl);
    }
    playerEl.dataset.baseClass = "actor player " + (outfit.look || "outfit-pink");
    placeActor(playerEl, player, playerEl.dataset.baseClass);

    const meta = {
      cashier: { hair: "#3b241f", hat: false },
      cook: { hair: "#6b3f2a", hat: true },
      server: { hair: "#c45c26", hat: false }
    };
    for (const role of ["cashier", "cook", "server"]) {
      let el = sLayer.querySelector(".actor." + role);
      if (!staffActors[role].present) {
        if (el) el.remove();
        continue;
      }
      if (!el) {
        el = document.createElement("div");
        el.dataset.testid = "staff-" + role;
        el.innerHTML = (meta[role].hat ? '<div class="chef-hat"></div>' : "") + bakerChibi("", meta[role].hair) + '<div class="shadow"></div>';
        sLayer.appendChild(el);
      }
      el.dataset.baseClass = "actor " + role;
      placeActor(el, staffActors[role], el.dataset.baseClass);
    }
  }

  function updateActors() {
    updateCustomers();
    renderStaffAndPlayer();
  }


  function renderOvens(rebuild) {
    const row = $("ovens-row");
    if (!row) return;
    const loc = currentLocation();
    const showSlot = state.ovens < loc.maxOvens && ovenSlotCost() != null;
    const want = ovens.length + (showSlot ? 1 : 0);
    if (rebuild || row.querySelectorAll(".oven, .oven-slot").length !== want) {
      const ovensHtml = ovens.map((_, i) =>
        '<button type="button" class="oven" data-oven="' + i + '" data-testid="oven">' +
        '<div class="oven-hood"></div>' +
        '<div class="oven-steam" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="oven-window"><span class="oven-good"></span></div>' +
        '<div class="oven-bar"><div class="oven-bar-fill"></div></div>' +
        '<div class="oven-label">Oven</div>' +
        '<span class="upgrade-dot hidden" data-dot="oven"></span>' +
        "</button>"
      ).join("");
      const slotHtml = showSlot
        ? '<button type="button" class="oven-slot" data-testid="oven-slot" data-tap="oven-slot"><span>＋</span><span>New oven</span><span class="upgrade-dot hidden" data-dot="oven"></span></button>'
        : "";
      row.innerHTML = ovensHtml + slotHtml;
      row.querySelectorAll(".oven").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onOvenTap(Number(btn.dataset.oven));
        });
      });
      const slotBtn = row.querySelector(".oven-slot");
      if (slotBtn) slotBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openSheet("oven", { slot: true });
      });
    }
    ovens.forEach((oven, i) => {
      const el = row.querySelector('[data-oven="' + i + '"]');
      if (!el) return;
      const job = oven.job;
      const good = job ? goodById(job.goodId) : null;
      const done = job && job.progress >= job.duration;
      const baking = job && !done;
      el.className = "oven" + (baking ? " baking" : "") + (done ? " ready" : "");
      el.querySelector(".oven-good").textContent = good ? good.emoji : "";
      const fill = el.querySelector(".oven-bar-fill");
      fill.style.width = job ? (Math.min(100, (job.progress / job.duration) * 100) + "%") : "0%";
      el.querySelector(".oven-label").textContent = done ? "Ready!" : baking ? "Baking..." : pendingOrders.length ? "Tap to bake" : "Oven";
    });
  }

  function renderTickets() {
    const rail = $("ticket-rail");
    if (!rail) return;
    const tickets = pendingOrders.map((o) => ({ order: o, ready: false })).concat(
      ovens.filter((o) => o.job && o.job.progress >= o.job.duration).map((o) => ({ order: o.job, ready: true }))
    );
    rail.innerHTML = tickets.map((t, i) => {
      const g = goodById(t.order.goodId);
      return '<button type="button" class="ticket' + (t.ready ? " ready" : "") + '" data-ticket="' + i + '" data-ready="' + (t.ready ? "1" : "0") + '" data-cid="' + t.order.customerId + '">' + g.emoji + "</button>";
    }).join("");
    rail.querySelectorAll(".ticket").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const ready = btn.dataset.ready === "1";
        const cid = Number(btn.dataset.cid);
        if (ready) {
          const c = customers.find((x) => x.id === cid) || customers.find((x) => x.status === "ready");
          if (c) commandPlayer({ type: "serve", customerId: c.id });
          else commandPlayer({ type: "serve" });
        } else if (pendingOrders.length) {
          const idx = ovens.findIndex((o) => !o.job);
          if (idx >= 0) commandPlayer({ type: "bake", ovenIndex: idx, customerId: cid });
        }
      });
    });
  }

  function renderMove() {
    const loc = currentLocation();
    const next = nextLocation();
    const card = $("move-card");
    if (!card) return;
    if (!next) {
      card.innerHTML =
        '<div class="prestige-hero" style="font-size:2rem">' + loc.emoji + "</div>" +
        "<h2>" + loc.name + "</h2>" +
        '<p class="lede">This is the grandest Honeycrust location — for now. Enjoy the view from the top.</p>' +
        '<div class="prestige-stats">' +
        '<div><span class="label">Bonus</span><strong>' + loc.multiplier.toFixed(2) + "×</strong></div>" +
        '<div><span class="label">Ovens</span><strong>' + loc.maxOvens + "</strong></div>" +
        '<div><span class="label">This shop</span><strong>' + formatNumber(state.runCoins) + "</strong></div>" +
        "</div>" +
        '<p class="maxed-note">You\'ve reached the current last location.</p>';
      return;
    }
    const remain = Math.max(0, next.cost - state.runCoins);
    const ready = canMove();
    const pct = Math.min(100, (state.runCoins / next.cost) * 100);
    card.innerHTML =
      "<h2>" + next.emoji + " Move to the " + next.name + "</h2>" +
      '<p class="lede">Bigger kitchen, new menu items, and a permanent bonus.</p>' +
      '<div class="prestige-stats">' +
      '<div><span class="label">Current</span><strong>' + loc.emoji + " " + loc.multiplier.toFixed(2) + "×</strong></div>" +
      '<div><span class="label">After move</span><strong>' + next.emoji + " " + next.multiplier.toFixed(2) + "×</strong></div>" +
      '<div><span class="label">This shop</span><strong>' + formatNumber(state.runCoins) + "</strong></div>" +
      "</div>" +
      '<div class="preview-box">' +
      (ready
        ? "Ready! " + next.maxOvens + " oven slots and a line of " + next.maxQueue + " at the " + next.name + "."
        : "Earn " + formatNumber(remain) + " more this shop to move (goal " + formatNumber(next.cost) + ").") +
      '<div class="milestone" style="margin-top:8px;height:8px;background:#f3e2c4;border-radius:999px;overflow:hidden">' +
      '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#a8d5c2,#7ec9a8);border-radius:999px"></div></div></div>' +
      '<div class="keep-reset">' +
      '<div class="keep"><strong>You keep</strong>Location bonus, gems, achievements, unlocked looks, and outfits.</div>' +
      '<div class="reset"><strong>This resets</strong>Coins, ovens, staff, aroma, quality, and menu unlocks.</div>' +
      "</div>" +
      '<button type="button" id="move-btn" class="primary-btn" data-testid="move-btn"' + (ready ? "" : " disabled") + ">" +
      (ready ? "Move to the " + next.name : "Keep baking") + "</button>";
    const btn = $("move-btn");
    if (btn) btn.addEventListener("click", confirmMove);
  }

  function renderBonus() {
    const now = Date.now();
    const offlineBtn = $("ad-offline-btn");
    const boostBtn = $("ad-boost-btn");
    if (!offlineBtn || !boostBtn) return;
    const offCd = (state.adCooldownUntil.offline || 0) - now;
    const boostCd = (state.adCooldownUntil.boost || 0) - now;
    if (state.doubleNextOffline) {
      offlineBtn.disabled = true;
      offlineBtn.textContent = "Ready for next return";
    } else if (offCd > 0) {
      offlineBtn.disabled = true;
      offlineBtn.textContent = "Ready in " + formatTime(offCd);
    } else {
      offlineBtn.disabled = false;
      offlineBtn.textContent = "Watch ad";
    }
    if (boostCd > 0) {
      boostBtn.disabled = true;
      boostBtn.textContent = "Ready in " + formatTime(boostCd);
    } else {
      boostBtn.disabled = false;
      boostBtn.textContent = "Watch ad";
    }
    document.querySelectorAll(".skip-btn").forEach((btn) => {
      const cost = Number(btn.dataset.cost);
      btn.disabled = state.gems < cost;
      btn.textContent = cost + " 💎";
    });
  }

  function setScreen(name) {
    if (name === "settings") {
      showSettings();
      return;
    }
    currentScreen = name;
    closeSheet();
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.screen === name);
    });
    const move = $("screen-move");
    const bonus = $("screen-bonus");
    if (move) move.classList.toggle("hidden", name !== "move");
    if (bonus) bonus.classList.toggle("hidden", name !== "bonus");
    if (name === "move") renderMove();
    if (name === "bonus") renderBonus();
  }

  function renderAll() {
    renderHeader();
    renderOvens();
    renderTickets();
    updateActors();
    renderMenuPreview();
    applyLocationClass();
    if (currentScreen === "move") renderMove();
    if (currentScreen === "bonus") renderBonus();
    if (sheetOpen) renderSheet();
    uiDirty = false;
  }

  function showWelcomeBack(info) {
    const canDoubleAd = !info.doubled && Date.now() >= (state.adCooldownUntil.offline || 0);
    showModal(
      '<div class="modal" role="dialog" aria-labelledby="wb-title">' +
      '<p class="tiny-tag">Welcome back</p>' +
      '<h2 id="wb-title">The ovens stayed warm</h2>' +
      "<p>You were away for " + formatTime(info.elapsed) + (info.cappedHit ? " (capped at 8 hours)" : "") + ".</p>" +
      '<div class="big">+' + formatNumber(info.earned) + " coins</div>" +
      (info.doubled ? "<p>Your double-offline bonus was applied.</p>" : "") +
      '<div class="modal-actions">' +
      (canDoubleAd ? '<button type="button" class="primary-btn" id="wb-double">Watch ad: double it <span class="tiny-tag">Placeholder</span></button>' : "") +
      '<button type="button" class="ghost-btn" id="wb-collect">Collect</button>' +
      "</div></div>"
    );
    $("wb-collect").addEventListener("click", closeModal);
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
          fill.style.width = (p * 100) + "%";
          if (p < 1) requestAnimationFrame(step);
          else {
            overlay.classList.add("hidden");
            adBusy = false;
            state.adCooldownUntil.offline = Date.now() + AD_COOLDOWN_MS;
            addCoins(info.earned);
            save();
            renderHeader();
            closeModal();
            toast("Doubled! +" + formatNumber(info.earned) + " extra coins.");
          }
        };
        requestAnimationFrame(step);
      });
    }
  }

  function showSettings() {
    showModal(
      '<div class="modal" role="dialog" aria-labelledby="set-title">' +
      '<h2 id="set-title">Bakery settings</h2>' +
      "<p>Progress is saved automatically on this device.</p>" +
      '<div class="settings-list">' +
      '<button type="button" class="danger-btn" id="reset-save-btn">Reset save</button>' +
      '<button type="button" class="ghost-btn" id="close-settings">Close</button>' +
      "</div>" +
      '<p class="fine-print">Resetting erases coins, upgrades, locations, and gems on this device. Unlocked looks from this save will be lost too.</p>' +
      "</div>"
    );
    $("close-settings").addEventListener("click", closeModal);
    $("reset-save-btn").addEventListener("click", () => {
      showModal(
        '<div class="modal" role="dialog" aria-labelledby="rst-title">' +
        '<h2 id="rst-title">Reset this bakery?</h2>' +
        "<p>This cannot be undone. All progress on this device will be lost.</p>" +
        '<div class="modal-actions">' +
        '<button type="button" class="danger-btn" id="confirm-reset">Yes, start over</button>' +
        '<button type="button" class="ghost-btn" id="cancel-reset">Cancel</button>' +
        "</div></div>"
      );
      $("cancel-reset").addEventListener("click", closeModal);
      $("confirm-reset").addEventListener("click", () => {
        closeModal();
        resetSave();
      });
    });
  }

  function showFirstTip() {
    if (state.seenTip && !migratedFromV2) return;
    const extra = migratedFromV2
      ? "<p>Your bakery is still here — the shop now has a new overhead layout. Tap ovens, the register, and decor right in the room to upgrade.</p>"
      : (hadOldSave ? "<p>This is a new version of Honeycrust with a real shop floor. It starts a fresh bakery (your old save is left untouched).</p>" : "");
    state.seenTip = true;
    showModal(
      '<div class="modal" role="dialog" aria-labelledby="tip-title">' +
      '<h2 id="tip-title">Welcome to Honeycrust</h2>' +
      "<p>Customers come in through the door at the top and walk down to the counter. Tap them to take an order, tap an oven to bake, then serve for coins.</p>" +
      extra +
      "<p>You work faster than hired staff. Tap furniture in the shop to upgrade, or tap yourself to change outfits. Ads are optional bonuses — never forced.</p>" +
      '<div class="modal-actions">' +
      '<button type="button" class="primary-btn" id="tip-ok">Let\'s bake</button>' +
      "</div></div>"
    );
    $("tip-ok").addEventListener("click", () => {
      closeModal();
      save();
    });
  }

  function confirmMove() {
    const next = nextLocation();
    if (!next || !canMove()) return;
    const loc = currentLocation();
    showModal(
      '<div class="modal" role="dialog" aria-labelledby="mv-title">' +
      '<h2 id="mv-title">Move to the ' + next.name + '?</h2>' +
      "<p>You'll pack up this shop and start over in a bigger space, with a permanent " + next.multiplier.toFixed(2) + "× bonus.</p>" +
      '<div class="big">' + loc.emoji + " → " + next.emoji + "</div>" +
      '<div class="keep-reset">' +
      '<div class="keep"><strong>You keep</strong>Location bonus, gems, achievements, and every look or outfit you\'ve unlocked.</div>' +
      '<div class="reset"><strong>This resets</strong>Coins, ovens, staff, menu unlocks, and kitchen upgrades.</div>' +
      "</div>" +
      '<div class="modal-actions">' +
      '<button type="button" class="primary-btn" id="confirm-move">Pack up &amp; move</button>' +
      '<button type="button" class="ghost-btn" id="cancel-move">Stay here</button>' +
      "</div></div>"
    );
    $("cancel-move").addEventListener("click", closeModal);
    $("confirm-move").addEventListener("click", () => {
      closeModal();
      doMove();
    });
  }

  function handleSceneTap(target) {
    const hit = target.closest("[data-tap]");
    if (!hit) return;
    const key = hit.dataset.tap;
    if (key === "player") openSheet("player");
    else if (key === "register") openSheet("register");
    else if (key === "prep") openSheet("prep");
    else if (key === "pickup" || key === "counter") openSheet("counter");
    else if (key === "menu") openSheet("menu");
    else if (key === "sign") openSheet("sign");
    else if (key === "door") openSheet("door");
    else if (key === "oven-slot") openSheet("oven", { slot: true });
    else if (key && key.startsWith("decor:")) openSheet("decor", { cat: key.slice(6) });
  }

  function bind() {
    bindSheetRoot();
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => setScreen(btn.dataset.screen));
    });
    $("ad-offline-btn").addEventListener("click", () => watchAd("offline"));
    $("ad-boost-btn").addEventListener("click", () => watchAd("boost"));
    $("screen-bonus").addEventListener("click", (ev) => {
      const btn = ev.target.closest(".skip-btn");
      if (!btn) return;
      applyTimeSkip(Number(btn.dataset.hours));
    });
    $("scene").addEventListener("click", (ev) => handleSceneTap(ev.target));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        save();
      } else {
        const info = processOffline();
        clearFloor();
        syncStaffPresence();
        renderOvens(true);
        if (info) showWelcomeBack(info);
        renderAll();
      }
    });
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (modalOpen) closeModal();
        else if (sheetOpen) closeSheet();
        else if (currentScreen !== "shop") setScreen("shop");
      }
    });
  }

  let lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.25, (ts - lastTs) / 1000);
    lastTs = ts;
    if (!document.hidden && !modalOpen && !frozen) {
      tickFloor(dt);
      state.lastTick = Date.now();
    }
    updateActors();
    if (ts - lastUi > 80) {
      renderHeader();
      renderOvens();
      if (ts - lastUi > 250) renderTickets();
      if (currentScreen === "bonus") renderBonus();
      if (currentScreen === "move" && ts - lastUi > 400) renderMove();
      uiDirty = false;
      lastUi = ts;
    }
    requestAnimationFrame(loop);
  }

  function injectLateGame() {
    state.coins = 28000;
    state.runCoins = 45000;
    state.lifetimeCoins = 45000;
    state.ovens = 2;
    state.ovenSpeedLevel = 4;
    state.qualityLevel = 3;
    state.aromaLevel = 3;
    state.staff = { cashier: 2, cook: 2, server: 2 };
    state.unlockedGoods = ["bread", "croissant", "muffin", "cupcake"];
    if (!state.outfitsOwned.includes("of_mint")) state.outfitsOwned.push("of_mint");
    if (!state.outfitsOwned.includes("of_chef")) state.outfitsOwned.push("of_chef");
    state.outfitEquipped = "of_chef";
    ["wallpaper", "floor", "counter", "tables", "sign", "plants", "lights"].forEach((cat) => {
      const next = DECOR[cat].find((i) => !i.achievement && !i.starter);
      if (next && !state.decorOwned[cat].includes(next.id)) state.decorOwned[cat].push(next.id);
    });
    checkAchievements();
    clearFloor();
    syncOvenCount();
    syncStaffPresence();
    spawnCustomer("croissant");
    spawnCustomer("muffin");
    spawnCustomer("bread");
    customers.forEach((c, i) => {
      c.status = "waiting";
      c.walking = false;
      const dest = slotPos(i, customers.length);
      c.x = dest.x; c.y = dest.y;
    });
    takeOrder(customers[0]);
    startBake(0, pendingOrders[0]);
    ovens[0].job.progress = ovens[0].job.duration;
    markReadyOvens();
    const c0 = customers[0];
    staffActors.cashier.x = c0.x; staffActors.cashier.y = WORK_Y; staffActors.cashier.walking = false; staffActors.cashier.task = null;
    staffActors.cook.x = 76; staffActors.cook.y = 86; staffActors.cook.walking = false; staffActors.cook.task = null;
    staffActors.server.x = 68; staffActors.server.y = 68; staffActors.server.walking = false; staffActors.server.task = { type: "serve", customerId: c0.id };
    player.x = 50; player.y = 91; player.walking = false; player.task = null; player.face = "up";
    displayedCoins = state.coins;
    applyDecorLooks();
    renderOvens(true);
    uiDirty = true;
    renderAll();
    return true;
  }

  function init() {
    const loaded = load();
    syncOvenCount();
    syncStaffPresence();
    bind();
    applyLocationClass();
    applyDecorLooks();
    renderOvens(true);
    renderMenuPreview();
    const info = processOffline();
    renderAll();
    if (info) showWelcomeBack(info);
    else if (!loaded || !state.seenTip || migratedFromV2) showFirstTip();
    setInterval(save, SAVE_INTERVAL_MS);
    requestAnimationFrame(loop);

    window.BakeryIdle = {
      getState: () => ({
        coins: state.coins,
        gems: state.gems,
        runCoins: state.runCoins,
        lifetimeCoins: state.lifetimeCoins,
        locationIndex: state.locationIndex,
        ovens: state.ovens,
        ovenSpeedLevel: state.ovenSpeedLevel,
        qualityLevel: state.qualityLevel,
        aromaLevel: state.aromaLevel,
        staff: Object.assign({}, state.staff),
        unlockedGoods: state.unlockedGoods.slice(),
        decorOwned: state.decorOwned,
        decorEquipped: Object.assign({}, state.decorEquipped),
        outfitsOwned: (state.outfitsOwned || []).slice(),
        outfitEquipped: state.outfitEquipped,
        achievements: Object.assign({}, state.achievements),
        served: state.served,
        cps: automatedCps(),
        customers: customers.map((c) => ({ id: c.id, status: c.status, goodId: c.goodId, x: c.x, y: c.y, slot: c.slot, area: c.area || "counter", walking: !!c.walking })),
        pendingOrders: pendingOrders.slice(),
        ovenJobs: ovens.map((o) => o.job ? Object.assign({}, o.job) : null),
        player: { x: player.x, y: player.y, walking: player.walking, task: player.task }
      }),
      formatNumber,
      save,
      load,
      debug: {
        setCoins(n) { state.coins = n; displayedCoins = n; uiDirty = true; renderAll(); },
        setRunCoins(n) { state.runCoins = n; uiDirty = true; renderAll(); },
        spawnCustomer(goodId) { const c = spawnCustomer(goodId); updateActors(); return c && c.id; },
        takeFirst() {
          const c = customers.find((x) => x.status === "waiting");
          return c ? takeOrder(c) : false;
        },
        startBake() { return startBakeForOrder(pendingOrders[0]); },
        finishBakes() {
          for (const o of ovens) { if (o.job) o.job.progress = o.job.duration; }
          markReadyOvens();
          renderOvens();
          updateActors();
        },
        deliverReady() {
          const o = ovens.find((x) => x.job && x.job.progress >= x.job.duration);
          return o ? deliverOven(o) : false;
        },
        setStaff(obj) { Object.assign(state.staff, obj); syncStaffPresence(); checkAchievements(); uiDirty = true; renderAll(); },
        unlockDecor(cat, id) {
          if (!state.decorOwned[cat].includes(id)) state.decorOwned[cat].push(id);
          applyDecorLooks();
          uiDirty = true;
          renderAll();
        },
        setOutfit(id) {
          if (!state.outfitsOwned.includes(id)) state.outfitsOwned.push(id);
          state.outfitEquipped = id;
          uiDirty = true;
          renderAll();
        },
        tick(seconds) {
          const step = 0.1;
          for (let t = 0; t < seconds; t += step) tickFloor(step);
          renderAll();
        },
        openSheet,
        closeSheet,
        closeModal,
        setScreen,
        lateGame: injectLateGame,
        freeze(on) { frozen = !!on; },
        resetSave
      }
    };
  }

  init();
})();
