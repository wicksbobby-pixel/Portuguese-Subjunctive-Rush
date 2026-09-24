# Verb Rush

A timed drill for **trigger recognition** in Brazilian Portuguese. Each question shows a sentence with a trigger (quando, duvido que, embora, antes de…) and a blank. You pick the form the trigger requires from three forms of the same verb.

Open `index.html` in a browser. There's no build step and nothing to install. Run the checks with `npm test` (or `node test/run.js`).

## Scope

- **Variety:** Brazilian Portuguese, four person slots (eu / você·ele·ela / nós / vocês·eles·elas). European Portuguese would need a real 2sg (tu) slot in every paradigm plus data and frames for it. That's a rework, not a patch.
- **Drilled:** presente, imperfeito and futuro do subjuntivo, plus the infinitivo pessoal (4 × 4 = 16 cells).
- **Not drilled:** the indicative. It appears only in trigger context and is never offered as an option.
- **Learner level:** Duolingo Score 129, the top of the B2 band (100–129). The default **B2** vocabulary adds derived irregulars that inherit a base verb's pattern: manter/obter/conter (ter), propor (pôr, no circumflex), prever/rever (ver → *previr*), intervir (vir), desfazer/satisfazer (fazer). It also adds *requerer*, which looks like querer but has a regular preterite, plus B2 regular verbs and adult-register complements. **Core** limits rounds to the original seed set. The profile lives in `LEARNER` in `data.js`.

## Home screen

Round settings and Start, stat tiles (questions, accuracy, average answer time, rounds and best), a recent-rounds trend, the 4×4 cell grid shaded by accuracy, the three weakest trigger categories (min. 3 attempts), all categories, and recent misses. Stats are kept in localStorage in this browser only.

## Files

| File | Role |
|---|---|
| `conjugation.js` | Ending tables, orthographic rules, paradigm generation |
| `data.js` | Verb principal parts (irregular 1sg, suppletive pres. subj., irregular 3pl preterite) and trigger categories |
| `engine.js` | Trigger frames, distractors, coverage deck, build-time validation |
| `scorecard.js` | Per-cell and per-category tallies (localStorage) |
| `ui.js` | Timed 3-option loop, miss feedback, summary, scorecard view |
| `test/run.js` | Hand-typed reference paradigms, frame validation, simulated sessions |

## How it's built

- **Shells** are trigger constructions with subject and complement slots, e.g. `Duvido que {S} ___ {O}.` Any verb with a complement can fill one. This keeps the trigger as the thing being varied.
- **Hand frames** are fixed sentences aimed at specific traps: ver's *vir* against the verb vir, *demos/dermos/darmos*, impersonal haver, pôr's circumflex, *queira*.
- **Distractors** are other cells of the same verb, and identical spellings collapse into one option. Each frame lists its `confusable` tenses: the tenses that are *wrong* in that frame. Tenses that would be grammatical there are never offered. For example, *Duvido que ele tivesse tempo* is fine, so doubt frames in the present never offer the imperfeito.
- **Contrast frames** (`contrast: true`) test futuro do subjuntivo against infinitivo pessoal. They only admit a verb if the two forms actually differ for that person. The check compares strings, not an "irregular" flag.
- **Coverage deck:** the 16 cells are dealt without replacement, so every block of 16 questions hits every cell. Within a cell, the trigger category you've seen least wins.
