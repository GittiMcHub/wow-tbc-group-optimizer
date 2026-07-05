# TBC Raid Composition Optimizer

**Try it:** https://gittimchub.github.io/wow-tbc-group-optimizer/

A fully client-side web tool that computes the buff-optimal party layout for World of Warcraft: The Burning Crusade raids (10-man = 2×5, 25-man = 5×5). Enter your roster (class + spec) and it assigns players to parties to maximize party-local buff coverage — solved to provable optimality with an Integer Linear Programming solver running in your browser.

## Features

- **Perfect groups, every raid** — enter your roster (class + spec), get the mathematically best 5-man party setup for your 10 or 25-man. Not "pretty good" — provably the best possible.
- **Knows TBC buffs cold** — Windfury, Totem of Wrath, Moonkin Aura, Wrath of Air, Grace of Air… everything that only works inside a party is what decides the groups.
- **No fake buffs** — Windfury buffs your Ret paladin but not your hunters. Prot paladins count as melee-ish for holy-threat. Shamans can't drop two earth totems at once. The tool knows all of it.
- **Totem twisting supported** — Windfury twisting is modeled correctly: it stacks on top of one other air totem, exactly like your enhancement shaman actually plays it.
- **See what you're missing** — per-group score breakdown shows which buffs each party gets and where potential is wasted.
- **Recruiting advice** — tells you which class/spec would boost your raid the most if you added one.
- **Raid-Helper import** — pull your signups straight from your Discord Raid-Helper event, no retyping.
- **Share with one link** — setup is encoded in the URL; paste it in your guild Discord and officers see the same roster.
- **Instant, private, free** — runs entirely in your browser. No account, no server, no data leaves your machine.

## How it works

- Only **party-local** buffs (totems, Moonkin Aura, Leader of the Pack, …) influence grouping; **raid-global** buffs/debuffs (Misery, Curse of Elements, …) are the same for any layout and are added as a flat score bonus.
- The optimizer is a count-based ILP solved with [`glpk.js`](https://github.com/jvail/glpk.js) (WebAssembly GLPK) inside a Web Worker, so the UI never blocks. A 24-man roster solves in about a second.
- All WoW tuning (buff weights, who provides and who benefits from what) lives in two data files: `src/buffs.js` and `src/specs.js`. The solver code hardcodes no buffs — tweak the weights freely.

## Development

```
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm test         # solver tests incl. brute-force optimality cross-check
```

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`. Architecture details and model documentation: `CLAUDE.md` and the comments in `src/model.js`.
