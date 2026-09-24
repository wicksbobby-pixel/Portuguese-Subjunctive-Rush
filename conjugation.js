/*
 * conjugation.js — ending tables, orthographic rules, paradigm generation.
 *
 * Target variety: Brazilian Portuguese. Four person slots only
 * (eu / você·ele·ela / nós / vocês·eles·elas). tu and vós are not modelled;
 * European Portuguese would need a distinct 2sg slot everywhere, not a patch.
 *
 * Irregular data lives in data.js. This file only knows how to turn a verb
 * entry's principal parts into the 16-cell grid.
 */
(function (root) {
  'use strict';
  const VR = (root.VerbRush = root.VerbRush || {});

  const PERSONS = ['1sg', '3sg', '1pl', '3pl'];
  const PERSON_LABELS = {
    '1sg': 'eu',
    '3sg': 'você/ele/ela',
    '1pl': 'nós',
    '3pl': 'vocês/eles/elas',
  };
  const TENSES = ['presSubj', 'impSubj', 'futSubj', 'persInf'];
  const TENSE_LABELS = {
    presSubj: 'pres. subj.',
    impSubj: 'imperf. subj.',
    futSubj: 'fut. subj.',
    persInf: 'pers. inf.',
  };
  const TENSE_NAMES_PT = {
    presSubj: 'presente do subjuntivo',
    impSubj: 'imperfeito do subjuntivo',
    futSubj: 'futuro do subjuntivo',
    persInf: 'infinitivo pessoal',
  };

  // Endings indexed by PERSONS order.
  const ENDINGS = {
    presSubj: {
      ar: ['e', 'e', 'emos', 'em'], // -ar verbs take the e-family
      erir: ['a', 'a', 'amos', 'am'], // -er/-ir verbs take the a-family
    },
    impSubj: ['sse', 'sse', 'ssemos', 'ssem'], // nós also accents the stem vowel, see impSubjStem
    futSubj: ['r', 'r', 'rmos', 'rem'],
    persInf: ['', '', 'mos', 'em'],
  };

  // Theme vowel of the regular 3pl preterite (fal-a-ram, com-e-ram, part-i-ram).
  const THEME_VOWEL = { ar: 'a', er: 'e', ir: 'i' };

  // Accent the imperfect-subjunctive nós form carries on the stem-final vowel.
  // Regular -er preterites have closed e (comêssemos); the strong irregular
  // preterites all have open e (tivéssemos, fizéssemos, déssemos).
  const NOS_ACCENT_REGULAR = { a: 'á', e: 'ê', i: 'í' };
  const NOS_ACCENT_IRREGULAR = { a: 'á', e: 'é', i: 'í', o: 'ô' };

  function stripAccents(s) {
    // Only strip acute/grave/circumflex/tilde; keep ç.
    return s.normalize('NFD').replace(/[̀-̃]/g, '').normalize('NFC');
  }

  function conjClass(inf) {
    const bare = stripAccents(inf);
    if (bare.endsWith('ar')) return 'ar';
    if (bare.endsWith('er')) return 'er';
    if (bare.endsWith('ir')) return 'ir';
    if (bare === 'por') return 'er'; // pôr is historically poer
    throw new Error('Unknown conjugation class: ' + inf);
  }

  function infStem(inf) {
    return stripAccents(inf).slice(0, -2);
  }

  /*
   * Orthographic rules, applied in order, so the stem keeps its sound
   * before the ending vowel.
   *   before e (only -ar present subj.): c→qu, g→gu, ç→c
   *   before o/a (regular -er/-ir 1sg): gu→g, c→ç, g→j
   * The second set means regular -er/-ir 1sg forms (conheço, dirijo) come
   * out right, so their present subjunctive derives from them automatically.
   */
  function adjustBeforeE(stem) {
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu';
    if (stem.endsWith('g')) return stem.slice(0, -1) + 'gu';
    if (stem.endsWith('ç')) return stem.slice(0, -1) + 'c';
    return stem;
  }

  function adjustBeforeBackVowel(stem) {
    if (stem.endsWith('gu')) return stem.slice(0, -2) + 'g';
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'ç';
    if (stem.endsWith('g')) return stem.slice(0, -1) + 'j';
    return stem;
  }

  function regular1sg(inf) {
    const cls = conjClass(inf);
    const stem = infStem(inf);
    return (cls === 'ar' ? stem : adjustBeforeBackVowel(stem)) + 'o';
  }

  function presSubj(entry) {
    if (entry.presSubj) return entry.presSubj.slice(); // suppletive: full paradigm
    const cls = conjClass(entry.inf);
    const first = entry.pres1sg || regular1sg(entry.inf);
    if (!first.endsWith('o')) {
      throw new Error(entry.inf + ': 1sg "' + first + '" does not end in -o; needs a suppletive presSubj');
    }
    let stem = first.slice(0, -1);
    if (cls === 'ar') {
      stem = adjustBeforeE(stem);
      return ENDINGS.presSubj.ar.map((e) => stem + e);
    }
    return ENDINGS.presSubj.erir.map((e) => stem + e);
  }

  // Stem shared by the imperfect and future subjunctive: 3pl preterite minus -ram.
  function preteriteStem(entry) {
    if (entry.pret3pl) {
      if (!entry.pret3pl.endsWith('ram')) throw new Error(entry.inf + ': pret3pl must end in -ram');
      return { stem: entry.pret3pl.slice(0, -3), irregular: true };
    }
    const cls = conjClass(entry.inf);
    return { stem: infStem(entry.inf) + THEME_VOWEL[cls], irregular: false };
  }

  function accentNos(stem, irregular) {
    const table = irregular ? NOS_ACCENT_IRREGULAR : NOS_ACCENT_REGULAR;
    const last = stem.slice(-1);
    if (!table[last]) throw new Error('Cannot accent preterite stem "' + stem + '"');
    return stem.slice(0, -1) + table[last];
  }

  function impSubj(entry) {
    const { stem, irregular } = preteriteStem(entry);
    return ENDINGS.impSubj.map((e, i) => (PERSONS[i] === '1pl' ? accentNos(stem, irregular) : stem) + e);
  }

  function futSubj(entry) {
    const { stem } = preteriteStem(entry);
    return ENDINGS.futSubj.map((e) => stem + e);
  }

  // Always built off the plain infinitive. The bare forms keep any accent
  // (pôr); suffixed forms drop it (pormos, porem).
  function persInf(entry) {
    return ENDINGS.persInf.map((e) => (e === '' ? entry.inf : stripAccents(entry.inf) + e));
  }

  const cache = new Map();
  function paradigm(entry) {
    if (cache.has(entry)) return cache.get(entry);
    const p = {
      presSubj: presSubj(entry),
      impSubj: impSubj(entry),
      futSubj: futSubj(entry),
      persInf: persInf(entry),
    };
    cache.set(entry, p);
    return p;
  }

  function form(entry, tense, person) {
    return paradigm(entry)[tense][PERSONS.indexOf(person)];
  }

  // Every cell of this verb's grid spelled exactly like `str`.
  function cellsForForm(entry, str) {
    const p = paradigm(entry);
    const out = [];
    for (const t of TENSES) {
      PERSONS.forEach((per, i) => {
        if (p[t][i] === str) out.push({ tense: t, person: per });
      });
    }
    return out;
  }

  function cellLabel(tense, person) {
    return TENSE_LABELS[tense] + ', ' + person;
  }

  VR.conjugation = {
    PERSONS,
    PERSON_LABELS,
    TENSES,
    TENSE_LABELS,
    TENSE_NAMES_PT,
    ENDINGS,
    conjClass,
    regular1sg,
    paradigm,
    form,
    cellsForForm,
    cellLabel,
    stripAccents,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = VR.conjugation;
})(typeof globalThis !== 'undefined' ? globalThis : this);
