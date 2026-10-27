# Second Seam — Interactive Prototype Spec (v2)

**Course:** CSEN 163 · Assignment 2, Interactive Prototype (due Thu 10/29/2026, 10:00 am)
**Format:** HTML/CSS/JS clickable website (counts as "embedded interactions" under Part A)
**One-line pitch:** Tell Second Seam your style, your measurements, and what's already in your closet. It finds thrifted clothes ranked by *the things you say matter* (natural fiber, style, fit, price, and more), plans which wardrobe goals to buy first on your budget, tells you when it's time for new underwear (bought new, never thrifted), and matches each find with a well-rated local tailor.

**What's new in v2**
- **Weighted priorities tool** (§5): rate 10 criteria by how much each matters, mark must-haves. The style↔fabric slider stays as the quick mode.
- **Wardrobe upload** (§6): photo, care tag, or quick-add. Drives gap-finding, "goes with N things you own," and replacement flags.
- **Underwear restock** (§7): flags worn or old underwear from your wardrobe and recommends new natural-fiber options.
- **Budget** (Screen 5, §5.5): amount to spend now and/or a weekly/monthly allowance, max per item, strict or flexible, optional envelopes (thrift / tailoring / underwear / other), spent-so-far meter. Every item is checked against it using its total cost including tailoring.
- **Goal plan** (§10.6): which wardrobe goals to fill first on your budget, with the chance of filling each by its deadline. Adapted from Das, Ostrov, Radhakrishnan & Srivastav (2022).

---

## 1. Problem and users

Thrifting natural-fiber clothing (wool, linen, cotton, silk) is cheap and sustainable, but it's slow. Fiber content is buried or missing, vintage sizes don't match modern ones, and good pieces in the wrong size get passed over because nobody tells you "a $15 hem makes this fit." People also buy duplicates of what they already own and put off replacing basics like underwear.

| Profile | Who | What they want |
|---|---|---|
| **Core: Fiber-first thrifter** | Cares about breathability, skin feel, microplastics, durability | Natural fibers only or almost only. Style is secondary. |
| **Core: Style-first thrifter** | Has a specific look in mind | The look comes first. Natural fiber is a bonus, not a filter. Will buy polyester if it's *the* piece. |
| **Core: Budget planner** | Fixed monthly clothing money | Wants to know what to buy first and whether the coat is still reachable if they buy the cute top. |
| **Extended: Alteration newbie** | Has never used a tailor | Needs to know what's alterable, what it costs, and who to trust. |
| **Extended: Closet organizer** | Wants to use what they own | Uploads their wardrobe, wants gaps and "goes with" counts, avoids duplicates. |
| **Extended: Accessibility-needs shopper** | Low vision, motor limits, or sensory/fabric sensitivities | Screen-reader-friendly results. Hard "never" fibers (e.g., wool itch, acrylic). Tailors with accessible storefronts. |

---

## 2. User flow (screens to build)

```
[1 Welcome] → [2 Style quiz] → [3 Measurements] → [4 My wardrobe] → [5 Budget] → [6 Priorities]
      → [7 Goals & plan] → [8 Results feed] ⇄ [9 Item detail + Fit check] → [10 Tailor match]
                                    ↘ [11 Underwear restock]
      → [12 Saved / Plan]
```

### Screen 1: Welcome
- Headline, one sentence on what the app does, **Start** button.
- "Skip setup, just browse" link (extended users can explore first).

### Screen 2: Style quiz (asks the user's style)
- **Pick-what-you-like grid:** 12 outfit image tiles, multi-select. Tags behind each tile: `minimal`, `workwear`, `cottagecore`, `90s`, `tailored`, `streetwear`, `boho`, `preppy`, `utility`, `romantic`, `athleisure`, `vintage-70s`.
- **Garment types wanted:** chips for tops, knitwear, trousers, jeans, skirts, dresses, outerwear, suiting.
- **Colors:** palette chips plus "no preference."
- **Free text (optional):** "Describe a piece you're hunting for," e.g., *"oversized cream fisherman sweater."*
- **Brands you like (optional):** helps style match and size calibration.
- Output: a `styleProfile` tag vector (see §10.1).

### Screen 3: Measurements (asks the user's measurements)
- Units toggle **in / cm**.
- Fields: height, bust/chest, waist, hips, inseam, shoulder width, sleeve length (shoulder seam to wrist). Optional underwear size for §7.
- Each field has a **"How to measure"** expander with a line-drawing diagram and one sentence of instruction.
- **Fit preference per garment type:** fitted / regular / relaxed / oversized. This sets the *ease*, the extra room added on top of body measurements.
- **Fallback:** "I don't know my measurements" → enter usual size in 2–3 brands you own and get estimates, flagged "estimated."
- **Shortcut from wardrobe:** "Measure a piece that fits you well" → lay a favorite pair of trousers flat, enter waist/inseam. Garment measurements are often easier than body ones.
- Privacy note: "Measurements stay on this device." (In the prototype, store in JS memory only.)

### Screen 4: My wardrobe (upload what you have)
See §6 for the full logic.
- Three ways to add: **📷 Photo of the item**, **🏷️ Photo of the care tag** (reads fiber %), **✏️ Quick add** (type + color + fiber).
- Bulk option: "Snap your closet rail." Each item becomes a card to confirm/edit.
- Each item: type, color, fiber, style tags, condition (great / worn / needs repair), and optional "bought around" date.
- Summary strip at the top: *"42 items · 61% natural fiber · 3 gaps found · 1 item due for replacement."*
- Skippable: everything works without a wardrobe; you just lose the "goes with" and gap features.

### Screen 5: Budget (users put in their own budget)
See §5.5 for how the budget changes ranking and the plan.
- **How you budget:** pick one or both:
  - **Amount to spend now** (e.g., $150 for this season's shopping)
  - **Recurring clothing allowance**, per week or per month (e.g., $40/month)
- **Max per item** (optional), e.g., "nothing over $60."
- **"Count tailoring + shipping in the price"** toggle (on by default). Items are then compared to your budget by their *total* cost, not just the sticker price.
- **Strict or flexible:** *Strict* hides anything over budget. *Flexible* shows items up to 20% over, flagged "$8 over."
- **Envelopes (optional):** split the budget across **Thrift finds**, **Tailoring**, **Underwear (new)**, and **Other**, with a suggested split based on the user's goals. The parts always add up to the total. A labeled donut shows the split.
- **Spent so far:** a meter with spent / remaining. Marking an item "Bought" (or logging a tailor bill) subtracts it automatically.
- **"Saved vs. buying new"** counter: running total of thrift + tailoring vs. the "similar new item" price. Motivating, and it shows the point of the app.
- Skippable: with no budget entered, cost is still shown but doesn't affect ranking.

### Screen 6: Priorities (weighted tool)
Two modes, same screen. See §5.
- **Quick mode:** one Style ↔ Fabric slider with presets (Purist / Balanced / I want the look).
- **Advanced mode:** "How much does each matter to you?" 0–5 for 10 criteria, with a **must-have** lock on any criterion.
- Fiber dealbreakers, semi-synthetics toggle, stretch toggle.
- **"Total cost" importance is linked to the Budget screen:** locking it as a must-have is the same as choosing *Strict* there.
- **Live preview:** 3 sample items re-order in real time as any weight changes. This is the key interaction to demo.

### Screen 7: Goals & plan
See §10.6.
- Auto-suggested goals from wardrobe gaps and flags ("No warm coat," "Underwear due"). The user can add their own ("Linen trousers for spring").
- Each goal: **how much it matters** (1–10), deadline, and expected cost (thrift price + likely alterations).
- Budget comes from Screen 5: remaining amount now + recurring allowance (+ envelopes, if set). Editable here too.
- **"When can I afford it?"** under each goal: "Wool coat ($55 with sleeves): affordable in week 3 at your allowance."
- Output: **goal cards** showing the chance of filling each goal by its deadline (natural vs. settle-for-synthetic split), placed on a **timeline**.
- "What if" controls: raise budget, move a deadline, change a goal's importance. Cards update.

### Screen 8: Results feed
- Card per item: photo, title, price, source badge, **match %**, **fiber bar** (§9), and **"Goes with 4 things you own."**
- **Fit badge:** ✅ Fits as-is · ✂️ Fits with tailoring (~$X) · ⚠️ Hard to alter · ❌ Won't fit (hidden by default).
- **Goal tag:** "Fills: Winter coat goal." Plus a plan nudge when relevant: *"Buying this top lowers your wool-coat chance from 44% to 30%."* (illustrative copy; the real number comes from re-running the plan with the top's cost subtracted)
- **Duplicate warning:** "You already own 3 similar black tees."
- **Budget badge** on every card, based on total cost: 💵 *Within budget* · ⚠️ *$8 over* (flexible mode only) · ⏳ *Affordable in 2 weeks*. Plus a "Remaining after this: $42" line on hover/focus.
- Budget meter pinned at the top of the feed: "$108 of $150 left."
- Sort: Best match (default), Lowest total cost, Most natural, Newest.
- Filters drawer: garment type, source, price, **within budget only**, fit badge, "local pickup only," "fills a goal."
- **Per-item override:** ♥ "I'd buy it anyway." Pins the item regardless of fiber. Logged as implicit feedback (§10.4).
- "Why this rank?" opens a per-criterion breakdown that matches the user's own weights.

### Screen 9: Item detail + Fit check
- Photo carousel, seller's description, link to the original listing.
- **Fiber label**, styled like a nutrition-facts panel: composition, natural %, care notes ("Wool: hand wash cold, lay flat").
- **"Fiber not listed" state:** *Verify fiber* badge plus a pre-written question to the seller.
- **Fit check diagram:** garment outline with the user's measurements overlaid against the garment's. Green = OK, amber = alterable, red = not alterable. Text labels on every zone.
- **Alteration list** generated from the diff (hem 2.5 in, est. $15–$25; *cannot* let out shoulders ⚠️).
- **"Pairs with" strip:** thumbnails of the wardrobe items it goes with.
- **Total cost** = item + shipping + alteration estimate, compared to "similar new item" and to the user's budget ("Uses 23% of your remaining $150; tailoring uses $20 of your $30 tailoring envelope").
- CTA: **Find a tailor for this** → Screen 10.

### Screen 10: Tailor match
- Map + list of tailors near the user (default radius 10 mi, adjustable).
- Each card: name, distance, **adjusted rating** (§10.5), review count, hours today, phone, skill tags from reviews (`denim hems`, `dresses/bridal`, `suits`, `same-day`, `cash only`, `home-based`, `by appointment`).
- Tailors are **matched to the job** (jeans hem → denim/blind-stitch mentions rank higher).
- Default rule: **rating ≥ 4.5 and ≥ 10 reviews.** Toggle shows all.
- CTAs: **Call**, **Directions**, **Copy alteration list**.

### Screen 11: Underwear restock
See §7.
- Triggered by a wardrobe flag or opened from the menu.
- Banner: *"Underwear is the one thing we always recommend buying new."*
- Shows which pairs are flagged and why. Recommends new natural-fiber options ranked with the same priority weights and filtered by the **Underwear envelope** (or overall budget), with price per pair shown. Shows a recycling option for the old pairs.

### Screen 12: Saved / Plan
- Saved items grouped by "Buy & tailor," "Buy as-is," "Buy new (underwear)," "Maybe," each group with its subtotal and a grand total vs. budget.
- "Mark as bought" moves an item into the Spent meter.
- Week-by-week plan from §10.6: "Week 1: order underwear · Week 2–6: watch for wool coat under $55 · Drop coat at The Magic Sewing by Clarita for sleeves."

---

## 3. Data sources: finding thrift inventory responsibly

The prototype uses **mock data** (labeled "demo listings"). For a real build, use official APIs where they exist. Several big resale sites prohibit scraping in their terms, so the spec doesn't depend on it.

| Source | How to get items | Fiber data quality | Notes |
|---|---|---|---|
| **eBay** (pre-owned clothing) | Official **Browse API** `item_summary/search`. Supports `aspect_filter` on item specifics such as Material. | Good: "Material" is a structured item specific on many clothing listings | Category ID must appear twice (in `category_ids` and inside `aspect_filter`); one category per request. Example: `q=sweater&category_ids=<cat>&aspect_filter=categoryId:<cat>,Material:{Wool\|Cashmere}`. Use `fieldgroups=ASPECT_REFINEMENTS` to discover valid Material values. Supports distance sorting for local pickup. |
| **Etsy** (vintage) | Official Open API v3, active listings search | Medium: sellers can list materials, but it's free text | Good for vintage linen, silk, wool. |
| **ShopGoodwill** | Public site listings | Low/medium: usually in title/description | Check ToS before automating. Treat as "manual import" in the prototype. |
| **Poshmark / Depop / ThredUp / Vinted** | No open public API for search | ThredUp listings often state composition ("100% Linen") | Don't scrape. Use deep links ("Search ThredUp for *linen trousers*"). |
| **Local thrift stores** | No online inventory | — | Show as "In-person: stores near you" with hours. |

### Fiber extraction pipeline
Used for listings **and** for care-tag photos in the wardrobe (run OCR first, then the same steps).
1. Pull the structured `Material` field if present.
2. Else regex title + description for patterns like `(\d{1,3})\s?%\s?(cotton|linen|flax|hemp|ramie|wool|merino|cashmere|alpaca|mohair|silk|camel|yak|lyocell|tencel|modal|viscose|rayon|cupro|bamboo|polyester|nylon|polyamide|acrylic|elastane|spandex|lycra|polypropylene)`.
3. Bare mentions with no % ("linen blend") → **blend, % unknown**, natural share 0.5.
4. No mention → **Fiber unknown**. Fiber score 0.3, *Verify fiber* badge, never auto-hidden.
5. Normalize synonyms: flax → linen, merino → wool, Lycra/spandex → elastane, polyamide → nylon, Tencel → lyocell.

---

## 4. Fiber scoring

Each fiber has a **naturalness value**. An item's **Fiber score (0–1)** = Σ (fiber % × value).

| Class | Fibers | Value |
|---|---|---|
| Natural | cotton, linen, hemp, ramie, wool, cashmere, alpaca, mohair, camel, yak, silk | **1.0** |
| Semi-synthetic (regenerated cellulose) | lyocell/Tencel, modal, viscose/rayon, cupro, "bamboo" (usually viscose) | **0.5** (or 0 if toggle off) |
| Synthetic | polyester, nylon, acrylic, elastane, polypropylene | **0** |
| Unknown | no fiber info | item score **0.3** flat |

**Stretch allowance:** ignore elastane up to **5%** in denim/trousers and up to **10%** in underwear and bras, where some stretch is nearly universal. Both thresholds are editable.

**Examples**
- 100% wool sweater → **1.00**
- 60% cotton / 40% polyester tee → **0.60**
- 45% linen / 55% rayon shirt → 0.45 + 0.275 = **0.73**
- 98% cotton / 2% elastane jeans (stretch on) → **1.00**
- 95% organic cotton / 5% elastane briefs (stretch on) → **1.00**
- 100% polyester blazer → **0.00**

**Dealbreakers** override everything: an item containing a "never" fiber is removed or shown greyed under "Hidden by your rules (3)."

---

## 5. Weighted priorities tool ("how much does it matter to you?")

### 5.1 Criteria
Each criterion produces a score from 0 to 1 per item. The user sets an **importance from 0 to 5** (0 = ignore) and can **🔒 lock** it as a must-have, which turns it into a hard filter at the threshold shown.

| # | Criterion | Item score (0–1) | Must-have threshold if locked |
|---|---|---|---|
| 1 | **Style match** | Similarity to style profile (§10.1) | ≥ 0.6 |
| 2 | **Natural fiber** | Fiber score (§4) | ≥ 0.9 |
| 3 | **Fit** (after realistic tailoring) | Fit score (§10.2) | ≥ 0.6 (alterable or better) |
| 4 | **Total cost** | 1 − (item + ship + alteration) / budget limit, floored at 0 (§5.5) | Within budget (same as *Strict*) |
| 5 | **Condition** | New w/ tags 1.0 · Excellent 0.85 · Good 0.6 · Fair 0.3 | ≥ Excellent |
| 6 | **Goes with my wardrobe** | min(pairs-with count / 5, 1) (§6) | ≥ 2 pairings |
| 7 | **Fills a goal** | 1 if it matches an open goal, else 0 | Must fill a goal |
| 8 | **Easy care** | Machine-washable 1.0 · Gentle cycle 0.6 · Hand wash 0.3 · Dry clean 0 | Machine-washable |
| 9 | **Local / low shipping** | Pickup within radius 1.0, else 1 − shipping/$15 | Local pickup |
| 10 | **Preferred brands** | 1 if brand on list, 0.5 if similar brand, else 0 | On list |

### 5.2 Formula
Weights are normalized so only the *ratios* between importances matter (the same idea the goals papers use for goal utilities):

```
Match = Σ (importance_i × score_i) / Σ importance_i      (over criteria not set to 0)
```

Items failing any 🔒 must-have are hidden ("Hidden by must-haves (n)").

**Quick mode** is a special case: the Style↔Fabric slider value w sets Style = 4w and Fiber = 4(1 − w), with Fit fixed at 1 and everything else 0. That equals the v1 formula `0.8 × [w × Style + (1 − w) × Fiber] + 0.2 × Fit`.

### 5.3 Worked examples

**Quick mode (slider):**

| Item | Style | Fiber | Fit | Purist (w=0.2) | Balanced (w=0.5) | I want the look (w=0.9) |
|---|---|---|---|---|---|---|
| Cream 100% wool fisherman sweater | 0.60 | 1.00 | 0.90 | **0.92** 🥇 | **0.82** 🥇 | 0.69 |
| Linen/rayon camp shirt | 0.80 | 0.73 | 0.60 | 0.71 | 0.73 | 0.75 |
| *The* polyester cropped blazer | 0.95 | 0.00 | 0.70 | 0.29 | 0.52 | **0.82** 🥇 |

**Advanced mode (same sweater vs. blazer):**

| Criterion | Sweater score | Blazer score | User A importance | User B importance |
|---|---|---|---|---|
| Style | 0.60 | 0.95 | 4 | 4 |
| Natural fiber | 1.00 | 0.00 | 3 | 3 |
| Fit | 0.90 | 0.70 | 3 | 3 |
| Total cost | 0.70 | 0.50 | 2 | 2 |
| Goes with wardrobe | 0.80 | 0.40 | 4 | 1 |
| Easy care | 0.20 (hand wash) | 0.90 | 1 | 5 |
| **Match** | | | **Sweater 0.76 🥇 · Blazer 0.55** | **Sweater 0.63 · Blazer 0.66 🥇** |

User B cares a lot about easy care and doesn't care whether things go with their closet, so the machine-washable blazer edges out the hand-wash wool sweater.

### 5.4 Helping people set weights
Rating 10 things from 0–5 is hard. Offer:
- **"This or that" cards** (5 quick pairwise questions, e.g., *"A perfect-style poly top or a so-so linen top?"*). Answers pre-fill the importances. The user can then edit.
- **Presets:** Fiber purist · Style first · Budget first · Low-maintenance · Closet-builder.
- A **weight bar** (stacked horizontal bar of the normalized weights, labeled) so users see "Style is 24% of your score."

### 5.5 Budget logic
Inputs from Screen 5: amount now `B_now`, allowance (monthly × 12 / 52 = weekly `A`), per-item cap `cap_item`, strict/flexible, optional envelopes.

**Total cost** of an item = price + shipping + alteration estimate (midpoint of the range) when the "count tailoring + shipping" toggle is on; otherwise just price.

**The limit an item is compared to:**
```
limit = min(cap_item, remaining in its envelope)      (envelope: Thrift finds, or Underwear for new underwear)
tailoring part also has to fit the Tailoring envelope, if envelopes are on
```

**Badges and filtering**
| Condition | Strict | Flexible |
|---|---|---|
| total ≤ limit | 💵 Within budget | 💵 Within budget |
| limit < total ≤ 1.2 × limit | hidden | ⚠️ "$X over" |
| total > remaining now, but affordable within the plan horizon | ⏳ "Affordable in N weeks" | ⏳ same |
| otherwise | hidden | hidden |

`N weeks = ceil((total − remaining) / A)`

**Cost score** (criterion #4 in §5.1): `1 − total / limit`, floored at 0. A cheaper item within budget scores higher, and anything over the limit scores 0.

**Example** (remaining $150, max per item $60):
- Wool sweater: $28 + $6 shipping = $34 → 💵, cost score 1 − 34/60 = **0.43**
- Polyester blazer: $45 + $25 sleeve alteration = $70 → strict: hidden · flexible: ⚠️ "$10 over," cost score 0

**Suggested envelope split** (user can drag to change): Underwear = cost of the underwear goal if flagged · Tailoring = sum of expected alterations across open goals · Other = 10% · Thrift finds = the rest.

**Feeds the goal plan (§10.6):** `B_now` and `A` become the plan's starting budget and weekly allowance. Buying something updates remaining and re-runs (or re-looks-up) the plan.

---

## 6. Wardrobe upload

### 6.1 Input
- **Item photo** → prototype: user picks type/color from chips (mock auto-tagging). Real build: image classifier for type + dominant color.
- **Care-tag photo** → OCR → fiber pipeline (§3) → fiber %, care symbols → Easy-care score.
- **Quick add** → type, color, fiber, condition.
- Optional per item: brand, size, "fits me well" toggle (used for size calibration), approximate purchase date, condition.

### 6.2 What the wardrobe powers
| Feature | How |
|---|---|
| **Goes with N things** | Compatibility rules on color (neutrals pair with everything; complementary/analogous palettes), formality level, and garment slot (a top pairs with bottoms, not other tops). For the prototype, hand-assign pairings in mock data. |
| **Gap finder** | Compare slots owned vs. a capsule template (e.g., warm coat, 2 knitwear, 2 trousers, 1 dress…) and the season. "No warm coat" becomes a suggested goal on Screen 7. |
| **Duplicate warning** | Same type + similar color + similar style tags already owned ≥ 2 times. |
| **Closet fiber stats** | Natural % of the whole wardrobe, with a trend if items are added over time. |
| **Size calibration** | "Fits me well" garments set personal garment-measurement targets, more accurate than body measurements alone. |
| **Replacement flags** | Condition "worn" or "needs repair" → suggest repair (tailor) or replace. Underwear has its own rule (§7). |

---

## 7. Underwear restock (always new, with recommendations)

### 7.1 Rules
- **Never recommend thrifted underwear.** Underwear search is limited to new items.
- **Flag for replacement** when any of these hold for underwear items in the wardrobe:
  - Condition marked worn: stretched-out waistband, holes, pilling, or fabric thinning.
  - Past the user's replacement interval (default **12 months**, editable, or turn off).
  - The user taps "I need new underwear."
- Flagged items create an **"Underwear restock" goal** on Screen 7 with high default importance (user can change it).

### 7.2 Recommendations
Ranked with the same priority weights (§5), with the 10% stretch allowance on. Seed list for the prototype (check each product page for current fiber % and prices):

| Brand | Fiber | Why it's in the seed list |
|---|---|---|
| **Subset** (formerly Knickey) | Certified organic cotton | Runs an intimates recycling program that takes old underwear; it says it has recycled over one million items, downcycled into things like carpet padding and furniture batting. |
| **Pact** | Organic cotton | Widely available basics in many cuts. |
| **Merino options** (e.g., Icebreaker, Smartwool) | Merino wool blends | For people who want wool's warmth/odor resistance. Usually blended with nylon/elastane, so the fiber score is lower. Show the real %. |

The restock screen also shows: **"What to do with the old ones"**, a recycling program link (Subset) or local textile drop-off. Don't put them in thrift donations.

---

## 8. Seed data: tailors near Milpitas, CA

Snapshot from Google Maps on **Oct 20, 2026**. Ratings change, so the live app should refresh them. Distances are straight-line from central Milpitas. Filter: rating ≥ 4.5 with ≥ 10 reviews.

| Tailor | Address | ~Dist | Rating (reviews) | Adjusted | Hours note | Skill tags (from reviews) |
|---|---|---|---|---|---|---|
| **The Magic Sewing by Clarita** | 2701 Alum Rock Ave, San Jose 95127 | 6 mi | 5.0 (41) | **4.77** | Open 7 days | suits, dresses, quick turnaround |
| **Aamber Alterations & Tailoring** | 169 S 15th St #1, San Jose 95112 | 6.5 mi | 4.8 (147) | **4.74** | Open daily, late hours | jeans hems w/ original stitching, blind stitch, rush jobs; one review notes it's in an apartment building |
| **Shamsher Tailor** | 4747 Piper St, Fremont 94538 | 8 mi | 5.0 (12) | 4.56 | Open 7 days | same-day trousers, low prices |
| **Minh Fashion Atelier** | 2050 Concourse Dr Ste 8, San Jose 95131 | 2.5 mi | 5.0 (11) | 4.55 | Mon/Tue/Fri/Sat 11–5 | dressmaking, bridal, jeans hems, texts when ready |
| **Express Alterations** | 43464 Ellsworth St, Fremont 94539 | 7 mi | 4.7 (15) | 4.47 | Mon–Sat | dresses, private fitting room |
| **Peter's Tailor Shop** | 41255 Fremont Blvd, Fremont 94538 | 7.5 mi | 4.6 (13) | 4.42 | Closed Thu & Sun | hems, patches; ask price up front |

*Example of the filter working:* Perfect Tailoring (200 Serra Way, Milpitas) is closest at <1 mi but sits at 4.0 (51 reviews), adjusted 4.08. It's hidden by default and shown when "Show all tailors" is on.

**Job → tailor matching examples:**
- Thrifted jeans, hem 2 in → Aamber (keeps original hem stitching) or Minh (closest).
- Vintage silk dress, take in sides → Minh (dressmaker) or Express Alterations.
- Wool coat, shorten sleeves → The Magic Sewing by Clarita (suits).

### Alteration price estimates (prototype defaults)
Rough ranges for display only, labeled "estimate, confirm with tailor": pant/jean hem $12–$25; take in waist $20–$40; shorten sleeves $20–$45 (more if lined or with working cuff buttons); dress hem $25–$60+ (more for layers/lining); taper legs $20–$35.

---

## 9. Visual encoding (for the "presents visual information effectively" answer)

- **Fiber bar:** stacked horizontal bar on every card. Green = natural, striped amber = semi-synthetic, grey = synthetic, dotted outline = unknown. Each segment has a text label ("100% wool").
- **Match %** as a large number. "Why this rank?" shows one mini-bar per criterion, sized by the user's weight.
- **Weight bar** on the priorities screen shows each criterion's share of the score.
- **Fit badges:** icon + word + color (✅ / ✂️ / ⚠️ / ❌).
- **Fiber label** panel mimics a nutrition label.
- **Fit diagram:** body vs. garment on the same outline, so the gap is seen, not calculated.
- **Goal cards + timeline:** each goal shows a probability ring split into natural vs. synthetic, positioned on a week-by-week timeline by deadline.
- **Total-cost line:** "$14 thrift + $20 hem = $34 vs. ~$90 new" on one row.
- **Wardrobe summary strip:** item count, natural %, gaps, flags. Each is tappable.

---

## 10. Ranking and planning logic

### 10.1 Style score (0–1)
Cosine similarity between the user's style tag vector and the item's tags (title/description keywords, category, color, brand), plus a boost if the free-text hunt phrase matches. For the prototype, hand-assign tag scores to each mock item.

### 10.2 Fit score (0–1)
Compare garment measurements (pit-to-pit × 2, waist, inseam, length, shoulder) to **body + ease** (or to "fits me well" wardrobe garments when available):

| Gap | Result | Fit score |
|---|---|---|
| Within ±1 in | Fits as-is | 1.0 |
| Too big, alterable (hem, take in waist/side seams, shorten sleeves from cuff) | ✂️ Fits with tailoring | 0.6–0.9 (lower for more/costlier work) |
| Too small by ≤1 in at seams with allowance | ⚠️ Hard to alter | 0.3 |
| Too small by more, or shoulders off by >1 in | ❌ Won't fit | 0 (hidden by default) |

UI rule of thumb: *"Taking in is easy; letting out is limited by seam allowance; shoulders are the hardest to change."* No listed measurements → fit score 0.5 and an "Ask seller for measurements" button.

### 10.3 Match score
See §5.2.

### 10.4 Learning from behavior
- ♥ "I'd buy it anyway" on an item with Fiber < 0.5 → suggest raising Style or lowering Fiber importance by 1 ("You often pick style over fabric. Adjust?"). Never applied silently.
- Dismissing high-style synthetics → suggest the opposite.
- Opening fiber labels or tapping "Verify fiber" often → fabric matters.
- Ignoring "goes with" items in favor of statement pieces → suggest lowering "Goes with my wardrobe."

### 10.5 Tailor rating (avoids "5.0 from 11 reviews" beating "4.8 from 147")
Bayesian average with prior mean C = 4.3 and weight m = 20 reviews:

```
Adjusted = (v / (v + m)) × R + (m / (v + m)) × C
```

Then rank by `0.6 × Adjusted(normalized) + 0.25 × skill match + 0.15 × distance (closer = higher)`.

### 10.6 Goal plan: which goals to fill first on your budget
**Basis:** Das, Ostrov, Radhakrishnan & Srivastav, "Dynamic Optimization for Multi-Goals Wealth Management," *Journal of Banking & Finance* 140 (2022). In the paper, an investor has several goals, each with a cost and a subjective utility (only the ratios between utilities matter). Goals can be fully met, met with a cheaper partial version, or skipped. Dynamic programming (Bellman equation, solved backward in time) picks the decisions that maximize expected total utility, and a forward pass reports the probability of reaching each goal. The investor then adjusts utilities until those probabilities feel right.

**Mapping to Second Seam**

| Paper | Second Seam |
|---|---|
| Wealth | Clothing budget on hand |
| Cash infusions | Weekly/monthly clothing allowance |
| Goal with cost + utility | Wardrobe goal with expected cost + "how much it matters" (1–10) |
| Partial version of a goal | Settling for the synthetic version: utility × "partial share" from the style↔fabric preference (Purist 0.2 · Balanced 0.6 · I want the look 0.9) |
| Market randomness | Whether a matching thrift item shows up that week (per-goal weekly find chance, natural vs. synthetic) |
| Probability of reaching each goal | Chance each wardrobe goal is filled by its deadline → goal cards |
| Optimal policy can skip a lower-priority goal to protect a higher one | Plan nudges: "Skip this $25 top; it lowers your wool-coat chance" (re-run the plan with that cost subtracted to get the number) |

**State:** (week t, budget b, which goals are already filled). Each week the app sees which goals had a natural and/or synthetic match appear and chooses what to buy, if anything.
**Small change from the paper:** with only 3–6 wardrobe goals, the state can track which goals are filled (a bitmask). That lets a goal skipped one week still be filled later, which the paper's backward method can't do. Clothes shopping is mostly "didn't find it this week, look again next week," so this matters.
**Size:** 12 weeks × ~80 budget levels × 16 goal combinations runs in about 3 seconds in plain Python and should be fast in JS. For the prototype, precomputing the three presets as static JSON is fine.

**Example run** (reference script `wardrobe_goal_plan_dp.py`): start $60, +$10/week, 12 weeks. Goals: underwear restock (new, $45, importance 10, weeks 1–4); wool winter coat ($55 natural / $35 synthetic, importance 8, weeks 1–6, find chance 25% / 50% per week); cream wool sweater ($28 / $18, importance 5); linen trousers ($30 / $20, importance 4, weeks 4–12).

| Goal | Purist | Balanced | I want the look |
|---|---|---|---|
| Underwear restock | 100% (new) | 100% (new) | 100% (new) |
| Winter coat | 72% filled · **44% wool** | 86% · 34% wool | 99% · 2% wool |
| Cream sweater | 94% · 88% wool | 97% · 84% wool | 99% · 81% wool |
| Linen trousers | 90% · 80% linen | 95% · 77% linen | 98% · 80% linen |

What the goal cards would say: on this budget, buying underwear first leaves a tight window for a $55 wool coat. A Purist waits for wool and accepts a lower chance of having any coat by the deadline. Someone who mainly wants *a coat* grabs the $35 synthetic one almost right away. The "what if" controls (raise allowance to $15/week, push the coat deadline back, lower the sweater's importance) show how to get the wool-coat chance up. For example, entering **$150 now + $40/month** on the Budget screen raises the Purist's wool-coat chance from 44% to **82%** (`python3 wardrobe_goal_plan_dp.py --budget 150 --monthly 40`).

**Later (beyond the prototype):** Das, Mittal, Ostrov et al., "Reinforcement Learning for Multiple Goals in Goals-Based Wealth Management" (AIxB 2024) solves the same kind of problem with PPO. It reached 94–98% of the dynamic-programming optimum and handles cases DP struggles with, such as many more state variables and deferring goals. That's the path if the app grows to dozens of goals, price trends, or resale value of items you sell.

---

## 11. Data shapes

Listing:
```json
{
  "id": "ebay-001",
  "source": "eBay",
  "title": "Vintage cream cable-knit fisherman sweater, 100% wool, M",
  "price": 28.00,
  "shipping": 6.00,
  "condition": "excellent",
  "care": "hand_wash",
  "url": "#demo",
  "image": "img/sweater.jpg",
  "fibers": [{ "name": "wool", "pct": 100 }],
  "fiberSource": "structured",
  "garmentType": "knitwear",
  "styleTags": { "vintage-70s": 0.8, "minimal": 0.5, "workwear": 0.4 },
  "measurements": { "pitToPit": 22, "length": 26, "sleeve": 24 },
  "pairsWith": ["w-03", "w-07", "w-11", "w-19"],
  "fillsGoal": "sweater",
  "localPickup": false
}
```

Wardrobe item:
```json
{
  "id": "w-07",
  "type": "trousers",
  "color": "olive",
  "fibers": [{ "name": "cotton", "pct": 98 }, { "name": "elastane", "pct": 2 }],
  "styleTags": { "workwear": 0.9, "utility": 0.6 },
  "condition": "great",
  "fitsWell": true,
  "garmentMeasurements": { "waist": 29, "inseam": 29 },
  "acquired": "2025-03"
}
```

User profile:
```json
{
  "units": "in",
  "body": { "height": 64, "bust": 34, "waist": 28, "hips": 38, "inseam": 29, "shoulder": 15, "sleeve": 23 },
  "fitPref": { "tops": "relaxed", "trousers": "regular", "outerwear": "regular" },
  "styleVector": { "minimal": 1, "workwear": 1, "vintage-70s": 0.5 },
  "mode": "advanced",
  "importance": { "style": 4, "fiber": 3, "fit": 3, "cost": 2, "condition": 1, "goesWith": 4, "fillsGoal": 3, "easyCare": 1, "local": 0, "brand": 0 },
  "mustHave": ["fit"],
  "dealbreakers": ["acrylic"],
  "semiSyntheticHalf": true,
  "stretchAllowance": { "bottoms": 5, "underwear": 10 },
  "underwearReplaceMonths": 12,
  "budget": {
    "now": 150,
    "allowance": { "amount": 40, "per": "month" },
    "itemCap": 60,
    "includeTailoringAndShipping": true,
    "mode": "flexible",
    "envelopes": { "thrift": 75, "tailoring": 30, "underwear": 45, "other": 0 },
    "spent": [{ "item": "ebay-001", "amount": 34, "envelope": "thrift", "date": "2026-10-20" }]
  },
  "goals": [
    { "id": "underwear", "importance": 10, "weeks": [1, 4], "newOnly": true },
    { "id": "coat", "importance": 8, "weeks": [1, 6] }
  ],
  "location": { "city": "Milpitas, CA", "radiusMi": 10 }
}
```

Build ~12 mock listings covering every case (100% natural, blends, semi-synthetic, pure-synthetic "dream piece," fiber unknown, fits as-is, needs a hem, won't fit), ~15 mock wardrobe items (including 2 worn underwear entries), and 3 underwear recommendations.

---

## 12. Interactions checklist (what makes it "interactive" for Part A)

- [ ] Multi-select style tiles with selected state
- [ ] Unit toggle converts all measurement fields live
- [ ] "How to measure" expanders
- [ ] Wardrobe: add item via photo / care tag / quick add; edit condition; summary strip updates
- [ ] Budget: enter amount now / allowance / max per item; strict↔flexible toggle; drag envelope split (donut updates); results badges and "within budget only" filter react
- [ ] "Mark as bought" updates the spent meter, remaining budget, and goal chances
- [ ] Quick slider + presets re-rank a live preview
- [ ] Advanced importance controls (0–5) + 🔒 must-have locks; weight bar updates; live preview re-ranks
- [ ] "This or that" weight helper pre-fills importances
- [ ] Dealbreaker checkboxes hide/show items with a "Hidden (n)" counter
- [ ] Goals screen: change importance/deadline/budget → goal-card probabilities change (precomputed JSON is fine)
- [ ] Results: sort, filter drawer, "Why this rank?" breakdown, duplicate warning, plan nudge
- [ ] ♥ "I'd buy it anyway" pin + weight-suggestion toast
- [ ] Item detail fiber label + fit diagram with hover/focus tooltips + "pairs with" strip
- [ ] "Find a tailor" passes the alteration list into the tailor screen
- [ ] Tailor list re-sorts by job type; "Show all tailors" toggle
- [ ] Underwear restock: flagged pairs → recommendations → recycling link
- [ ] Copy alteration list to clipboard; tel: and maps links

---

## 13. Design rationale hooks (for the Part A questions)

### Mental models it leverages
- **Shopping-app patterns:** cards, heart-to-save, filter drawer, sort dropdown. Familiar from Depop/Poshmark.
- **Nutrition-label metaphor** for fiber content: people already read "% of daily value." Here it's "% natural."
- **Slider as a balance/scale** for style vs. fabric; **0–5 ratings** match star-rating and survey habits for "how much does it matter."
- **Closet as a physical rail:** wardrobe screen looks like hangers, matching how people picture their closet.
- **Goal cards with a probability ring** mirror fitness rings and savings-goal progress bars.
- **Traffic-light fit badges** match go/caution/stop, always paired with icons and words.
- **Tailor cards follow Yelp/Google Maps conventions:** stars, distance, hours, call/directions.
- **Feedforward:** the live preview shows what a weight change will do before committing (Norman's gulf of execution). "Why this rank?" closes the gulf of evaluation.

### Effective visual information
- Pre-attentive encoding: color + length in the fiber bar and weight bar.
- Consistent position: match %, price, fit badge always in the same spot.
- Body-vs-garment overlay replaces mental arithmetic.
- Progressive disclosure: summary on the card, breakdown on demand, full label on detail.
- Probabilities as rings + a timeline, not tables of numbers.

---

## 14. User actions (draft for Part B)

| # | Action | Profile | Feedback type |
|---|---|---|---|
| 1 | Select style tiles in the quiz | Core | Explicit |
| 2 | Type a "piece I'm hunting for" | Core | Explicit |
| 3 | Enter body measurements | Core | Explicit |
| 4 | Use the brand-size fallback for measurements | Extended (newbie) | Explicit |
| 5 | Measure a "fits me well" garment instead | Extended (closet organizer) | Explicit |
| 6 | Choose fit preference per garment type | Core | Explicit |
| 7 | Upload a wardrobe item photo | Extended (closet organizer) | Explicit |
| 8 | Snap a care tag to read fiber content | Extended (closet organizer) | Explicit |
| 9 | Mark a wardrobe item as worn / needs repair | Extended | Explicit |
| 9a | Enter a budget (amount now and/or monthly allowance, max per item) | Core (budget planner) | Explicit |
| 9b | Switch strict ↔ flexible budget, or split budget into envelopes | Core (budget planner) | Explicit |
| 9c | Mark an item as bought / log a tailor bill | Core | Explicit |
| 9d | Turn on "within budget only," or open over-budget items anyway | Core | Explicit (filter) + Implicit (how firm the budget really is) |
| 10 | Move the Style↔Fabric slider / tap a preset | Core | Explicit |
| 11 | Rate criteria 0–5 in advanced mode | Core | Explicit |
| 12 | Lock a criterion as a must-have | Core | Explicit |
| 13 | Answer "this or that" weight questions | Extended (newbie) | Explicit |
| 14 | Set fiber dealbreakers (e.g., no wool) | Extended (sensitivities) | Explicit |
| 15 | Toggle semi-synthetics / stretch rules | Extended (fiber-savvy) | Explicit |
| 16 | Add a goal, set its importance and deadline | Core (budget planner) | Explicit |
| 17 | Change budget/deadline to see goal chances change | Core (budget planner) | Explicit |
| 18 | Scroll results and dwell on cards | Core | Implicit |
| 19 | Open an item's detail page | Core | Implicit |
| 20 | Open "Why this rank?" | Extended | Implicit |
| 21 | ♥ "I'd buy it anyway" on a synthetic item | Core (style-first) | Explicit (pin) + Implicit (suggested weight change) |
| 22 | Dismiss/hide an item | Core | Explicit |
| 23 | Ignore a duplicate warning and save anyway | Core | Implicit |
| 24 | Tap "Verify fiber" / message seller | Core (fiber-first) | Explicit |
| 25 | Read the fiber label / care notes | Extended (learner) | Implicit |
| 26 | Hover/focus the fit diagram zones | Extended (newbie) | Implicit |
| 27 | Tap "Find a tailor for this" | Extended (newbie) | Implicit (intent to alter) |
| 28 | Change tailor radius / toggle "Show all tailors" | Extended | Explicit |
| 29 | Call a tailor / get directions / copy alteration list | Core | Implicit (conversion) |
| 30 | Open the underwear restock and pick a recommendation | Core | Explicit |
| 31 | Change the underwear replacement interval | Extended | Explicit |
| 32 | Open the recycling link for old underwear | Extended | Implicit |
| 33 | Accept/decline a suggested weight change | Core | Explicit |
| 34 | Click through to buy on the source site | Core | Implicit (conversion) |

---

## 15. Accessibility (build in now, plus future work)

**In the prototype**
- Semantic HTML (`<button>`, `<label for>`, `<fieldset>` for the quiz and importance ratings), visible focus rings, full keyboard path through every screen.
- Sliders are native `<input type="range">` with `aria-valuetext` ("Balanced: style 50%, fabric 50%"; "Easy care: matters a lot, 4 of 5"). Presets and 0–5 radio buttons are alternatives to dragging.
- Never color alone: fiber bars, fit badges, diagram zones, and goal rings all have text.
- Contrast ≥ 4.5:1 for text; respect `prefers-reduced-motion` for re-ranking animations.
- Alt text on item photos: garment + color + fiber ("Cream cable-knit sweater, 100% wool").
- Wardrobe upload always has the **quick-add text option**, so it works without a camera.
- `aria-live="polite"` announces "Results re-ordered, top item: wool fisherman sweater" and "Winter coat chance now 58%."
- Tap targets ≥ 44 px.
- Budget fields are plain number inputs with `inputmode="decimal"` and a visible "$"; the envelope donut has a text list of the same amounts, and the envelope split can be typed instead of dragged.

**Future**
- Voice input for measurements and wardrobe quick-add; camera-assisted measuring.
- Plain-language mode explaining fiber terms and probabilities.
- Tailor filters for wheelchair-accessible storefront, pickup/delivery, languages spoken.
- Sensory profile ("itchy fibers," "heat-sensitive," "no tags") feeding dealbreakers and underwear picks.
- Screen-reader table view of the fit comparison and goal timeline.

---

## 16. Out of scope for the prototype
Real API calls, image recognition, OCR, accounts, payments, and booking tailors in-app. Listings, wardrobe items, and goal probabilities are static demo data (probabilities precomputed with the reference script). Tailor names and underwear brands are real and labeled as a snapshot.

---

## Sources
- Das, Ostrov, Radhakrishnan & Srivastav, "Dynamic Optimization for Multi-Goals Wealth Management," *Journal of Banking & Finance* 140 (2022): <https://webpages.scu.edu/ftp/dostrov/publications/JBF.pdf>
- Das, Mittal, Ostrov, Radhakrishnan, Srivastav & Wang, "Reinforcement Learning for Multiple Goals in Goals-Based Wealth Management," AIxB 2024: <https://webpages.scu.edu/ftp/dostrov/publications/AIxB.pdf>
- eBay Browse API, `item_summary/search` and `aspect_filter`: <https://developer.ebay.com/develop/api/buy/browse_api.md>
- eBay Browse API reference: <https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search>
- Example ThredUp listing with stated composition: <https://www.thredup.com/product/women-linen-madewell-blue-shorts/231782956>
- Subset (formerly Knickey) and its intimates recycling program: <https://thingtesting.com/brands/subset>
- Tailor names, addresses, hours, ratings, and review themes: Google Maps / Google Places, retrieved Oct 20, 2026
