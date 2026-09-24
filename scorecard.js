/*
 * scorecard.js — per-cell and per-trigger-category tallies, persisted to
 * localStorage when available (and silently in-memory when not).
 */
(function (root) {
  'use strict';
  const VR = (root.VerbRush = root.VerbRush || {});
  const KEY = 'verbRush.scorecard.v1';

  function empty() {
    return { cells: {}, cats: {}, recentMisses: [] };
  }

  function createScorecard(storage) {
    let state = empty();
    try {
      const raw = storage && storage.getItem(KEY);
      if (raw) state = Object.assign(empty(), JSON.parse(raw));
    } catch (e) {
      /* unavailable storage: keep in memory */
    }

    function save() {
      try {
        if (storage) storage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        /* ignore */
      }
    }

    function bump(table, key, correct, ms) {
      const r = (table[key] = table[key] || { n: 0, ok: 0, ms: 0 });
      r.n += 1;
      if (correct) r.ok += 1;
      r.ms += ms;
    }

    function record(q, result) {
      bump(state.cells, q.tense + '.' + q.person, result.correct, result.ms);
      bump(state.cats, q.cat, result.correct, result.ms);
      if (!result.correct) {
        state.recentMisses.unshift({ sentence: q.sentence, answer: q.answer, chosen: result.chosen || null, tense: q.tense, person: q.person, cat: q.cat, trigger: q.trigger, t: Date.now() });
        state.recentMisses.length = Math.min(state.recentMisses.length, 30);
      }
      save();
    }

    function stat(table, key) {
      const r = table[key];
      if (!r || !r.n) return { n: 0, ok: 0, acc: null, avgMs: null };
      return { n: r.n, ok: r.ok, acc: r.ok / r.n, avgMs: r.ms / r.n };
    }

    return {
      record,
      cell: (tense, person) => stat(state.cells, tense + '.' + person),
      cat: (cat) => stat(state.cats, cat),
      recentMisses: () => state.recentMisses.slice(),
      reset() {
        state = empty();
        save();
      },
    };
  }

  VR.scorecard = { createScorecard };
  if (typeof module !== 'undefined' && module.exports) module.exports = VR.scorecard;
})(typeof globalThis !== 'undefined' ? globalThis : this);
