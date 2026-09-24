/*
 * engine.js — trigger frames, round builder, distractors, coverage deck.
 *
 * Two kinds of frame:
 *   SHELLS      – a trigger construction with {S} (subject) and {O} (the
 *                 verb's complement) slots; any verb with an `obj` can fill it.
 *                 This keeps the trigger as the variable being drilled.
 *   HAND_FRAMES – fixed sentences for one verb, built to hit a specific trap
 *                 (ver/vir, demos/dermos, haver, pôr's circumflex, ...).
 *
 * `confusable` lists the cells whose forms are *wrong* in that frame and so
 * may be offered as distractors. It deliberately leaves out cells that would
 * be grammatical there (e.g. "Duvido que ele tivesse tempo" is fine, so
 * doubt frames in the present never offer the imperfect).
 *
 * `contrast: true` marks frames built to pit futuro do subjuntivo against
 * infinitivo pessoal. They only accept verbs whose two forms differ for that
 * person — checked on the strings, not on an "irregular" flag (ler is
 * irregular and still fails the check).
 */
(function (root) {
  'use strict';
  const VR = (root.VerbRush = root.VerbRush || {});
  const C = VR.conjugation;
  const D = VR.data;

  const ALL = ['1sg', '3sg', '1pl', '3pl'];
  const NOT_1SG = ['3sg', '1pl', '3pl'];

  const SHELLS = [
    // ---- temporal future → futSubj ----
    { id: 't-quando', cat: 'temporal', tense: 'futSubj', trigger: 'Quando', text: 'Quando {S} ___ {O}, tudo vai ficar mais fácil.', persons: ALL, confusable: ['presSubj', 'impSubj', 'persInf'], why: 'quando + an event that hasn’t happened yet → futuro do subjuntivo (not the presente do subjuntivo).' },
    { id: 't-assim', cat: 'temporal', tense: 'futSubj', trigger: 'Assim que', text: 'Assim que {S} ___ {O}, eu te ligo.', persons: NOT_1SG, confusable: ['presSubj', 'impSubj', 'persInf'], why: 'assim que + a future event → futuro do subjuntivo.' },
    { id: 't-logo', cat: 'temporal', tense: 'futSubj', trigger: 'Logo que', text: 'Logo que {S} ___ {O}, a gente sai.', persons: ['1sg', '3sg', '3pl'], confusable: ['presSubj', 'impSubj', 'persInf'], why: 'logo que + a future event → futuro do subjuntivo.' },
    { id: 't-depoisque', cat: 'temporal', tense: 'futSubj', trigger: 'Depois que', text: 'Depois que {S} ___ {O}, a gente conversa.', persons: ['1sg', '3sg', '3pl'], confusable: ['persInf', 'presSubj', 'impSubj'], contrast: true, why: 'depois que is a conjunction (needs a finite verb) + future event → futuro do subjuntivo. Depois de, a preposition, would take the infinitivo pessoal.' },
    { id: 't-enquanto', cat: 'temporal', tense: 'futSubj', trigger: 'Enquanto', text: 'Enquanto {S} não ___ {O}, ninguém vai sair daqui.', persons: ALL, confusable: ['presSubj', 'impSubj', 'persInf'], why: 'enquanto + a future (not yet realised) situation → futuro do subjuntivo.' },
    { id: 't-sempre', cat: 'temporal', tense: 'futSubj', trigger: 'Sempre que', text: 'Sempre que {S} ___ {O}, vou ficar feliz.', persons: ALL, confusable: ['impSubj', 'persInf'], why: 'sempre que + future occasions (main clause in the future) → futuro do subjuntivo.' },

    // ---- future condition ----
    { id: 'c-se', cat: 'futureCond', tense: 'futSubj', trigger: 'Se', text: 'Se {S} ___ {O}, a reunião vai ser mais curta.', persons: ALL, confusable: ['impSubj', 'presSubj', 'persInf'], why: 'se + an open, possible condition with a future main clause → futuro do subjuntivo. The imperfeito would need a conditional (seria) and make it contrary-to-fact.' },
    { id: 'c-senao', cat: 'futureCond', tense: 'futSubj', trigger: 'Se', text: 'Se {S} não ___ {O}, vamos ter problemas.', persons: ALL, confusable: ['impSubj', 'presSubj', 'persInf'], why: 'se + a possible future condition → futuro do subjuntivo.' },
    { id: 'c-seavisa', cat: 'futureCond', tense: 'futSubj', trigger: 'Se', text: 'Se {S} ___ {O}, me avisa.', persons: ['3sg', '3pl'], confusable: ['impSubj', 'presSubj', 'persInf'], why: 'se + a possible future condition, imperative main clause → futuro do subjuntivo.' },
    { id: 'c-caso', cat: 'futureCond', tense: 'presSubj', trigger: 'Caso', text: 'Caso {S} ___ {O}, a gente adia a reunião.', persons: ['1sg', '3sg', '3pl'], confusable: ['futSubj', 'persInf'], why: 'caso always takes the presente do subjuntivo (imperfeito in the past) — never the futuro, even for a future condition. Only se takes the futuro.' },

    // ---- indefinite / unknown referent ----
    { id: 'i-quem', cat: 'indefinite', tense: 'futSubj', trigger: 'Quem', text: 'Quem ___ {O} pode sair mais cedo.', persons: ['3sg'], confusable: ['persInf', 'impSubj'], why: 'quem = “whoever”, no specific person, looking forward → futuro do subjuntivo.' },
    { id: 'i-todos', cat: 'indefinite', tense: 'futSubj', trigger: 'Todos que', text: 'Todos que ___ {O} podem sair mais cedo.', persons: ['3pl'], confusable: ['persInf', 'impSubj'], why: 'todos que = “all who (end up)…”, unidentified people, future-oriented → futuro do subjuntivo.' },
    { id: 'i-alguem', cat: 'indefinite', tense: 'presSubj', trigger: 'alguém que', text: 'Procuro alguém que ___ {O}.', persons: ['3sg'], confusable: ['futSubj', 'impSubj', 'persInf'], why: 'a hypothetical antecedent (alguém que — anyone who would…) under a present main verb → presente do subjuntivo. A known person would take the indicative.' },
    { id: 'i-ninguem', cat: 'indefinite', tense: 'presSubj', trigger: 'ninguém que', text: 'Não conheço ninguém que ___ {O}.', persons: ['3sg'], confusable: ['futSubj', 'impSubj', 'persInf'], why: 'negated antecedent (ninguém que) — the person doesn’t exist → presente do subjuntivo.' },
    { id: 'i-pessoas', cat: 'indefinite', tense: 'presSubj', trigger: 'pessoas que', text: 'Precisamos de pessoas que ___ {O}.', persons: ['3pl'], confusable: ['futSubj', 'impSubj', 'persInf'], why: 'unspecified people you still need to find (pessoas que) → presente do subjuntivo.' },
    { id: 'i-alguem-past', cat: 'indefinite', tense: 'impSubj', trigger: 'alguém que', text: 'Precisávamos de alguém que ___ {O}.', persons: ['3sg'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'hypothetical antecedent under a past main verb (precisávamos) → imperfeito do subjuntivo.' },

    // ---- doubt / denial ----
    { id: 'd-duvido', cat: 'doubt', tense: 'presSubj', trigger: 'Duvido que', text: 'Duvido que {S} ___ {O}.', persons: NOT_1SG, confusable: ['futSubj', 'persInf'], why: 'duvidar que expresses doubt → subjuntivo; present main verb → presente.' },
    { id: 'd-naoacho', cat: 'doubt', tense: 'presSubj', trigger: 'Não acho que', text: 'Não acho que {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'negated belief (não acho que) → subjuntivo. Affirmative acho que takes the indicative.' },
    { id: 'd-possivel', cat: 'doubt', tense: 'presSubj', trigger: 'É possível que', text: 'É possível que {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'é possível que marks possibility, not fact → presente do subjuntivo.' },
    { id: 'd-talvez', cat: 'doubt', tense: 'presSubj', trigger: 'Talvez', text: 'Talvez {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'talvez placed before the verb → presente do subjuntivo.' },
    { id: 'd-naoverdade', cat: 'doubt', tense: 'presSubj', trigger: 'Não é verdade que', text: 'Não é verdade que {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'denial (não é verdade que) → presente do subjuntivo.' },
    { id: 'd-duvidei', cat: 'doubt', tense: 'impSubj', trigger: 'Duvidei que', text: 'Duvidei que {S} ___ {O}.', persons: NOT_1SG, confusable: ['futSubj', 'persInf'], why: 'doubt → subjuntivo; past main verb (duvidei) → imperfeito.' },
    { id: 'd-naoachei', cat: 'doubt', tense: 'impSubj', trigger: 'Não achei que', text: 'Não achei que {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'negated belief in the past (não achei que) → imperfeito do subjuntivo.' },
    { id: 'd-improvavel', cat: 'doubt', tense: 'impSubj', trigger: 'Era improvável que', text: 'Era improvável que {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'improbability → subjuntivo; past main verb (era) → imperfeito.' },

    // ---- emotion / reaction ----
    { id: 'e-espero', cat: 'emotion', tense: 'presSubj', trigger: 'Espero que', text: 'Espero que {S} ___ {O}.', persons: NOT_1SG, confusable: ['futSubj', 'persInf'], why: 'esperar que (hope) + a different subject → subjuntivo; present main → presente.' },
    { id: 'e-pena', cat: 'emotion', tense: 'presSubj', trigger: 'É uma pena que', text: 'É uma pena que {S} não ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'emotional reaction (é uma pena que) → subjuntivo even though the fact is true; present main → presente.' },
    { id: 'e-feliz', cat: 'emotion', tense: 'presSubj', trigger: 'Fico feliz que', text: 'Fico feliz que {S} ___ {O}.', persons: NOT_1SG, confusable: ['futSubj', 'persInf'], why: 'emotional reaction (fico feliz que) → presente do subjuntivo.' },
    { id: 'e-quebom', cat: 'emotion', tense: 'presSubj', trigger: 'Que bom que', text: 'Que bom que {S} ___ {O}!', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'que bom que (reaction) → presente do subjuntivo.' },
    { id: 'e-esperavamos', cat: 'emotion', tense: 'impSubj', trigger: 'Esperávamos que', text: 'Esperávamos que {S} ___ {O}.', persons: ['1sg', '3sg', '3pl'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'hope → subjuntivo; past main verb (esperávamos) → imperfeito, not presente.' },
    { id: 'e-medo', cat: 'emotion', tense: 'impSubj', trigger: 'tinha medo de que', text: 'Ela tinha medo de que {S} não ___ {O}.', persons: ['1sg', '1pl', '3pl'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'fear (ter medo de que) → subjuntivo; past main verb → imperfeito.' },
    { id: 'e-foipena', cat: 'emotion', tense: 'impSubj', trigger: 'Foi uma pena que', text: 'Foi uma pena que {S} não ___ {O}.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'reaction in the past (foi uma pena que) → imperfeito do subjuntivo.' },

    // ---- volition / influence ----
    { id: 'v-quero', cat: 'volition', tense: 'presSubj', trigger: 'Quero que', text: 'Quero que {S} ___ {O}.', persons: NOT_1SG, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'querer que + a different subject → subjuntivo (same subject would be a plain infinitive); present main → presente.' },
    { id: 'v-necessario', cat: 'volition', tense: 'presSubj', trigger: 'É necessário que', text: 'É necessário que {S} ___ {O}.', persons: ALL, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'é necessário que + finite clause → presente do subjuntivo. Drop the que and it becomes é necessário + infinitivo pessoal.' },
    { id: 'v-exige', cat: 'volition', tense: 'presSubj', trigger: 'exige que', text: 'O chefe exige que {S} ___ {O}.', persons: ['1sg', '1pl', '3pl'], confusable: ['impSubj', 'futSubj', 'persInf'], why: 'exigir que (demand) → presente do subjuntivo.' },
    { id: 'v-prefiro', cat: 'volition', tense: 'presSubj', trigger: 'Prefiro que', text: 'Prefiro que {S} ___ {O}.', persons: NOT_1SG, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'preferir que (preference over someone else’s action) → presente do subjuntivo.' },
    { id: 'v-queriam', cat: 'volition', tense: 'impSubj', trigger: 'queriam que', text: 'Eles queriam que {S} ___ {O}.', persons: ['1sg', '3sg', '1pl'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'wanting → subjuntivo; past main verb (queriam) → imperfeito.' },
    { id: 'v-eraimportante', cat: 'volition', tense: 'impSubj', trigger: 'Era importante que', text: 'Era importante que {S} ___ {O}.', persons: ALL, confusable: ['presSubj', 'futSubj', 'persInf'], why: 'era importante que + finite clause → imperfeito do subjuntivo (past main verb).' },
    { id: 'v-sugeri', cat: 'volition', tense: 'impSubj', trigger: 'Sugeri que', text: 'Sugeri que {S} ___ {O}.', persons: NOT_1SG, confusable: ['presSubj', 'futSubj', 'persInf'], why: 'suggestion → subjuntivo; past main verb (sugeri) → imperfeito.' },
    { id: 'v-pediu', cat: 'volition', tense: 'impSubj', trigger: 'pediu que', text: 'O médico pediu que {S} ___ {O}.', persons: ['1sg', '1pl', '3pl'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'request (pedir que) → subjuntivo; past main verb (pediu) → imperfeito.' },

    // ---- concession ----
    { id: 'k-embora', cat: 'concession', tense: 'presSubj', trigger: 'Embora', text: 'Embora {S} ___ {O}, a situação continua difícil.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'embora always takes the subjuntivo, even for true facts; present context → presente.' },
    { id: 'k-mesmoque', cat: 'concession', tense: 'presSubj', trigger: 'Mesmo que', text: 'Mesmo que {S} ___ {O}, não vai adiantar.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'mesmo que (even if) + future-looking main clause → presente do subjuntivo — not the futuro, despite the meaning.' },
    { id: 'k-pormais', cat: 'concession', tense: 'presSubj', trigger: 'Por mais que', text: 'Por mais que {S} ___ {O}, nada muda.', persons: ALL, confusable: ['futSubj', 'persInf'], why: 'por mais que (however much) → presente do subjuntivo.' },
    { id: 'k-embora-past', cat: 'concession', tense: 'impSubj', trigger: 'Embora', text: 'Embora {S} ___ {O}, a situação continuava difícil.', persons: ALL, confusable: ['presSubj', 'futSubj', 'persInf'], why: 'embora → subjuntivo; past context (continuava) → imperfeito.' },
    { id: 'k-aindaque', cat: 'concession', tense: 'impSubj', trigger: 'Ainda que', text: 'Ainda que {S} ___ {O}, não mudaria nada.', persons: ALL, confusable: ['presSubj', 'futSubj', 'persInf'], why: 'ainda que + hypothetical with a conditional main clause (mudaria) → imperfeito do subjuntivo.' },

    // ---- purpose / condition conjunctions ----
    { id: 'j-paraque', cat: 'conjunction', tense: 'presSubj', trigger: 'para que', text: 'Vou explicar tudo para que {S} ___ {O}.', persons: NOT_1SG, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'para que (purpose) + finite clause → presente do subjuntivo. Para without que would take the infinitivo pessoal.' },
    { id: 'j-antesque', cat: 'conjunction', tense: 'presSubj', trigger: 'antes que', text: 'Precisamos sair antes que {S} ___ {O}.', persons: ['1sg', '3sg', '3pl'], confusable: ['impSubj', 'futSubj', 'persInf'], why: 'antes que → presente do subjuntivo, never the futuro. Antes de would take the infinitivo pessoal.' },
    { id: 'j-anaoser', cat: 'conjunction', tense: 'presSubj', trigger: 'a não ser que', text: 'A festa vai acontecer, a não ser que {S} ___ {O}.', persons: ALL, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'a não ser que (unless) → presente do subjuntivo, even for a future condition.' },
    { id: 'j-contanto', cat: 'conjunction', tense: 'presSubj', trigger: 'contanto que', text: 'Eu te ajudo, contanto que {S} ___ {O}.', persons: NOT_1SG, confusable: ['impSubj', 'futSubj', 'persInf'], why: 'contanto que (provided that) → presente do subjuntivo.' },
    { id: 'j-paraque-past', cat: 'conjunction', tense: 'impSubj', trigger: 'para que', text: 'Expliquei tudo para que {S} ___ {O}.', persons: NOT_1SG, confusable: ['presSubj', 'futSubj', 'persInf'], why: 'para que → subjuntivo; past main verb (expliquei) → imperfeito.' },
    { id: 'j-antesque-past', cat: 'conjunction', tense: 'impSubj', trigger: 'antes que', text: 'Saímos antes que {S} ___ {O}.', persons: ['1sg', '3sg', '3pl'], confusable: ['presSubj', 'futSubj', 'persInf'], why: 'antes que → subjuntivo; past main verb (saímos) → imperfeito.' },

    // ---- counterfactual → impSubj ----
    { id: 'f-seria', cat: 'counterfactual', tense: 'impSubj', trigger: 'Se', text: 'Se {S} ___ {O}, tudo seria mais fácil.', persons: ALL, confusable: ['futSubj', 'presSubj', 'persInf'], why: 'se + a condition contrary to present fact, with a conditional main clause (seria) → imperfeito do subjuntivo.' },
    { id: 'f-ficaria', cat: 'counterfactual', tense: 'impSubj', trigger: 'Se', text: 'Se {S} ___ {O}, eu ficaria mais tranquilo.', persons: NOT_1SG, confusable: ['futSubj', 'presSubj', 'persInf'], why: 'se + unreal condition, conditional main clause (ficaria) → imperfeito do subjuntivo.' },
    { id: 'f-comose', cat: 'counterfactual', tense: 'impSubj', trigger: 'como se', text: 'Ele age como se {S} ___ {O}.', persons: ['1sg', '1pl', '3pl'], confusable: ['futSubj', 'presSubj', 'persInf'], why: 'como se always takes the imperfeito do subjuntivo, whatever the tense of the main clause (age is present).' },
    { id: 'f-quemdera', cat: 'counterfactual', tense: 'impSubj', trigger: 'Quem dera', text: 'Quem dera {S} ___ {O}!', persons: ALL, confusable: ['futSubj', 'presSubj', 'persInf'], why: 'quem dera (if only) — an unreal wish → imperfeito do subjuntivo.' },
    { id: 'f-seaomenos', cat: 'counterfactual', tense: 'impSubj', trigger: 'Se ao menos', text: 'Se ao menos {S} ___ {O}…', persons: ALL, confusable: ['futSubj', 'presSubj', 'persInf'], why: 'se ao menos (if only) — unreal wish → imperfeito do subjuntivo.' },

    // ---- personal infinitive ----
    { id: 'p-importante', cat: 'persInf', tense: 'persInf', trigger: 'É importante', text: 'É importante {S} ___ {O}.', persons: ALL, confusable: ['presSubj', 'futSubj', 'impSubj'], why: 'impersonal expression + explicit subject with no que → infinitivo pessoal. With que it would be the presente do subjuntivo.' },
    { id: 'p-melhor', cat: 'persInf', tense: 'persInf', trigger: 'É melhor', text: 'É melhor {S} ___ {O}.', persons: ALL, confusable: ['presSubj', 'futSubj', 'impSubj'], why: 'é melhor + subject, no que → infinitivo pessoal.' },
    { id: 'p-foibom', cat: 'persInf', tense: 'persInf', trigger: 'Foi bom', text: 'Foi bom {S} ___ {O}.', persons: ALL, confusable: ['impSubj', 'presSubj', 'futSubj'], why: 'the infinitivo pessoal carries no tense: even in a past frame (foi bom) it doesn’t shift to the imperfeito.' },
    { id: 'p-antesde', cat: 'persInf', tense: 'persInf', trigger: 'Antes de', text: 'Antes de {S} ___ {O}, me liga.', persons: ALL, confusable: ['futSubj', 'presSubj', 'impSubj'], contrast: true, why: 'antes de is a preposition; prepositions take infinitives → infinitivo pessoal. (Antes que would take the presente do subjuntivo.)' },
    { id: 'p-depoisde', cat: 'persInf', tense: 'persInf', trigger: 'Depois de', text: 'Depois de {S} ___ {O}, a gente conversa.', persons: ['1sg', '3sg', '3pl'], confusable: ['futSubj', 'presSubj', 'impSubj'], contrast: true, why: 'depois de (preposition) → infinitivo pessoal. Depois que, a conjunction, would take the futuro do subjuntivo — same meaning, different trigger.' },
    { id: 'p-ate', cat: 'persInf', tense: 'persInf', trigger: 'Até', text: 'Até {S} ___ {O}, ninguém sai daqui.', persons: ALL, confusable: ['futSubj', 'presSubj', 'impSubj'], contrast: true, why: 'até used as a preposition + its own subject → infinitivo pessoal.' },
    { id: 'p-para', cat: 'persInf', tense: 'persInf', trigger: 'para', text: 'O professor deu uma semana para {S} ___ {O}.', persons: ALL, confusable: ['futSubj', 'presSubj', 'impSubj'], contrast: true, why: 'para (preposition) + its own subject → infinitivo pessoal. For eu/ele that’s the bare infinitive — no ending to add.' },
    { id: 'p-sem', cat: 'persInf', tense: 'persInf', trigger: 'Sem', text: 'Sem {S} ___ {O}, não dá.', persons: ALL, confusable: ['presSubj', 'futSubj', 'impSubj'], why: 'sem (preposition) + its own subject → infinitivo pessoal.' },
  ];

  // Fixed sentences for specific verbs. `expect` is the answer as written by
  // hand; validateFrames() checks it against the generator.
  const HAND_FRAMES = [
    { id: 'h-ver-vir', verb: 'ver', tense: 'futSubj', person: '1sg', cat: 'temporal', trigger: 'Quando', text: 'Quando eu ___ o João, falo com ele.', expect: 'vir', contrast: true, why: 'quando + future → futuro do subjuntivo of ver: preterite viram → vi- + r = vir. Yes, spelled like the verb vir.' },
    { id: 'h-ver-virem', verb: 'ver', tense: 'futSubj', person: '3pl', cat: 'temporal', trigger: 'Quando', text: 'Quando eles ___ o resultado, vão entender.', expect: 'virem', contrast: true, why: 'quando + future → futuro do subjuntivo of ver (virem) — identical to vir’s infinitivo pessoal.' },
    { id: 'h-ver-virmos', verb: 'ver', tense: 'futSubj', person: '1pl', cat: 'futureCond', trigger: 'Se', text: 'Se nós ___ o Pedro, avisamos você.', expect: 'virmos', contrast: true, why: 'se + possible future → futuro do subjuntivo of ver: virmos (not vermos, which is the infinitivo pessoal).' },
    { id: 'h-vir-virem', verb: 'vir', tense: 'persInf', person: '3pl', cat: 'persInf', trigger: 'É importante', text: 'É importante eles ___ amanhã.', expect: 'virem', contrast: true, why: 'impersonal expression + subject, no que → infinitivo pessoal of vir: virem. Same string as ver’s futuro do subjuntivo, different verb.' },
    { id: 'h-vir-vierem', verb: 'vir', tense: 'futSubj', person: '3pl', cat: 'futureCond', trigger: 'Se', text: 'Se eles ___ amanhã, a gente sai.', expect: 'vierem', contrast: true, why: 'se + possible future → futuro do subjuntivo of vir: vieram → vie- + rem = vierem.' },
    { id: 'h-dar-dermos', verb: 'dar', tense: 'futSubj', person: '1pl', cat: 'temporal', trigger: 'Quando', text: 'Quando nós ___ a festa, você vem?', expect: 'dermos', contrast: true, why: 'quando + future → futuro do subjuntivo: dermos. Not demos (pres. subj.) or darmos (pers. inf.).' },
    { id: 'h-dar-demos', confusable: ['futSubj', 'persInf'], verb: 'dar', tense: 'presSubj', person: '1pl', cat: 'emotion', trigger: 'Espero que', text: 'Espero que nós ___ uma boa impressão.', expect: 'demos', why: 'espero que → presente do subjuntivo: demos (same spelling as the preterite indicative). Not dermos (fut. subj.).' },
    { id: 'h-dar-darmos', verb: 'dar', tense: 'persInf', person: '1pl', cat: 'persInf', trigger: 'É importante', text: 'É importante nós ___ uma resposta hoje.', expect: 'darmos', contrast: true, why: 'impersonal expression + subject, no que → infinitivo pessoal: darmos (from the plain infinitive, not the preterite stem).' },
    { id: 'h-haver-houver', verb: 'haver', tense: 'futSubj', person: '3sg', cat: 'futureCond', trigger: 'Se', text: 'Se ___ tempo, a gente passa lá.', expect: 'houver', why: 'se + possible future → futuro do subjuntivo of impersonal haver: houver.' },
    { id: 'h-haver-caso', confusable: ['futSubj', 'persInf'], verb: 'haver', tense: 'presSubj', person: '3sg', cat: 'futureCond', trigger: 'Caso', text: 'Caso ___ algum problema, me liga.', expect: 'haja', why: 'caso → presente do subjuntivo (never the futuro): haja.' },
    { id: 'h-haver-houvesse', verb: 'haver', tense: 'impSubj', person: '3sg', cat: 'counterfactual', trigger: 'Se', text: 'Se ___ mais tempo, eu ficaria.', expect: 'houvesse', why: 'se + unreal condition, conditional main clause (ficaria) → imperfeito do subjuntivo: houvesse.' },
    { id: 'h-haver-duvido', confusable: ['futSubj', 'persInf'], verb: 'haver', tense: 'presSubj', person: '3sg', cat: 'doubt', trigger: 'Duvido que', text: 'Duvido que ___ vagas.', expect: 'haja', why: 'doubt → presente do subjuntivo; impersonal haver stays singular even with a plural noun: haja vagas.' },
    { id: 'h-haver-embora', verb: 'haver', tense: 'impSubj', person: '3sg', cat: 'concession', trigger: 'Embora', text: 'Embora ___ vagas, ninguém se inscreveu.', expect: 'houvesse', why: 'embora → subjuntivo; past context → imperfeito: houvesse (singular — impersonal haver).' },
    { id: 'h-ser-fosse', verb: 'ser', tense: 'impSubj', person: '1sg', cat: 'counterfactual', trigger: 'Se', text: 'Se eu ___ você, não faria isso.', expect: 'fosse', why: 'se + contrary-to-fact (I’m not you) with conditional main → imperfeito do subjuntivo of ser: fosse.' },
    { id: 'h-ir-for', verb: 'ir', tense: 'futSubj', person: '1sg', cat: 'futureCond', trigger: 'Se', text: 'Se eu ___ ao mercado, compro pão.', expect: 'for', contrast: true, why: 'se + possible future → futuro do subjuntivo of ir: for (same form as ser’s).' },
    { id: 'h-ser-for', verb: 'ser', tense: 'futSubj', person: '1sg', cat: 'temporal', trigger: 'Quando', text: 'Quando eu ___ mais velho, vou morar na praia.', expect: 'for', contrast: true, why: 'quando + future → futuro do subjuntivo of ser: for (same form as ir’s).' },
    { id: 'h-ir-onde', confusable: ['futSubj', 'persInf'], verb: 'ir', tense: 'presSubj', person: '3sg', cat: 'indefinite', trigger: 'Onde quer que', text: 'Onde quer que você ___, eu vou junto.', expect: 'vá', why: 'onde quer que (wherever) → presente do subjuntivo: vá.' },
    { id: 'h-por-porem', verb: 'pôr', tense: 'persInf', person: '3pl', cat: 'persInf', trigger: 'É importante', text: 'É importante vocês ___ a mesa antes das oito.', expect: 'porem', contrast: true, why: 'impersonal expression + subject → infinitivo pessoal: porem — the circumflex disappears once an ending is added.' },
    { id: 'h-por-bare', verb: 'pôr', tense: 'persInf', person: '1sg', cat: 'persInf', trigger: 'para', text: 'Ela me chamou para eu ___ a mesa.', expect: 'pôr', contrast: true, why: 'para eu + infinitivo pessoal: bare pôr, circumflex kept, no ending for eu.' },
    { id: 'h-querer-como', confusable: ['impSubj', 'persInf'], verb: 'querer', tense: 'futSubj', person: '3sg', cat: 'indefinite', trigger: 'como', text: 'Faça como você ___.', expect: 'quiser', why: 'como + an open-ended future choice → futuro do subjuntivo: quiser.' },
    { id: 'h-querer-quem', confusable: ['impSubj', 'persInf'], verb: 'querer', tense: 'futSubj', person: '3sg', cat: 'indefinite', trigger: 'Quem', text: 'Quem ___ pode vir.', expect: 'quiser', why: 'quem = whoever, future-oriented → futuro do subjuntivo: quiser.' },
    { id: 'h-querer-queira', confusable: ['futSubj', 'persInf'], verb: 'querer', tense: 'presSubj', person: '3sg', cat: 'emotion', trigger: 'Espero que', text: 'Espero que ela ___ participar.', expect: 'queira', why: 'espero que → presente do subjuntivo: queira (suppletive — not *quera from quero).' },
    { id: 'h-poder-tudo', confusable: ['impSubj', 'persInf'], verb: 'poder', tense: 'futSubj', person: '1sg', cat: 'indefinite', trigger: 'tudo o que', text: 'Vou fazer tudo o que eu ___.', expect: 'puder', why: 'tudo o que + open-ended future → futuro do subjuntivo: puder.' },
    { id: 'h-dizer-oque', confusable: ['impSubj', 'persInf'], verb: 'dizer', tense: 'futSubj', person: '3sg', cat: 'indefinite', trigger: 'O que', text: 'O que você ___, eu faço.', expect: 'disser', why: 'o que = whatever (not yet said) → futuro do subjuntivo: disser.' },
    { id: 'h-saber-soubesse', verb: 'saber', tense: 'impSubj', person: '1sg', cat: 'counterfactual', trigger: 'Se', text: 'Se eu ___ a resposta, te diria.', expect: 'soubesse', why: 'se + contrary-to-fact with conditional main (diria) → imperfeito do subjuntivo: soubesse.' },
    { id: 'h-ler-bare', verb: 'ler', tense: 'persInf', person: '1sg', cat: 'persInf', trigger: 'para', text: 'O professor me deu o livro para eu ___.', expect: 'ler', why: 'para eu + infinitivo pessoal: for eu it’s the bare infinitive. Adding an ending is the trap.' },
    { id: 'h-estar-prontos', verb: 'estar', tense: 'futSubj', person: '1pl', cat: 'temporal', trigger: 'Quando', text: 'Quando nós ___ prontos, saímos.', expect: 'estivermos', contrast: true, why: 'quando + future → futuro do subjuntivo: estivermos.' },
    { id: 'h-trazer-depoisde', verb: 'trazer', tense: 'persInf', person: '3pl', cat: 'persInf', trigger: 'Depois de', text: 'Depois de eles ___ o vinho, a festa começou.', expect: 'trazerem', contrast: true, why: 'depois de (preposition) → infinitivo pessoal: trazerem, built on the infinitive — no preterite stem, no tense.' },
    { id: 'h-trazer-depoisque', verb: 'trazer', tense: 'futSubj', person: '3pl', cat: 'temporal', trigger: 'Depois que', text: 'Depois que eles ___ o vinho, a festa começa.', expect: 'trouxerem', contrast: true, why: 'depois que (conjunction) + future → futuro do subjuntivo: trouxerem, built on the preterite stem.' },
    { id: 'h-fazer-fizessemos', verb: 'fazer', tense: 'impSubj', person: '1pl', cat: 'counterfactual', trigger: 'Se', text: 'Se nós ___ isso, seria um desastre.', expect: 'fizéssemos', why: 'se + hypothetical, conditional main (seria) → imperfeito do subjuntivo: fizéssemos (note the accent).' },
  ];

  const SUBJECTS = { '1sg': ['eu'], '3sg': ['ele', 'ela', 'você'], '1pl': ['nós'], '3pl': ['eles', 'elas', 'vocês'] };

  // ---------------- helpers ----------------

  function makeRng(seed) {
    if (seed == null) return Math.random;
    let s = seed >>> 0;
    return function () {
      // mulberry32
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fpDiffers(verb, person) {
    return C.form(verb, 'futSubj', person) !== C.form(verb, 'persInf', person);
  }

  function genericVerbs() {
    return D.VERB_LIST.filter((v) => v.obj);
  }

  function eligibleVerbs(shell, person) {
    return genericVerbs().filter((v) => !shell.contrast || fpDiffers(v, person));
  }

  function objFor(verb, person) {
    const plural = person === '1pl' || person === '3pl';
    return plural && verb.objPl ? verb.objPl : verb.obj;
  }

  // ---------------- frame construction ----------------

  function finishFrame(base, verb, rng) {
    const answer = C.form(verb, base.tense, base.person);
    const [before, after] = base.sentence.split('___');
    const options = buildOptions(verb, base.tense, base.person, base.confusable, rng);
    return Object.assign(base, { answer, before, after, options, verbGloss: verb.gloss });
  }

  function fromShell(shell, verbInf, person, rng) {
    const verb = D.VERBS[verbInf];
    const sentence = shell.text.replace('{S}', pick(SUBJECTS[person], rng)).replace('{O}', objFor(verb, person)).replace(/\s+/g, ' ').replace(' ,', ',');
    return finishFrame(
      {
        id: shell.id + ':' + verbInf + ':' + person,
        source: shell.id,
        cat: shell.cat,
        tense: shell.tense,
        person,
        verb: verbInf,
        trigger: shell.trigger,
        why: shell.why,
        confusable: shell.confusable,
        contrast: !!shell.contrast,
        sentence,
      },
      verb,
      rng
    );
  }

  function fromHand(h, rng) {
    const verb = D.VERBS[h.verb];
    return finishFrame(
      {
        id: h.id,
        source: h.id,
        cat: h.cat,
        tense: h.tense,
        person: h.person,
        verb: h.verb,
        trigger: h.trigger,
        why: h.why,
        confusable: h.confusable || C.TENSES.filter((t) => t !== h.tense),
        contrast: !!h.contrast,
        sentence: h.text,
      },
      verb,
      rng
    );
  }

  /*
   * Distractors: other cells of the same verb, identical spellings collapsed.
   * Tier 1: confusable tenses, same person (the trigger-level near-miss).
   * Tier 2: correct tense, other person.
   * Tier 3: confusable tenses, other persons.
   * Usually both distractors come from tier 1; sometimes one comes from tier 2
   * so agreement stays honest.
   */
  function buildOptions(verb, tense, person, confusable, rng) {
    const answer = C.form(verb, tense, person);
    const tier1 = [], tier2 = [], tier3 = [];
    for (const t of C.TENSES) {
      for (const p of C.PERSONS) {
        if (t === tense && p === person) continue;
        const cell = { tense: t, person: p };
        if (confusable.includes(t) && p === person) tier1.push(cell);
        else if (t === tense) tier2.push(cell);
        else if (confusable.includes(t)) tier3.push(cell);
      }
    }
    const order = rng() < 0.7 ? [shuffle(tier1, rng), shuffle(tier2, rng), shuffle(tier3, rng)] : [shuffle(tier1, rng).slice(0, 1), shuffle(tier2, rng), shuffle(tier1, rng), shuffle(tier3, rng)];
    const seen = new Set([answer]);
    const chosen = [];
    for (const tier of order) {
      for (const cell of tier) {
        if (chosen.length === 2) break;
        const f = C.form(verb, cell.tense, cell.person);
        if (seen.has(f)) continue;
        seen.add(f);
        chosen.push(f);
      }
    }
    const opts = [answer, ...chosen].map((f) => ({ form: f, correct: f === answer, cells: C.cellsForForm(verb, f) }));
    return shuffle(opts, rng);
  }

  // ---------------- candidates & coverage ----------------

  function candidatesForCell(tense, person) {
    const out = [];
    for (const s of SHELLS) {
      if (s.tense !== tense || !s.persons.includes(person)) continue;
      const verbs = eligibleVerbs(s, person);
      if (verbs.length) out.push({ kind: 'shell', cat: s.cat, shell: s, verbs: verbs.map((v) => v.inf) });
    }
    for (const h of HAND_FRAMES) {
      if (h.tense === tense && h.person === person) out.push({ kind: 'hand', cat: h.cat, hand: h });
    }
    return out;
  }

  function coverageReport() {
    const rows = [];
    for (const t of C.TENSES) {
      for (const p of C.PERSONS) {
        const cands = candidatesForCell(t, p);
        const shells = cands.filter((c) => c.kind === 'shell');
        rows.push({
          tense: t,
          person: p,
          shells: shells.length,
          combos: shells.reduce((n, c) => n + c.verbs.length, 0),
          hand: cands.length - shells.length,
          cats: [...new Set(cands.map((c) => c.cat))],
        });
      }
    }
    return rows;
  }

  // Build-time checks. Returns a list of problems (empty = OK).
  function validateFrames() {
    const errors = [];
    for (const r of coverageReport()) {
      if (r.combos + r.hand === 0) errors.push('Unreachable cell: ' + C.cellLabel(r.tense, r.person));
    }
    for (const s of SHELLS) {
      if (!s.text.includes('___')) errors.push(s.id + ': no blank');
      if (!s.text.includes(s.trigger)) errors.push(s.id + ': trigger "' + s.trigger + '" not in text');
      if (!D.TRIGGER_CATEGORIES[s.cat]) errors.push(s.id + ': unknown category ' + s.cat);
      if (s.confusable.includes(s.tense)) errors.push(s.id + ': confusable includes its own tense');
      if (s.contrast) {
        for (const p of s.persons) {
          for (const v of eligibleVerbs(s, p)) {
            if (!fpDiffers(v, p)) errors.push(s.id + ': contrast frame admits ' + v.inf + ' ' + p);
          }
        }
      }
    }
    for (const h of HAND_FRAMES) {
      const verb = D.VERBS[h.verb];
      if (!verb) { errors.push(h.id + ': unknown verb ' + h.verb); continue; }
      const got = C.form(verb, h.tense, h.person);
      if (h.expect && got !== h.expect) errors.push(h.id + ': expected ' + h.expect + ', generator gives ' + got);
      if (!h.text.includes(h.trigger)) errors.push(h.id + ': trigger "' + h.trigger + '" not in text');
      if (h.contrast && !fpDiffers(verb, h.person)) errors.push(h.id + ': contrast frame on verb whose fut. subj. = pers. inf.');
    }
    return errors;
  }

  // ---------------- session / round builder ----------------

  /*
   * Coverage deck: the 16 cells are shuffled and dealt without replacement,
   * so every cell comes up once per 16 questions. Within a cell, the trigger
   * category seen least this session wins; hand frames get a fixed share.
   */
  function createSession(opts) {
    opts = opts || {};
    return { rng: makeRng(opts.seed), deck: [], catCounts: {}, recentSources: [], handShare: opts.handShare == null ? 0.3 : opts.handShare };
  }

  function nextQuestion(session) {
    const rng = session.rng;
    if (!session.deck.length) {
      const cells = [];
      for (const t of C.TENSES) for (const p of C.PERSONS) cells.push({ tense: t, person: p });
      session.deck = shuffle(cells, rng);
    }
    const cell = session.deck.pop();
    let cands = candidatesForCell(cell.tense, cell.person);
    const fresh = cands.filter((c) => !session.recentSources.includes(c.kind === 'shell' ? c.shell.id : c.hand.id));
    if (fresh.length) cands = fresh;

    const byCat = {};
    for (const c of cands) (byCat[c.cat] = byCat[c.cat] || []).push(c);
    const cats = Object.keys(byCat);
    const min = Math.min(...cats.map((k) => session.catCounts[k] || 0));
    const cat = pick(cats.filter((k) => (session.catCounts[k] || 0) === min), rng);
    const pool = byCat[cat];
    const hands = pool.filter((c) => c.kind === 'hand');
    const shells = pool.filter((c) => c.kind === 'shell');

    let q;
    if (hands.length && (!shells.length || rng() < session.handShare)) {
      q = fromHand(pick(hands, rng).hand, rng);
    } else {
      const c = pick(shells, rng);
      q = fromShell(c.shell, pick(c.verbs, rng), cell.person, rng);
    }
    session.catCounts[cat] = (session.catCounts[cat] || 0) + 1;
    session.recentSources.push(q.source);
    if (session.recentSources.length > 6) session.recentSources.shift();
    return q;
  }

  VR.engine = { SHELLS, HAND_FRAMES, SUBJECTS, createSession, nextQuestion, buildOptions, fromShell, fromHand, candidatesForCell, coverageReport, validateFrames, makeRng };
  if (typeof module !== 'undefined' && module.exports) module.exports = VR.engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
