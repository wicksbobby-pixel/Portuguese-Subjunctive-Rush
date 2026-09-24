/*
 * ui.js — timed 3-option drilling loop, miss feedback, summary, scorecard.
 */
(function () {
  'use strict';
  const VR = window.VerbRush;
  const C = VR.conjugation, D = VR.data, E = VR.engine;
  const $ = (id) => document.getElementById(id);

  const problems = E.validateFrames();
  if (problems.length) console.warn('Verb Rush frame problems:\n' + problems.join('\n'));

  let storage = null;
  try { storage = window.localStorage; } catch (e) { /* unavailable */ }
  const card = VR.scorecard.createScorecard(storage);

  const SETTINGS_KEY = 'verbRush.settings.v1';
  function loadSettings() {
    try { return JSON.parse(storage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveSettings(s) {
    try { storage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  let session = null;
  let round = null; // { length, timeMs, highlight, i, score, misses, times }
  let current = null; // { q, start, answered, raf }

  // ---------- screens ----------
  function show(name) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== 'screen-' + name;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function withTrigger(text, trigger, highlight) {
    const t = esc(text);
    if (!highlight) return t;
    const idx = text.indexOf(trigger);
    if (idx < 0) return t;
    return esc(text.slice(0, idx)) + '<mark class="trigger">' + esc(trigger) + '</mark>' + esc(text.slice(idx + trigger.length));
  }

  // The trigger may sit before or after the blank (e.g. "É importante eles ___").
  function renderSentence(q, blankHtml, highlight) {
    return withTrigger(q.before, q.trigger, highlight) + blankHtml + withTrigger(q.after, q.trigger, highlight && !q.before.includes(q.trigger));
  }

  function cellsLabel(cells) {
    // Group persons by tense: "fut. subj. 1sg/3sg"
    const byTense = {};
    for (const c of cells) (byTense[c.tense] = byTense[c.tense] || []).push(c.person);
    return Object.entries(byTense).map(([t, ps]) => C.TENSE_LABELS[t] + ' ' + ps.join('/')).join(' · ');
  }

  // ---------- round ----------
  function startRound() {
    const s = { length: +$('set-length').value, time: +$('set-time').value, highlight: $('set-highlight').checked };
    saveSettings(s);
    if (!session) session = E.createSession();
    round = { length: s.length, timeMs: s.time * 1000, highlight: s.highlight, i: 0, score: 0, misses: [], times: [] };
    show('drill');
    nextQuestion();
  }

  function nextQuestion() {
    if (current && !current.answered) return; // guards Enter + click both firing
    if (current) clearTimeout(current.advance);
    if (round.i >= round.length) return endRound();
    const q = E.nextQuestion(session);
    current = { q, start: performance.now(), answered: false, raf: 0 };
    round.i += 1;

    $('q-progress').textContent = round.i + ' / ' + round.length;
    $('q-score').textContent = round.score + ' correct';
    $('q-sentence').innerHTML = renderSentence(q, '<span class="blank" id="blank">&nbsp;</span>', round.highlight);
    $('q-verb').innerHTML = '<b>' + esc(q.verb) + '</b> · ' + esc(q.verbGloss);
    const fb = $('q-feedback');
    fb.hidden = true;
    fb.className = 'feedback';

    const box = $('q-options');
    box.innerHTML = '';
    q.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.innerHTML = '<span class="k">' + (i + 1) + '</span><span class="f">' + esc(o.form) + '</span>';
      b.addEventListener('click', () => answer(i));
      box.appendChild(b);
    });
    runTimer();
  }

  function runTimer() {
    const bar = $('timer-bar');
    if (!round.timeMs) { bar.style.transform = 'scaleX(1)'; return; }
    const tick = () => {
      if (!current || current.answered) return;
      const frac = 1 - (performance.now() - current.start) / round.timeMs;
      bar.style.transform = 'scaleX(' + Math.max(0, frac) + ')';
      if (frac <= 0) return answer(-1);
      current.raf = requestAnimationFrame(tick);
    };
    current.raf = requestAnimationFrame(tick);
  }

  function answer(idx) {
    if (!current || current.answered) return;
    current.answered = true;
    cancelAnimationFrame(current.raf);
    const q = current.q;
    const ms = Math.round(performance.now() - current.start);
    const chosen = idx >= 0 ? q.options[idx] : null;
    const correct = !!(chosen && chosen.correct);
    card.record(q, { correct, ms, chosen: chosen && chosen.form });
    round.times.push(ms);
    if (correct) round.score += 1;
    else round.misses.push({ q, chosen });

    // Mark options and reveal each option's cell(s).
    [...$('q-options').children].forEach((b, i) => {
      const o = q.options[i];
      b.disabled = true;
      if (o.correct) b.classList.add('good');
      else if (i === idx) b.classList.add('bad');
      b.insertAdjacentHTML('beforeend', '<span class="cell">' + esc(cellsLabel(o.cells)) + '</span>');
    });
    $('q-sentence').innerHTML = renderSentence(q, '<span class="blank ' + (correct ? 'filled-good' : 'filled-bad') + '">' + esc(q.answer) + '</span>', true);
    $('q-score').textContent = round.score + ' correct';

    const fb = $('q-feedback');
    const cat = D.TRIGGER_CATEGORIES[q.cat].label;
    if (correct) {
      fb.className = 'feedback good';
      fb.innerHTML = '<span class="muted">' + esc(C.cellLabel(q.tense, q.person)) + ' · ' + esc(cat) + '</span>';
      fb.hidden = false;
      current.advance = setTimeout(nextQuestion, 900);
      return;
    }
    fb.className = 'feedback bad';
    fb.innerHTML =
      '<dl>' +
      '<dt>Correct</dt><dd><b>' + esc(q.answer) + '</b> — ' + esc(C.TENSE_NAMES_PT[q.tense]) + ', ' + esc(C.PERSON_LABELS[q.person]) + ' (' + esc(C.cellLabel(q.tense, q.person)) + ')</dd>' +
      '<dt>Trigger</dt><dd><mark class="trigger">' + esc(q.trigger) + '</mark> · ' + esc(cat) + '</dd>' +
      '<dt>Why</dt><dd class="why">' + esc(q.why) + '</dd>' +
      '<dt>You chose</dt><dd>' + (chosen ? esc(chosen.form) + ' = ' + esc(cellsLabel(chosen.cells)) : 'nothing (time ran out)') + '</dd>' +
      '</dl><div class="row"><button class="primary" id="btn-next">Continue ⏎</button></div>';
    fb.hidden = false;
    $('btn-next').addEventListener('click', nextQuestion);
    $('btn-next').focus();
  }

  function endRound() {
    current = null;
    const acc = Math.round((100 * round.score) / round.length);
    const avg = round.times.length ? (round.times.reduce((a, b) => a + b, 0) / round.times.length / 1000).toFixed(1) : '–';
    $('sum-title').textContent = round.score + ' / ' + round.length;
    $('sum-stats').textContent = acc + '% correct · ' + avg + ' s average';
    $('sum-misses').innerHTML = round.misses
      .map(({ q, chosen }) =>
        '<li>' + renderSentence(q, '<b>' + esc(q.answer) + '</b>', true) +
        '<div class="meta">' + esc(C.cellLabel(q.tense, q.person)) + ' · ' + esc(D.TRIGGER_CATEGORIES[q.cat].label) +
        (chosen ? ' · you: ' + esc(chosen.form) : ' · timed out') + '</div></li>')
      .join('');
    show('summary');
  }

  // ---------- scorecard ----------
  function pct(st) {
    return st.acc == null ? '–' : Math.round(st.acc * 100) + '%';
  }

  function renderCard() {
    let html = '<table class="grid"><thead><tr><th></th>' + C.PERSONS.map((p) => '<th title="' + esc(C.PERSON_LABELS[p]) + '">' + esc(({ '1sg': 'eu', '3sg': 'ele', '1pl': 'nós', '3pl': 'eles' })[p]) + '</th>').join('') + '</tr></thead><tbody>';
    for (const t of C.TENSES) {
      html += '<tr><th>' + esc(C.TENSE_LABELS[t]) + '</th>';
      for (const p of C.PERSONS) {
        const st = card.cell(t, p);
        html += '<td>' + pct(st) + '<span class="n">' + st.n + '</span></td>';
      }
      html += '</tr>';
    }
    $('card-grid').innerHTML = html + '</tbody></table>';

    const rows = Object.entries(D.TRIGGER_CATEGORIES)
      .map(([k, c]) => ({ k, c, st: card.cat(k) }))
      .sort((a, b) => (a.st.acc == null) - (b.st.acc == null) || (a.st.acc || 0) - (b.st.acc || 0));
    $('card-cats').innerHTML =
      '<thead><tr><th>Category</th><th>Acc.</th><th>n</th></tr></thead><tbody>' +
      rows.map(({ c, st }) => '<tr><td>' + esc(c.label) + '<span class="rule">' + esc(c.rule) + '</span></td><td>' + pct(st) + '</td><td>' + st.n + '</td></tr>').join('') +
      '</tbody>';
    show('card');
  }

  // ---------- wiring ----------
  const s = loadSettings();
  if (s.length) $('set-length').value = String(s.length);
  if (s.time != null) $('set-time').value = String(s.time);
  $('set-highlight').checked = !!s.highlight;

  $('btn-start').addEventListener('click', startRound);
  $('btn-again').addEventListener('click', startRound);
  $('btn-home').addEventListener('click', () => show('start'));
  $('btn-card').addEventListener('click', renderCard);
  $('btn-card2').addEventListener('click', renderCard);
  $('btn-card-back').addEventListener('click', () => show(round ? 'summary' : 'start'));
  $('btn-card-reset').addEventListener('click', () => {
    if (confirm('Reset all scorecard data?')) { card.reset(); renderCard(); }
  });

  document.addEventListener('keydown', (e) => {
    if ($('screen-drill').hidden) return;
    if (current && !current.answered && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      answer(+e.key - 1);
    } else if (current && current.answered && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      clearTimeout(current.advance);
      nextQuestion();
    }
  });
})();
