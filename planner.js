/* Second Seam goal planner.

   The math follows Das, Ostrov, Radhakrishnan & Srivastav, "Dynamic Optimization
   for Multi-Goals Wealth Management," Journal of Banking & Finance 140 (2022).
   Section and equation numbers below refer to that paper.

   Paper                                  Here
   ------------------------------------   ------------------------------------------
   wealth W on a grid                     clothing budget b, on a $1 grid
   infusion I(t)                          weekly allowance A
   goal with cost c and utility u         wardrobe goal with expected cost and importance
   partial goal                           settling for the synthetic version (u x partial share)
   cost/utility vectors c(t), u(t), §2.3  every set of purchases possible this week, pruned
   portfolio l on the efficient frontier  hunting strategy l: wider search finds more, costs more
   market randomness (GBM, eq. 3)         whether a matching piece turns up this week
   Bellman equation (4)                   V(t,b,f) = max_l E[ max_k u_k + V(t+1, b - c_k + A, f') ]
   forwards equation (5)                  exact probability mass over (b, f) each week
   P(goal), expected utility fraction     chance each goal is filled by its deadline

   One change from the paper: the state also carries f, a bitmask of goals already
   filled. With a handful of goals that is cheap, and it lets a goal skipped this week
   be bought next week, which the paper's backward method cannot do (its §1 calls this
   the method's main limitation). Because f is part of the state, the §2.3 pruning is
   applied within each group of purchase sets that leave the closet in the same state.

   Works in the browser (window.SeamPlanner) and in Node (module.exports). */
(function (root) {
  'use strict';

  const WEEKS = 12;
  const MAX_B = 400;

  // Hunting strategies, ordered like portfolios on the efficient frontier:
  // each step up finds more (higher "return") and costs more per piece (shipping).
  // reach = how many weeks' worth of racks one week of searching covers, so the
  // weekly find chance becomes 1 - (1 - p)^reach.
  const STRATEGIES = [
    { id: 'racks', name: 'Local racks', short: 'Racks', reach: 1, ship: 0, blurb: 'Thrift stores near you. No shipping, but you take what turns up.' },
    { id: 'saved', name: 'Racks plus saved searches', short: 'Saved searches', reach: 1.7, ship: 6, blurb: 'Add eBay and Etsy alerts for your sizes. About $6 shipping a piece.' },
    { id: 'wide', name: 'Cast a wide net', short: 'Wide net', reach: 2.6, ship: 12, blurb: 'Every resale site, any distance. Finds the most, about $12 shipping a piece.' }
  ];

  const findChance = (p, reach) => (p >= 1 ? 1 : 1 - Math.pow(1 - p, reach));

  function prepGoals(goals, strategies) {
    return goals.map((g) => ({
      ...g,
      byL: strategies.map((s) => ({
        pn: g.newOnly ? g.nat.p : findChance(g.nat.p, s.reach),
        ps: g.syn ? findChance(g.syn.p, s.reach) : 0,
        cn: g.nat.cost + (g.newOnly ? 0 : s.ship),
        cs: g.syn ? g.syn.cost + s.ship : Infinity
      }))
    }));
  }

  // §2.3: list every combination of purchases, sort by total cost, keep the best
  // utility at each cost, then drop any column a cheaper column already matches.
  function paperPrune(cols) {
    const sorted = [...cols].sort((a, b) => a.c - b.c || b.u - a.u);
    const dedup = [];
    sorted.forEach((x) => { if (!dedup.length || dedup[dedup.length - 1].c !== x.c) dedup.push(x); });
    const pruned = [];
    dedup.forEach((x) => { if (!pruned.length || x.u > pruned[pruned.length - 1].u + 1e-9) pruned.push(x); });
    return { sorted, dedup, pruned };
  }

  function allCombos(G, f, seen, l, partial) {
    let opts = [{ c: 0, u: 0, f2: f, picks: [] }];
    for (let i = 0; i < G.length; i++) {
      if ((f >> i) & 1 || !seen[i]) continue;
      const g = G[i].byL[l];
      const add = [];
      opts.forEach((o) => {
        if (seen[i] & 1) add.push({ c: o.c + g.cn, u: o.u + G[i].imp, f2: o.f2 | (1 << i), picks: o.picks.concat([[i, 'n']]) });
        if (seen[i] & 2) add.push({ c: o.c + g.cs, u: o.u + G[i].imp * partial, f2: o.f2 | (1 << i), picks: o.picks.concat([[i, 's']]) });
      });
      opts = opts.concat(add);
    }
    return opts;
  }

  function solve(opts) {
    const strategies = opts.strategies || STRATEGIES;
    const T = opts.weeks || WEEKS;
    const maxB = opts.maxB || MAX_B;
    const partial = opts.partial;
    const A = Math.max(0, Math.round(opts.allow));
    const b0 = Math.max(0, Math.min(maxB, Math.round(opts.start)));
    const G = prepGoals(opts.goals, strategies);
    const n = G.length;
    const F = 1 << n;
    const L = strategies.length;
    const t0 = Date.now();

    // outcomes(t, f, l): what can turn up this week, with probabilities.
    // seen[i] bits: 1 = natural version turned up, 2 = synthetic version turned up.
    const outCache = new Map();
    function outcomes(t, f, l) {
      const key = (t * F + f) * L + l;
      let list = outCache.get(key);
      if (list) return list;
      list = [{ seen: new Array(n).fill(0), p: 1 }];
      for (let i = 0; i < n; i++) {
        const g = G[i];
        if ((f >> i) & 1 || t < g.start || t > g.end) continue;
        const { pn, ps } = g.byL[l];
        const states = [[0, (1 - pn) * (1 - ps)], [1, pn * (1 - ps)], [2, (1 - pn) * ps], [3, pn * ps]].filter((s) => s[1] > 0);
        const next = [];
        list.forEach((o) => states.forEach(([s, q]) => { const seen = o.seen.slice(); seen[i] = s; next.push({ seen, p: o.p * q }); }));
        list = next;
      }
      list.forEach((o) => { o.key = o.seen.join(''); });
      outCache.set(key, list);
      return list;
    }

    // actions(f, seen, l): the cost/utility vector for this week, pruned per §2.3
    // inside each group that ends in the same closet state f'.
    const actCache = new Map();
    function actions(f, seenKey, seen, l) {
      const key = `${f}|${l}|${seenKey}`;
      let acts = actCache.get(key);
      if (acts) return acts;
      const byF = new Map();
      allCombos(G, f, seen, l, partial).forEach((o) => { if (!byF.has(o.f2)) byF.set(o.f2, []); byF.get(o.f2).push(o); });
      acts = [];
      byF.forEach((cols) => { acts.push(...paperPrune(cols).pruned); });
      acts.sort((a, b) => a.c - b.c);
      actCache.set(key, acts);
      return acts;
    }

    const size = (T + 2) * (maxB + 1) * F;
    const Vm = new Float64Array(size).fill(NaN);
    const Lm = new Int8Array(size).fill(-1);
    const idx = (t, b, f) => (t * (maxB + 1) + b) * F + f;
    const nextB = (b, c) => Math.min(b - c + A, maxB);
    let states = 0;
    const tieL = 1e-3 * G.reduce((s, g) => s + g.imp, 0);

    // Best purchase k this week given what turned up (inner max of eq. 4).
    function bestK(t, b, f, o, l) {
      const acts = actions(f, o.key, o.seen, l);
      let best = acts[0]; let bv = -Infinity;
      for (let k = 0; k < acts.length; k++) {
        const a = acts[k];
        if (a.c > b) break;
        const v = a.u + V(t + 1, nextB(b, a.c), a.f2);
        if (v > bv + 1e-12) { bv = v; best = a; }
      }
      return { a: best, v: bv };
    }

    // Bellman equation (4): V(t,b,f) = max over l of the expected value of the best k.
    function V(t, b, f) {
      if (t > T) return 0; // no bequest: leftover budget at the horizon carries no utility
      const i = idx(t, b, f);
      const hit = Vm[i];
      if (hit === hit) return hit;
      states++;
      let best = -Infinity; let bestL = 0;
      for (let l = 0; l < L; l++) {
        let q = 0;
        const outs = outcomes(t, f, l);
        for (let j = 0; j < outs.length; j++) q += outs[j].p * bestK(t, b, f, outs[j], l).v;
        // A wider search has to earn its keep: near-ties go to the simpler strategy.
        if (q > best + tieL) { best = q; bestL = l; }
      }
      Vm[i] = best; Lm[i] = bestL;
      return best;
    }

    const EU = V(1, b0, 0);

    // Forwards equation (5): push probability mass through the optimal policy.
    const hits = G.map(() => ({ n: 0, s: 0, wk: 0, byWeek: new Array(T + 1).fill(0) }));
    const budgetDist = [];   // budgetDist[t] = Map b -> probability at the start of week t
    const maskDist = [];     // maskDist[t] = Map f -> probability
    const stratUse = [];     // stratUse[t][l] = probability strategy l is used in week t
    const spendByWeek = new Array(T + 1).fill(0);
    let dist = new Map([[b0 * F, 1]]);
    for (let t = 1; t <= T; t++) {
      const bd = new Map(); const md = new Map(); const su = new Array(L).fill(0);
      const nd = new Map();
      dist.forEach((p, key) => {
        const b = Math.floor(key / F); const f = key % F;
        bd.set(b, (bd.get(b) || 0) + p);
        md.set(f, (md.get(f) || 0) + p);
        V(t, b, f);
        const l = Lm[idx(t, b, f)];
        su[l] += p;
        outcomes(t, f, l).forEach((o) => {
          const { a } = bestK(t, b, f, o, l);
          const q = p * o.p;
          a.picks.forEach(([gi, kind]) => { hits[gi][kind] += q; hits[gi].wk += q * t; hits[gi].byWeek[t] += q; });
          spendByWeek[t] += q * a.c;
          const nk = nextB(b, a.c) * F + a.f2;
          nd.set(nk, (nd.get(nk) || 0) + q);
        });
      });
      budgetDist[t] = bd; maskDist[t] = md; stratUse[t] = su;
      dist = nd;
    }
    budgetDist[T + 1] = new Map(); maskDist[T + 1] = new Map();
    dist.forEach((p, key) => {
      const b = Math.floor(key / F); const f = key % F;
      budgetDist[T + 1].set(b, (budgetDist[T + 1].get(b) || 0) + p);
      maskDist[T + 1].set(f, (maskDist[T + 1].get(f) || 0) + p);
    });

    const goalsOut = hits.map((h, i) => ({
      nat: h.n, syn: h.s, total: h.n + h.s,
      week: h.n + h.s > 1e-9 ? h.wk / (h.n + h.s) : null,
      byWeek: h.byWeek,
      utility: G[i].imp * h.n + G[i].imp * partial * h.s
    }));
    const maxU = G.reduce((s, g) => s + g.imp, 0);

    // Most likely closet state at the start of week t.
    const modeMask = (t) => { let bf = 0; let bp = -1; (maskDist[t] || new Map()).forEach((p, f) => { if (p > bp) { bp = p; bf = f; } }); return bf; };

    return {
      goals: goalsOut,
      EU,
      maxU,
      fraction: maxU > 0 ? EU / maxU : 0,
      budgetDist, maskDist, stratUse, spendByWeek,
      states,
      ms: Date.now() - t0,
      T, maxB, A, b0, F, strategies, partial,
      modeMask,
      // Policy lookups for the charts (they reuse the memo, so they are cheap).
      policyL(t, b, f) { V(t, b, f); return Lm[idx(t, b, f)]; },
      value(t, b, f) { return V(t, b, f); },
      // §4.1.3: for a given week, closet state and set of finds, the best move at every budget.
      bands(t, f, seen, l, bMax) {
        const key = seen.join('');
        const out = [];
        for (let b = 0; b <= bMax; b++) {
          const { a } = bestK(t, b, f, { seen, key }, l);
          const label = a.picks.map(([i, k]) => `${i}${k}`).join(',');
          const last = out[out.length - 1];
          if (last && last.label === label) last.to = b;
          else out.push({ from: b, to: b, label, picks: a.picks, c: a.c });
        }
        return out;
      },
      vector(f, seen, l) { return actions(f, seen.join(''), seen, l); }
    };
  }

  // The full §2.3 table for one week, for the Method page.
  function vectorTable(goals, seen, l, partial, strategies) {
    const G = prepGoals(goals, strategies || STRATEGIES);
    const all = allCombos(G, 0, seen, l, partial);
    const { sorted, dedup, pruned } = paperPrune(all);
    return { all, sorted, dedup, pruned };
  }

  // §4.2.1: the human-in-the-loop utility search, automated. Raise the utility of any
  // goal below its target, lower the utility of any goal comfortably above it,
  // re-solve, repeat. Only ratios matter, so utilities are rescaled to top out at 10.
  function tune(base, targets, maxRuns) {
    const runs = [];
    let imps = base.goals.map((g) => g.imp);
    const runsMax = maxRuns || 10;
    let best = null; let stale = 0;
    for (let r = 0; r < runsMax; r++) {
      const res = solve({ ...base, goals: base.goals.map((g, i) => ({ ...g, imp: imps[i] })) });
      const probs = res.goals.map((x) => x.total);
      const met = probs.map((p, i) => p >= targets[i] - 1e-9);
      const shortfall = probs.reduce((s, p, i) => s + Math.max(0, targets[i] - p), 0);
      runs.push({ imps: imps.slice(), probs, met, shortfall, EU: res.EU });
      if (!best || shortfall < best.shortfall - 1e-4) { best = runs[runs.length - 1]; stale = 0; } else stale++;
      if (met.every(Boolean)) break;
      if (!met.some(Boolean) && r > 0) break; // every goal short: utilities alone can't fix it
      if (stale >= 3) break;                  // three runs without progress: it's a money problem
      // Small, proportional steps: raise what's short, ease off what's well clear.
      const nextImps = imps.map((u, i) => {
        const gap = targets[i] - probs[i];
        if (gap > 0) return u * (1 + Math.min(0.5, Math.max(0.08, gap * 1.5)));
        if (gap < -0.1) return u * 0.93;
        return u;
      });
      const top = Math.max(...nextImps);
      imps = nextImps.map((u) => Math.max(0.5, Math.round((u / top) * 100) / 10));
    }
    return { runs, best };
  }

  // Smallest weekly top-up (whole dollars, up to limit) that meets every target.
  function minTopUp(base, targets, limit) {
    const cap = limit || 40;
    const ok = (extra) => solve({ ...base, allow: base.allow + extra }).goals.every((x, i) => x.total >= targets[i] - 1e-9);
    if (ok(0)) return 0;
    if (!ok(cap)) return null;
    let lo = 0; let hi = cap;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ok(mid)) hi = mid; else lo = mid; }
    return hi;
  }

  const api = { solve, tune, minTopUp, vectorTable, paperPrune, STRATEGIES, WEEKS, MAX_B, findChance };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SeamPlanner = api;
})(typeof window !== 'undefined' ? window : globalThis);
