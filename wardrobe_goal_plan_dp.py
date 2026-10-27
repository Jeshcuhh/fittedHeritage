"""
Wardrobe goal planner: a small dynamic program adapted from
Das, Ostrov, Radhakrishnan & Srivastav, "Dynamic Optimization for
Multi-Goals Wealth Management," Journal of Banking & Finance 140 (2022).

Paper -> wardrobe mapping
  wealth            -> clothing budget ($)
  cash infusions    -> weekly clothing allowance
  goals (cost, util)-> wardrobe goals, each with a "how much it matters" utility
  partial goals     -> settling for the non-natural-fiber version (lower utility)
  market randomness -> whether a matching thrift item shows up that week
  output            -> probability each goal gets filled by its deadline

Difference from the paper: with only a handful of goals we can keep a
bitmask of which goals are already filled in the state, so a goal skipped
one week can still be filled later (the paper's backward method can't
condition on which earlier goals were met).

Run:  python3 wardrobe_goal_plan_dp.py                      (defaults: $60 now, $10/week)
      python3 wardrobe_goal_plan_dp.py --budget 150 --monthly 40
      python3 wardrobe_goal_plan_dp.py --budget 80 --weekly 15
"""
from functools import lru_cache
from itertools import product
import random

WEEKS = 12
START_BUDGET = 60
ALLOWANCE = 10          # added at the start of each week after week 1
STEP = 5                # budget grid in dollars
MAX_BUDGET = 400

# Each goal: name, utility (importance), window [first, last] week,
# natural version (cost, weekly chance it shows up), synthetic version (cost, chance)
# Underwear is bought NEW, so it is always available (chance 1.0) and has no
# synthetic fallback in this example.
GOALS = [
    dict(name="Underwear restock (new, organic cotton)", u=10, win=(1, 4),
         nat=(45, 1.00), syn=None),
    dict(name="Wool winter coat",  u=8, win=(1, 6),  nat=(55, 0.25), syn=(35, 0.50)),
    dict(name="Cream wool sweater", u=5, win=(1, 12), nat=(28, 0.35), syn=(18, 0.50)),
    dict(name="Linen trousers",     u=4, win=(4, 12), nat=(30, 0.30), syn=(20, 0.50)),
]


def outcomes(t):
    """All combinations of what shows up this week, with probabilities.
    Per goal: 0 = nothing, 1 = natural only, 2 = synthetic only, 3 = both."""
    per_goal = []
    for g in GOALS:
        a, b = g["win"]
        if not (a <= t <= b):
            per_goal.append([(0, 1.0)])
            continue
        pn = g["nat"][1]
        ps = g["syn"][1] if g["syn"] else 0.0
        per_goal.append([(0, (1 - pn) * (1 - ps)), (1, pn * (1 - ps)),
                         (2, (1 - pn) * ps), (3, pn * ps)])
    for combo in product(*per_goal):
        p = 1.0
        for _, q in combo:
            p *= q
        if p > 0:
            yield tuple(s for s, _ in combo), p


def make_solver(partial):
    """partial = share of a goal's utility you still get from the synthetic
    version (Purist 0.2, Balanced 0.6, I-want-the-look 0.9)."""

    def choices(t, b, filled, seen):
        """Every set of purchases you could make this week:
        list of (utility, spend, new_filled, picks)."""
        opts = [(0.0, 0, filled, ())]
        for i, g in enumerate(GOALS):
            if filled >> i & 1 or seen[i] == 0:
                continue
            new = []
            for u, spend, f, picks in opts:
                if seen[i] in (1, 3):  # natural version available
                    c = g["nat"][0]
                    if spend + c <= b:
                        new.append((u + g["u"], spend + c, f | 1 << i, picks + ((i, "natural"),)))
                if seen[i] in (2, 3):  # synthetic version available
                    c = g["syn"][0]
                    if spend + c <= b:
                        new.append((u + g["u"] * partial, spend + c, f | 1 << i, picks + ((i, "synthetic"),)))
            opts += new
        return opts

    @lru_cache(maxsize=None)
    def V(t, b, filled):
        """Best expected total utility from week t on."""
        if t > WEEKS:
            return 0.0
        total = 0.0
        for seen, p in outcomes(t):
            best = max(u + V(t + 1, min(b - s + ALLOWANCE, MAX_BUDGET), f)
                       for u, s, f, _ in choices(t, b, filled, seen))
            total += p * best
        return total

    def act(t, b, filled, seen):
        return max(choices(t, b, filled, seen),
                   key=lambda c: c[0] + V(t + 1, min(b - c[1] + ALLOWANCE, MAX_BUDGET), c[2]))

    return V, act


def simulate(partial, runs=20000, seed=1):
    """Forward pass: follow the optimal policy many times and count how
    often each goal gets filled (and with which fiber)."""
    V, act = make_solver(partial)
    rng = random.Random(seed)
    hits = [[0, 0] for _ in GOALS]  # [natural, synthetic]
    for _ in range(runs):
        b, filled = START_BUDGET, 0
        for t in range(1, WEEKS + 1):
            seen = []
            for g in GOALS:
                a, z = g["win"]
                if not (a <= t <= z):
                    seen.append(0); continue
                n = rng.random() < g["nat"][1]
                s = bool(g["syn"]) and rng.random() < g["syn"][1]
                seen.append(3 if n and s else 1 if n else 2 if s else 0)
            u, spend, filled_new, picks = act(t, b, filled, tuple(seen))
            for i, kind in picks:
                hits[i][0 if kind == "natural" else 1] += 1
            b, filled = min(b - spend + ALLOWANCE, MAX_BUDGET), filled_new
    return [(g["name"], n / runs, s / runs) for g, (n, s) in zip(GOALS, hits)]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Wardrobe goal planner")
    ap.add_argument("--budget", type=float, help="amount you can spend now ($)")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--weekly", type=float, help="clothing allowance per week ($)")
    g.add_argument("--monthly", type=float, help="clothing allowance per month ($)")
    args = ap.parse_args()
    if args.budget is not None:
        START_BUDGET = int(round(args.budget))
    if args.weekly is not None:
        ALLOWANCE = int(round(args.weekly))
    elif args.monthly is not None:
        ALLOWANCE = int(round(args.monthly * 12 / 52))
    print(f"Budget: ${START_BUDGET} now + ${ALLOWANCE}/week for {WEEKS} weeks")
    for label, partial in [("Purist", 0.2), ("Balanced", 0.6), ("I want the look", 0.9)]:
        print(f"\n== {label} (synthetic version worth {partial:.0%} of the goal) ==")
        for name, pn, ps in simulate(partial):
            print(f"  {name:42s} filled {pn + ps:5.0%}   natural {pn:4.0%}  synthetic {ps:4.0%}")
