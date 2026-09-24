/*
 * node test/run.js
 * Reference paradigms below are typed out in full, independently of the
 * generator, as [presSubj, impSubj, futSubj, persInf] × [eu, ele, nós, eles].
 */
'use strict';
require('../conjugation.js');
require('../data.js');
require('../engine.js');
require('../scorecard.js');
const VR = globalThis.VerbRush;
const C = VR.conjugation, D = VR.data, E = VR.engine;

let failures = 0;
function check(cond, msg) { if (!cond) { failures++; console.error('FAIL', msg); } }

const REF = {
  ser:    [['seja','seja','sejamos','sejam'], ['fosse','fosse','fôssemos','fossem'], ['for','for','formos','forem'], ['ser','ser','sermos','serem']],
  estar:  [['esteja','esteja','estejamos','estejam'], ['estivesse','estivesse','estivéssemos','estivessem'], ['estiver','estiver','estivermos','estiverem'], ['estar','estar','estarmos','estarem']],
  ir:     [['vá','vá','vamos','vão'], ['fosse','fosse','fôssemos','fossem'], ['for','for','formos','forem'], ['ir','ir','irmos','irem']],
  ter:    [['tenha','tenha','tenhamos','tenham'], ['tivesse','tivesse','tivéssemos','tivessem'], ['tiver','tiver','tivermos','tiverem'], ['ter','ter','termos','terem']],
  haver:  [['haja','haja','hajamos','hajam'], ['houvesse','houvesse','houvéssemos','houvessem'], ['houver','houver','houvermos','houverem'], ['haver','haver','havermos','haverem']],
  fazer:  [['faça','faça','façamos','façam'], ['fizesse','fizesse','fizéssemos','fizessem'], ['fizer','fizer','fizermos','fizerem'], ['fazer','fazer','fazermos','fazerem']],
  poder:  [['possa','possa','possamos','possam'], ['pudesse','pudesse','pudéssemos','pudessem'], ['puder','puder','pudermos','puderem'], ['poder','poder','podermos','poderem']],
  querer: [['queira','queira','queiramos','queiram'], ['quisesse','quisesse','quiséssemos','quisessem'], ['quiser','quiser','quisermos','quiserem'], ['querer','querer','querermos','quererem']],
  saber:  [['saiba','saiba','saibamos','saibam'], ['soubesse','soubesse','soubéssemos','soubessem'], ['souber','souber','soubermos','souberem'], ['saber','saber','sabermos','saberem']],
  dizer:  [['diga','diga','digamos','digam'], ['dissesse','dissesse','disséssemos','dissessem'], ['disser','disser','dissermos','disserem'], ['dizer','dizer','dizermos','dizerem']],
  trazer: [['traga','traga','tragamos','tragam'], ['trouxesse','trouxesse','trouxéssemos','trouxessem'], ['trouxer','trouxer','trouxermos','trouxerem'], ['trazer','trazer','trazermos','trazerem']],
  vir:    [['venha','venha','venhamos','venham'], ['viesse','viesse','viéssemos','viessem'], ['vier','vier','viermos','vierem'], ['vir','vir','virmos','virem']],
  'pôr':  [['ponha','ponha','ponhamos','ponham'], ['pusesse','pusesse','puséssemos','pusessem'], ['puser','puser','pusermos','puserem'], ['pôr','pôr','pormos','porem']],
  dar:    [['dê','dê','demos','deem'], ['desse','desse','déssemos','dessem'], ['der','der','dermos','derem'], ['dar','dar','darmos','darem']],
  ver:    [['veja','veja','vejamos','vejam'], ['visse','visse','víssemos','vissem'], ['vir','vir','virmos','virem'], ['ver','ver','vermos','verem']],
  ler:    [['leia','leia','leiamos','leiam'], ['lesse','lesse','lêssemos','lessem'], ['ler','ler','lermos','lerem'], ['ler','ler','lermos','lerem']],
  // regular + orthographic + stem-change spot checks
  chegar: [['chegue','chegue','cheguemos','cheguem'], ['chegasse','chegasse','chegássemos','chegassem'], ['chegar','chegar','chegarmos','chegarem'], ['chegar','chegar','chegarmos','chegarem']],
  buscar: [['busque','busque','busquemos','busquem'], ['buscasse','buscasse','buscássemos','buscassem'], ['buscar','buscar','buscarmos','buscarem'], ['buscar','buscar','buscarmos','buscarem']],
  'começar': [['comece','comece','comecemos','comecem'], ['começasse','começasse','começássemos','começassem'], ['começar','começar','começarmos','começarem'], ['começar','começar','começarmos','começarem']],
  conhecer: [['conheça','conheça','conheçamos','conheçam'], ['conhecesse','conhecesse','conhecêssemos','conhecessem'], ['conhecer','conhecer','conhecermos','conhecerem'], ['conhecer','conhecer','conhecermos','conhecerem']],
  dirigir: [['dirija','dirija','dirijamos','dirijam'], ['dirigisse','dirigisse','dirigíssemos','dirigissem'], ['dirigir','dirigir','dirigirmos','dirigirem'], ['dirigir','dirigir','dirigirmos','dirigirem']],
  pedir:  [['peça','peça','peçamos','peçam'], ['pedisse','pedisse','pedíssemos','pedissem'], ['pedir','pedir','pedirmos','pedirem'], ['pedir','pedir','pedirmos','pedirem']],
  dormir: [['durma','durma','durmamos','durmam'], ['dormisse','dormisse','dormíssemos','dormissem'], ['dormir','dormir','dormirmos','dormirem'], ['dormir','dormir','dormirmos','dormirem']],
  seguir: [['siga','siga','sigamos','sigam'], ['seguisse','seguisse','seguíssemos','seguissem'], ['seguir','seguir','seguirmos','seguirem'], ['seguir','seguir','seguirmos','seguirem']],
  // B2 derived irregulars
  manter: [['mantenha','mantenha','mantenhamos','mantenham'], ['mantivesse','mantivesse','mantivéssemos','mantivessem'], ['mantiver','mantiver','mantivermos','mantiverem'], ['manter','manter','mantermos','manterem']],
  propor: [['proponha','proponha','proponhamos','proponham'], ['propusesse','propusesse','propuséssemos','propusessem'], ['propuser','propuser','propusermos','propuserem'], ['propor','propor','propormos','proporem']],
  prever: [['preveja','preveja','prevejamos','prevejam'], ['previsse','previsse','prevíssemos','previssem'], ['previr','previr','previrmos','previrem'], ['prever','prever','prevermos','preverem']],
  intervir: [['intervenha','intervenha','intervenhamos','intervenham'], ['interviesse','interviesse','interviéssemos','interviessem'], ['intervier','intervier','interviermos','intervierem'], ['intervir','intervir','intervirmos','intervirem']],
  satisfazer: [['satisfaça','satisfaça','satisfaçamos','satisfaçam'], ['satisfizesse','satisfizesse','satisfizéssemos','satisfizessem'], ['satisfizer','satisfizer','satisfizermos','satisfizerem'], ['satisfazer','satisfazer','satisfazermos','satisfazerem']],
  requerer: [['requeira','requeira','requeiramos','requeiram'], ['requeresse','requeresse','requerêssemos','requeressem'], ['requerer','requerer','requerermos','requererem'], ['requerer','requerer','requerermos','requererem']],
  atingir: [['atinja','atinja','atinjamos','atinjam'], ['atingisse','atingisse','atingíssemos','atingissem'], ['atingir','atingir','atingirmos','atingirem'], ['atingir','atingir','atingirmos','atingirem']],
  arcar: [['arque','arque','arquemos','arquem'], ['arcasse','arcasse','arcássemos','arcassem'], ['arcar','arcar','arcarmos','arcarem'], ['arcar','arcar','arcarmos','arcarem']],
  impedir: [['impeça','impeça','impeçamos','impeçam'], ['impedisse','impedisse','impedíssemos','impedissem'], ['impedir','impedir','impedirmos','impedirem'], ['impedir','impedir','impedirmos','impedirem']],
};

// 1. Paradigms match the hand-typed reference.
for (const [inf, ref] of Object.entries(REF)) {
  const v = D.VERBS[inf];
  check(v, 'verb missing: ' + inf);
  if (!v) continue;
  const p = C.paradigm(v);
  C.TENSES.forEach((t, ti) => C.PERSONS.forEach((per, pi) => {
    check(p[t][pi] === ref[ti][pi], `${inf} ${t} ${per}: got ${p[t][pi]}, want ${ref[ti][pi]}`);
  }));
}
// Every verb in data.js generates without throwing.
for (const v of D.VERB_LIST) { try { C.paradigm(v); } catch (e) { check(false, v.inf + ': ' + e.message); } }

// 2. Frame validation (coverage, contrast constraint, hand-frame answers).
const errs = E.validateFrames();
errs.forEach((e) => check(false, e));

// 3. All 16 cells reachable.
const cov = E.coverageReport();
check(cov.length === 16, '16 cells in coverage report');
for (const r of cov) check(r.combos + r.hand > 0, 'cell unreachable ' + r.tense + ' ' + r.person);

// 4. Simulated sessions: options, collapse, contrast constraint, deck coverage.
for (let seed = 1; seed <= 40; seed++) {
  const vocab = seed % 2 ? 'b2' : 'core';
  const s = E.createSession({ seed, vocab });
  const seenCells = new Set();
  for (let i = 0; i < 160; i++) {
    const q = E.nextQuestion(s);
    seenCells.add(q.tense + '.' + q.person);
    const forms = q.options.map((o) => o.form);
    check(forms.length === 3, `${q.id}: ${forms.length} options`);
    check(new Set(forms).size === forms.length, `${q.id}: duplicate option strings ${forms}`);
    check(q.options.filter((o) => o.correct).length === 1, `${q.id}: exactly one correct`);
    check(forms.includes(q.answer), `${q.id}: answer missing`);
    const verb = D.VERBS[q.verb];
    const all = new Set(C.TENSES.flatMap((t) => C.paradigm(verb)[t]));
    forms.forEach((f) => check(all.has(f), `${q.id}: option ${f} is not a form of ${q.verb}`));
    check(!q.sentence.includes('{'), `${q.id}: unfilled slot`);
    if (vocab === 'core') check(verb.tier === 'core', `${q.id}: B2 verb ${q.verb} in core mode`);
    if (q.contrast) check(C.form(verb, 'futSubj', q.person) !== C.form(verb, 'persInf', q.person), `${q.id}: contrast frame on ${q.verb}`);
    // no option other than the answer may be a cell the frame treats as acceptable-but-not-drilled:
    q.options.filter((o) => !o.correct).forEach((o) => {
      check(o.cells.every((c) => c.tense === q.tense || q.confusable.includes(c.tense)), `${q.id}: distractor ${o.form} from a non-confusable tense`);
    });
    if (i === 15) check(seenCells.size === 16, `seed ${seed}: first 16 questions cover ${seenCells.size}/16 cells`);
  }
}

// 5. Scorecard with no storage.
const sc = VR.scorecard.createScorecard(null);
sc.record({ tense: 'futSubj', person: '1sg', cat: 'temporal', sentence: 'x', answer: 'y', trigger: 'Quando' }, { correct: false, ms: 1000 });
check(sc.cell('futSubj', '1sg').n === 1 && sc.cat('temporal').acc === 0, 'scorecard tallies');
sc.recordRound({ n: 10, ok: 7, ms: 30000 });
sc.recordRound({ n: 10, ok: 9, ms: 20000 });
const tot = sc.totals();
check(tot.rounds === 2 && tot.bestPct === 90 && tot.n === 1, 'scorecard totals ' + JSON.stringify(tot));

// Report
console.log('Coverage (shell×verb combos + hand frames per cell):');
for (const r of cov) console.log(`  ${C.cellLabel(r.tense, r.person).padEnd(22)} ${String(r.combos).padStart(4)} + ${r.hand}  [${r.cats.join(', ')}]`);
console.log(`${E.SHELLS.length} shells, ${E.HAND_FRAMES.length} hand frames, ${D.VERB_LIST.length} verbs`);
if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nAll checks passed.');
