/*
 * ui.js — home (start + stats), timed 3-option drilling loop, miss feedback,
 * round summary.
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
  let current = null; // { q, start, answered, raf, advance }

  // ---------- helpers ----------
  function show(name) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== 'screen-' + name;
    if (name === 'home') renderHome();
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
    const byTense = {};
    for (const c of cells) (byTense[c.tense] = byTense[c.tense] || []).push(c.person);
    return Object.entries(byTense).map(([t, ps]) => C.TENSE_LABELS[t] + ' ' + ps.join('/')).join(' · ');
  }

  function pct(acc) {
    return acc == null ? '–' : Math.round(acc * 100) + '%';
  }

  function secs(ms) {
    return ms == null ? '–' : (ms / 1000).toFixed(1) + ' s';
  }

  // ---------- home ----------
  const SHORT_PERSON = { '1sg': 'eu', '3sg': 'ele', '1pl': 'nós', '3pl': 'eles' };

  function renderHome() {
    const t = card.totals();
    const has = t.n > 0;
    $('home-empty').hidden = has;
    $('home-stats').hidden = !has;
    if (!has) return;

    const tiles = [
      ['Questions', String(t.n)],
      ['Accuracy', pct(t.acc)],
      ['Avg answer', secs(t.avgMs)],
      ['Rounds', t.rounds + (t.bestPct != null ? ' <span class="tile-sub">best ' + t.bestPct + '%</span>' : '')],
    ];
    $('tiles').innerHTML = tiles.map(([k, v]) => '<div class="tile"><div class="tile-k">' + k + '</div><div class="tile-v">' + v + '</div></div>').join('');

    // Recent rounds: one bar per round, height = accuracy.
    const rounds = card.rounds().slice(-20);
    const strip = $('rounds-strip');
    strip.setAttribute('aria-label', 'Accuracy of the last ' + rounds.length + ' rounds: ' + rounds.map((r) => Math.round((100 * r.ok) / r.n) + '%').join(', '));
    strip.innerHTML = rounds.length
      ? rounds.map((r) => {
          const p = Math.round((100 * r.ok) / r.n);
          const when = new Date(r.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return '<div class="bar" title="' + when + ' · ' + r.ok + '/' + r.n + ' (' + p + '%)"><span style="height:' + Math.max(p, 2) + '%"></span></div>';
        }).join('')
      : '<p class="muted">Finish a round to start the trend.</p>';

    // 4×4 cell grid, shaded by accuracy (single hue, light → dark).
    let html = '<table class="grid"><thead><tr><th></th>' + C.PERSONS.map((p) => '<th title="' + esc(C.PERSON_LABELS[p]) + '">' + SHORT_PERSON[p] + '</th>').join('') + '</tr></thead><tbody>';
    for (const tn of C.TENSES) {
      html += '<tr><th>' + esc(C.TENSE_LABELS[tn]) + '</th>';
      for (const p of C.PERSONS) {
        const st = card.cell(tn, p);
        const shade = st.acc == null ? '' : ' style="--shade:' + Math.round(8 + st.acc * 52) + '%"';
        html += '<td class="' + (st.acc == null ? 'none' : 'heat') + '"' + shade + ' title="' + esc(C.cellLabel(tn, p)) + ': ' + st.ok + '/' + st.n + '">' + pct(st.acc) + '<span class="n">' + st.n + '</span></td>';
      }
      html += '</tr>';
    }
    $('card-grid').innerHTML = html + '</tbody></table>';

    // Weakest trigger categories (need a few attempts to count).
    const cats = Object.entries(D.TRIGGER_CATEGORIES).map(([k, c]) => ({ k, c, st: card.cat(k) }));
    const weak = cats.filter((x) => x.st.n >= 3).sort((a, b) => a.st.acc - b.st.acc).slice(0, 3);
    $('weak-cats').innerHTML = weak.length
      ? weak.map(({ c, st }) => '<li><b>' + esc(c.label) + '</b> · ' + pct(st.acc) + ' of ' + st.n + '<span class="rule">' + esc(c.rule) + '</span></li>').join('')
      : '<li class="muted">Needs at least 3 attempts in a category.</li>';
    const sorted = cats.slice().sort((a, b) => (a.st.acc == null) - (b.st.acc == null) || (a.st.acc || 0) - (b.st.acc || 0));
    $('card-cats').innerHTML =
      '<thead><tr><th>Category</th><th>Acc.</th><th>n</th></tr></thead><tbody>' +
      sorted.map(({ c, st }) => '<tr><td>' + esc(c.label) + '<span class="rule">' + esc(c.rule) + '</span></td><td>' + pct(st.acc) + '</td><td>' + st.n + '</td></tr>').join('') +
      '</tbody>';

    const misses = card.recentMisses().slice(0, 5);
    $('recent-misses').innerHTML = misses.length
      ? misses.map((m) => '<li>' + esc(m.sentence.replace('___', '[' + m.answer + ']')) + '<div class="meta">' + esc(C.cellLabel(m.tense, m.person)) + ' · ' + esc(m.trigger) + (m.chosen ? ' · you: ' + esc(m.chosen) : ' · timed out') + '</div></li>').join('')
      : '<li class="muted">None yet.</li>';
  }

  // ---------- round ----------
  function readSettings() {
    return { length: +$('set-length').value, time: +$('set-time').value, vocab: $('set-vocab').value, highlight: $('set-highlight').checked };
  }

  function startRound() {
    const s = readSettings();
    saveSettings(s);
    if (!session || session.vocab !== s.vocab) session = E.createSession({ vocab: s.vocab });
    round = { length: s.length, timeMs: s.time * 1000, highlight: s.highlight, i: 0, score: 0, misses: [], times: [] };
    current = null;
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
    $('q-sentence').innerHTML = renderSentence(q, '<span class="blank">&nbsp;</span>', round.highlight);
    // Core verbs are known at this level: show the infinitive only. B2 additions get a gloss.
    $('q-verb').innerHTML = '<b>' + esc(q.verb) + '</b>' + (q.verbTier === 'b2' ? ' · ' + esc(q.verbGloss) : '');
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
    bar.style.transform = 'scaleX(1)';
    if (!round.timeMs) return;
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

    [...$('q-options').children].forEach((b, i) => {
      const o = q.options[i];
      b.disabled = true;
      if (o.correct) b.classList.add('good');
      else if (i === idx) b.classList.add('bad');
      b.insertAdjacentHTML('beforeend', '<span class="cell">' + esc(cellsLabel(o.cells)) + '</span>');
    });
    $('q-sentence').innerHTML = renderSentence(q, '<span class="blank ' + (correct ? 'filled-good' : 'filled-bad') + '">' + esc(q.answer) + '</span>', true);
    $('q-verb').innerHTML = '<b>' + esc(q.verb) + '</b> · ' + esc(q.verbGloss);
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
    if (current) clearTimeout(current.advance);
    current = null;
    const total = round.times.reduce((a, b) => a + b, 0);
    card.recordRound({ n: round.length, ok: round.score, ms: total });
    const acc = Math.round((100 * round.score) / round.length);
    $('sum-title').textContent = round.score + ' / ' + round.length;
    $('sum-stats').textContent = acc + '% correct · ' + secs(total / round.length) + ' average';
    $('sum-misses').innerHTML = round.misses
      .map(({ q, chosen }) =>
        '<li>' + renderSentence(q, '<b>' + esc(q.answer) + '</b>', true) +
        '<div class="meta">' + esc(C.cellLabel(q.tense, q.person)) + ' · ' + esc(D.TRIGGER_CATEGORIES[q.cat].label) +
        (chosen ? ' · you: ' + esc(chosen.form) : ' · timed out') + '</div></li>')
      .join('');
    show('summary');
  }

  // Quitting mid-round keeps answered questions in the stats but records no round.
  function quit() {
    if (current) { current.answered = true; cancelAnimationFrame(current.raf); clearTimeout(current.advance); }
    current = null;
    show('home');
  }

  // ---------- wiring ----------
  const L = D.LEARNER;
  $('learner-chip').textContent = L.source.replace('Duolingo Score', 'Duolingo') + ' ' + L.score + ' · ' + L.cefr;
  $('learner-chip').title = L.source + ' ' + L.score + ': ' + L.note;
  $('set-vocab').options[0].textContent = L.cefr + ' (' + L.source.replace('Duolingo Score', 'Duolingo') + ' ' + L.score + ')';

  const s = loadSettings();
  if (s.length) $('set-length').value = String(s.length);
  if (s.time != null) $('set-time').value = String(s.time);
  if (s.vocab) $('set-vocab').value = s.vocab;
  $('set-highlight').checked = !!s.highlight;

  $('btn-start').addEventListener('click', startRound);
  $('btn-again').addEventListener('click', startRound);
  $('btn-home').addEventListener('click', () => show('home'));
  $('btn-quit').addEventListener('click', quit);
  $('btn-reset').addEventListener('click', () => {
    if (confirm('Reset all stats?')) { card.reset(); renderHome(); }
  });

  document.addEventListener('keydown', (e) => {
    if ($('screen-drill').hidden) return;
    if (current && !current.answered && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      answer(+e.key - 1);
    } else if (current && current.answered && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      nextQuestion();
    }
  });

  show('home');
})();
