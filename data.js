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

  /*
   * Learner profile. Duolingo Score 129 = top of the B2 band (100–129), i.e.
   * roughly the end of the Portuguese course. Vocabulary targets B2: the verb
   * pool adds derived irregulars (manter, propor, prever, intervir…) and the
   * complements are adult-register, not "ter tempo / fazer o jantar" only.
   */
  const LEARNER = { source: 'Duolingo Score', score: 129, cefr: 'B2', note: 'top of the B2 band (100–129)' };

  // tier: 'core' = the seed set; 'b2' = added for the B2 vocabulary level.
  // obj / objPl may be a string or an index-aligned array of complements.
  const VERB_LIST = [
    // ---- seed irregulars ----
    { inf: 'ser', tier: 'core', gloss: 'be', presSubj: ['seja', 'seja', 'sejamos', 'sejam'], pret3pl: 'foram', obj: ['mais paciente', 'mais flexível', 'responsável pelo projeto'], objPl: ['mais pacientes', 'mais flexíveis', 'responsáveis pelo projeto'], note: 'shares its preterite stem (fo-) with ir' },
    { inf: 'estar', tier: 'core', gloss: 'be (located/state)', presSubj: ['esteja', 'esteja', 'estejamos', 'estejam'], pret3pl: 'estiveram', obj: ['em casa', 'de acordo', 'a par da situação'] },
    { inf: 'ir', tier: 'core', gloss: 'go', presSubj: ['vá', 'vá', 'vamos', 'vão'], pret3pl: 'foram', obj: ['à festa', 'à reunião', 'ao cartório'], note: 'shares its preterite stem (fo-) with ser' },
    { inf: 'ter', tier: 'core', gloss: 'have', pres1sg: 'tenho', pret3pl: 'tiveram', obj: ['tempo', 'mais autonomia', 'coragem de reclamar', 'paciência'] },
    { inf: 'haver', tier: 'core', gloss: 'there be (impersonal)', presSubj: ['haja', 'haja', 'hajamos', 'hajam'], pret3pl: 'houveram' },
    { inf: 'fazer', tier: 'core', gloss: 'do/make', pres1sg: 'faço', pret3pl: 'fizeram', obj: ['o jantar', 'as contas', 'uma proposta concreta'] },
    { inf: 'poder', tier: 'core', gloss: 'be able to', pres1sg: 'posso', pret3pl: 'puderam', obj: ['ajudar', 'comparecer', 'vir à reunião'] },
    { inf: 'querer', tier: 'core', gloss: 'want', presSubj: ['queira', 'queira', 'queiramos', 'queiram'], pret3pl: 'quiseram', obj: ['participar', 'negociar', 'assinar o contrato'], note: 'queira does not derive from quero (that would give *quera)' },
    { inf: 'saber', tier: 'core', gloss: 'know', presSubj: ['saiba', 'saiba', 'saibamos', 'saibam'], pret3pl: 'souberam', obj: ['a verdade', 'lidar com a pressão', 'onde fica o cartório'] },
    { inf: 'dizer', tier: 'core', gloss: 'say/tell', pres1sg: 'digo', pret3pl: 'disseram', obj: ['a verdade', 'algo relevante'] },
    { inf: 'trazer', tier: 'core', gloss: 'bring', pres1sg: 'trago', pret3pl: 'trouxeram', obj: ['o vinho', 'os documentos', 'boas notícias'] },
    { inf: 'vir', tier: 'core', gloss: 'come', pres1sg: 'venho', pret3pl: 'vieram', obj: ['para o jantar', 'à reunião'], note: 'its personal infinitive (vir, virmos, virem) is spelled exactly like ver’s future subjunctive' },
    { inf: 'pôr', tier: 'core', gloss: 'put / set (the table)', pres1sg: 'ponho', pret3pl: 'puseram', obj: ['a mesa', 'tudo em ordem'], note: 'bare infinitive keeps the circumflex (pôr); pormos/porem drop it' },
    { inf: 'dar', tier: 'core', gloss: 'give', presSubj: ['dê', 'dê', 'demos', 'deem'], pret3pl: 'deram', obj: ['uma festa', 'conta do recado', 'um jeito nisso'], note: 'nós: demos (pres. subj.) vs dermos (fut. subj.) vs darmos (pers. inf.)' },
    { inf: 'ver', tier: 'core', gloss: 'see', pres1sg: 'vejo', pret3pl: 'viram', obj: ['o filme', 'o resultado', 'o lado bom'], note: 'future subj. vir/virmos/virem collides with the verb vir’s infinitive forms' },
    // ler's preterite (leram) is regular, so no pret3pl: its future subj. and
    // personal infinitive coincide, same as any regular verb.
    { inf: 'ler', tier: 'core', gloss: 'read', pres1sg: 'leio', obj: ['o contrato', 'o edital com atenção'] },

    // ---- 1sg stem-change verbs: only pres1sg stored, everything else regular ----
    { inf: 'dormir', tier: 'core', gloss: 'sleep', pres1sg: 'durmo', obj: 'cedo' },
    { inf: 'pedir', tier: 'core', gloss: 'ask for', pres1sg: 'peço', obj: ['ajuda', 'demissão'] },
    { inf: 'ouvir', tier: 'core', gloss: 'hear', pres1sg: 'ouço', obj: ['a notícia', 'os dois lados'] },
    { inf: 'perder', tier: 'core', gloss: 'lose/miss', pres1sg: 'perco', obj: ['o voo', 'o prazo'] },
    { inf: 'seguir', tier: 'core', gloss: 'follow', pres1sg: 'sigo', obj: ['o plano', 'as orientações'] },
    { inf: 'conseguir', tier: 'core', gloss: 'get/manage', pres1sg: 'consigo', obj: ['o emprego', 'o financiamento'] },

    // ---- regular (orthographic rules exercised where noted) ----
    { inf: 'chegar', tier: 'core', gloss: 'arrive', obj: ['cedo', 'a um acordo'] }, // g→gu
    { inf: 'pagar', tier: 'core', gloss: 'pay', obj: ['a conta', 'o aluguel em dia'] }, // g→gu
    { inf: 'buscar', tier: 'core', gloss: 'pick up / seek', obj: ['as crianças', 'uma alternativa'] }, // c→qu
    { inf: 'ficar', tier: 'core', gloss: 'stay', obj: ['em casa', 'até o fim'] }, // c→qu
    { inf: 'começar', tier: 'core', gloss: 'start', obj: ['o projeto', 'a obra'] }, // ç→c
    { inf: 'falar', tier: 'core', gloss: 'speak', obj: ['com o chefe', 'com o síndico'] },
    { inf: 'estudar', tier: 'core', gloss: 'study', obj: ['para a prova', 'para o concurso'] },
    { inf: 'aprender', tier: 'core', gloss: 'learn', obj: ['português', 'com os erros'] },
    { inf: 'escrever', tier: 'core', gloss: 'write', obj: ['o relatório', 'o parecer'] },
    { inf: 'conhecer', tier: 'core', gloss: 'get to know', obj: ['a cidade', 'o novo diretor'] }, // c→ç before o/a
    { inf: 'abrir', tier: 'core', gloss: 'open', obj: ['a loja', 'o jogo'] },
    { inf: 'decidir', tier: 'core', gloss: 'decide', obj: ['logo', 'sem pressão'] },
    { inf: 'dirigir', tier: 'core', gloss: 'drive', obj: ['com cuidado', 'na estrada à noite'] }, // g→j before o/a

    // ---- B2 additions: derived irregulars (inherit the base verb's pattern) ----
    { inf: 'manter', tier: 'b2', gloss: 'keep / maintain', pres1sg: 'mantenho', pret3pl: 'mantiveram', obj: ['a calma', 'a palavra', 'o sigilo'], note: 'conjugates like ter: mantivesse, mantiver' },
    { inf: 'obter', tier: 'b2', gloss: 'obtain', pres1sg: 'obtenho', pret3pl: 'obtiveram', obj: ['a autorização', 'os resultados esperados'], note: 'conjugates like ter' },
    { inf: 'conter', tier: 'b2', gloss: 'contain / hold back', pres1sg: 'contenho', pret3pl: 'contiveram', obj: ['os gastos', 'a crise'], note: 'conjugates like ter' },
    { inf: 'propor', tier: 'b2', gloss: 'propose', pres1sg: 'proponho', pret3pl: 'propuseram', obj: ['uma solução', 'um acordo'], note: 'like pôr, but compounds never carry the circumflex: propor' },
    { inf: 'prever', tier: 'b2', gloss: 'foresee', pres1sg: 'prevejo', pret3pl: 'previram', obj: ['o problema', 'as consequências'], note: 'like ver: future subj. previr, not *prever' },
    { inf: 'rever', tier: 'b2', gloss: 'review / revise', pres1sg: 'revejo', pret3pl: 'reviram', obj: ['a proposta', 'os números'], note: 'like ver: future subj. revir' },
    { inf: 'desfazer', tier: 'b2', gloss: 'undo / clear up', pres1sg: 'desfaço', pret3pl: 'desfizeram', obj: ['o mal-entendido'], note: 'conjugates like fazer' },
    { inf: 'satisfazer', tier: 'b2', gloss: 'satisfy / meet', pres1sg: 'satisfaço', pret3pl: 'satisfizeram', obj: ['as exigências do cliente'], note: 'conjugates like fazer' },
    { inf: 'intervir', tier: 'b2', gloss: 'intervene', pres1sg: 'intervenho', pret3pl: 'intervieram', obj: ['na discussão', 'a tempo'], note: 'conjugates like vir: interviesse, intervier' },
    // requerer is NOT a compound of querer: 1sg requeiro, regular preterite.
    { inf: 'requerer', tier: 'b2', gloss: 'apply for / require', pres1sg: 'requeiro', obj: ['o visto', 'a aposentadoria'], note: 'not like querer: requeresse, requerer (regular preterite)' },

    // ---- B2 additions: stem-change and regular ----
    { inf: 'impedir', tier: 'b2', gloss: 'prevent', pres1sg: 'impeço', obj: ['o acordo', 'a votação'] },
    { inf: 'sugerir', tier: 'b2', gloss: 'suggest', pres1sg: 'sugiro', obj: ['outra abordagem'] },
    { inf: 'repetir', tier: 'b2', gloss: 'repeat', pres1sg: 'repito', obj: ['o mesmo erro'] },
    { inf: 'sentir', tier: 'b2', gloss: 'feel', pres1sg: 'sinto', obj: ['falta de casa', 'o peso da decisão'] },
    { inf: 'alcançar', tier: 'b2', gloss: 'reach', obj: ['a meta', 'um consenso'] }, // ç→c
    { inf: 'esclarecer', tier: 'b2', gloss: 'clarify', obj: ['a dúvida', 'o mal-entendido'] }, // c→ç
    { inf: 'atingir', tier: 'b2', gloss: 'reach / hit', obj: ['o objetivo'] }, // g→j
    { inf: 'arcar', tier: 'b2', gloss: 'bear (costs)', obj: ['com as consequências', 'com os custos'] }, // c→qu
    { inf: 'investigar', tier: 'b2', gloss: 'investigate', obj: ['o caso'] }, // g→gu
    { inf: 'reconhecer', tier: 'b2', gloss: 'acknowledge', obj: ['o erro'] }, // c→ç
    { inf: 'aproveitar', tier: 'b2', gloss: 'make the most of', obj: ['a oportunidade'] },
    { inf: 'cumprir', tier: 'b2', gloss: 'meet / fulfil', obj: ['o prazo', 'o combinado'] },
    { inf: 'enfrentar', tier: 'b2', gloss: 'face', obj: ['a crise', 'o problema de frente'] },
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

  VR.data = { LEARNER, VERBS, VERB_LIST, SEED_IRREGULARS, TRIGGER_CATEGORIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = VR.data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
