/*
 * data.js — verb principal parts and trigger-category tags.
 *
 * Per verb, store ONLY what can't be generated:
 *   pres1sg  – irregular 1sg present indicative (present subj. derives from it)
 *   presSubj – full suppletive present subj. [eu, ele, nós, eles], closed set:
 *              ser estar ir saber dar querer haver
 *   pret3pl  – irregular 3pl preterite, full form (the stem is it minus -ram)
 * obj/objPl is the complement used when the verb fills a generic frame;
 * verbs without obj (haver) appear only in hand-written frames.
 */
(function (root) {
  'use strict';
  const VR = (root.VerbRush = root.VerbRush || {});

  const VERB_LIST = [
    // ---- seed irregulars ----
    { inf: 'ser', gloss: 'be', presSubj: ['seja', 'seja', 'sejamos', 'sejam'], pret3pl: 'foram', obj: 'mais paciente', objPl: 'mais pacientes', note: 'shares its preterite stem (fo-) with ir' },
    { inf: 'estar', gloss: 'be (located/state)', presSubj: ['esteja', 'esteja', 'estejamos', 'estejam'], pret3pl: 'estiveram', obj: 'em casa' },
    { inf: 'ir', gloss: 'go', presSubj: ['vá', 'vá', 'vamos', 'vão'], pret3pl: 'foram', obj: 'à festa', note: 'shares its preterite stem (fo-) with ser' },
    { inf: 'ter', gloss: 'have', pres1sg: 'tenho', pret3pl: 'tiveram', obj: 'tempo' },
    { inf: 'haver', gloss: 'there be (impersonal)', presSubj: ['haja', 'haja', 'hajamos', 'hajam'], pret3pl: 'houveram' },
    { inf: 'fazer', gloss: 'do/make', pres1sg: 'faço', pret3pl: 'fizeram', obj: 'o jantar' },
    { inf: 'poder', gloss: 'be able to', pres1sg: 'posso', pret3pl: 'puderam', obj: 'ajudar' },
    { inf: 'querer', gloss: 'want', presSubj: ['queira', 'queira', 'queiramos', 'queiram'], pret3pl: 'quiseram', obj: 'participar', note: 'queira does not derive from quero (that would give *quera)' },
    { inf: 'saber', gloss: 'know', presSubj: ['saiba', 'saiba', 'saibamos', 'saibam'], pret3pl: 'souberam', obj: 'a verdade' },
    { inf: 'dizer', gloss: 'say/tell', pres1sg: 'digo', pret3pl: 'disseram', obj: 'a verdade' },
    { inf: 'trazer', gloss: 'bring', pres1sg: 'trago', pret3pl: 'trouxeram', obj: 'o vinho' },
    { inf: 'vir', gloss: 'come', pres1sg: 'venho', pret3pl: 'vieram', obj: 'para o jantar', note: 'its personal infinitive (vir, virmos, virem) is spelled exactly like ver’s future subjunctive' },
    { inf: 'pôr', gloss: 'put / set (the table)', pres1sg: 'ponho', pret3pl: 'puseram', obj: 'a mesa', note: 'bare infinitive keeps the circumflex (pôr); pormos/porem drop it' },
    { inf: 'dar', gloss: 'give', presSubj: ['dê', 'dê', 'demos', 'deem'], pret3pl: 'deram', obj: 'uma festa', note: 'nós: demos (pres. subj.) vs dermos (fut. subj.) vs darmos (pers. inf.)' },
    { inf: 'ver', gloss: 'see', pres1sg: 'vejo', pret3pl: 'viram', obj: 'o filme', note: 'future subj. vir/virmos/virem collides with the verb vir’s infinitive forms' },
    // ler's preterite (leram) is regular, so no pret3pl: its future subj. and
    // personal infinitive coincide, same as any regular verb.
    { inf: 'ler', gloss: 'read', pres1sg: 'leio', obj: 'o contrato' },

    // ---- 1sg stem-change verbs: only pres1sg stored, everything else regular ----
    { inf: 'dormir', gloss: 'sleep', pres1sg: 'durmo', obj: 'cedo' },
    { inf: 'pedir', gloss: 'ask for', pres1sg: 'peço', obj: 'ajuda' },
    { inf: 'ouvir', gloss: 'hear', pres1sg: 'ouço', obj: 'a notícia' },
    { inf: 'perder', gloss: 'lose/miss', pres1sg: 'perco', obj: 'o voo' },
    { inf: 'seguir', gloss: 'follow', pres1sg: 'sigo', obj: 'o plano' },
    { inf: 'conseguir', gloss: 'get/manage', pres1sg: 'consigo', obj: 'o emprego' },

    // ---- regular (orthographic rules exercised where noted) ----
    { inf: 'chegar', gloss: 'arrive', obj: 'cedo' }, // g→gu
    { inf: 'pagar', gloss: 'pay', obj: 'a conta' }, // g→gu
    { inf: 'buscar', gloss: 'pick up', obj: 'as crianças' }, // c→qu
    { inf: 'ficar', gloss: 'stay', obj: 'em casa' }, // c→qu
    { inf: 'começar', gloss: 'start', obj: 'o projeto' }, // ç→c
    { inf: 'falar', gloss: 'speak', obj: 'com o chefe' },
    { inf: 'estudar', gloss: 'study', obj: 'para a prova' },
    { inf: 'aprender', gloss: 'learn', obj: 'português' },
    { inf: 'escrever', gloss: 'write', obj: 'o relatório' },
    { inf: 'conhecer', gloss: 'get to know', obj: 'a cidade' }, // c→ç before o/a
    { inf: 'abrir', gloss: 'open', obj: 'a loja' },
    { inf: 'decidir', gloss: 'decide', obj: 'logo' },
    { inf: 'dirigir', gloss: 'drive', obj: 'com cuidado' }, // g→j before o/a
  ];

  const VERBS = {};
  for (const v of VERB_LIST) VERBS[v.inf] = v;

  // Stated as irregular in the seed table (drives UI badges, not generation).
  const SEED_IRREGULARS = ['ser', 'estar', 'ir', 'ter', 'haver', 'fazer', 'poder', 'querer', 'saber', 'dizer', 'trazer', 'vir', 'pôr', 'dar', 'ver', 'ler'];

  /*
   * Trigger categories. `rule` is the category-level summary shown in the
   * scorecard; each frame carries its own one-line `why` for miss feedback.
   */
  const TRIGGER_CATEGORIES = {
    temporal: { label: 'Temporal future', rule: 'quando / assim que / logo que / depois que / enquanto + a future event → futuro do subjuntivo' },
    futureCond: { label: 'Future condition', rule: 'se + open future condition → futuro do subjuntivo; caso → presente do subjuntivo' },
    indefinite: { label: 'Indefinite referent', rule: 'quem / o que / como + future → futuro; alguém que / ninguém que → presente (or imperfeito)' },
    doubt: { label: 'Doubt / denial', rule: 'duvido que, não acho que, talvez, é possível que → subjuntivo; tense follows the main verb' },
    emotion: { label: 'Emotion / reaction', rule: 'espero que, é uma pena que, fico feliz que → subjuntivo; tense follows the main verb' },
    volition: { label: 'Volition / influence', rule: 'quero que, é necessário que, pedir que → subjuntivo; tense follows the main verb' },
    concession: { label: 'Concession', rule: 'embora, mesmo que, ainda que, por mais que → subjuntivo' },
    conjunction: { label: 'Purpose / condition conj.', rule: 'para que, antes que, a não ser que, contanto que → subjuntivo (never the futuro)' },
    counterfactual: { label: 'Counterfactual', rule: 'se + contrary-to-fact, como se, quem dera → imperfeito do subjuntivo' },
    persInf: { label: 'Personal infinitive', rule: 'preposition or impersonal expression + its own subject, no que → infinitivo pessoal' },
  };

  VR.data = { VERBS, VERB_LIST, SEED_IRREGULARS, TRIGGER_CATEGORIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = VR.data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
