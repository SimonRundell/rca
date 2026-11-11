/**
 * Keyword rubric matcher for free-text answers (section 10.2). The result
 * is always presented as an "indicative mark", never a final one.
 */

/**
 * @param {string} text
 * @returns {string} lower case, punctuation stripped, whitespace collapsed
 */
export function normaliseText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Light stemming: strip a trailing "ing", "ed" or "s" if the remainder is
 * still a plausible word stem. Not linguistically rigorous by design -
 * it only needs to catch "tested"/"testing"/"tests" style variation.
 * @param {string} word
 * @returns {string}
 */
export function stem(word) {
  if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * @param {string} normalisedText
 * @param {string} term  single word or multi-word phrase, already lower case
 * @returns {boolean}
 */
function termMatches(normalisedText, term) {
  const normalisedTerm = normaliseText(term);
  if (normalisedTerm.includes(' ')) {
    return normalisedText.includes(normalisedTerm);
  }
  const stemmedTerm = stem(normalisedTerm);
  const tokens = normalisedText.split(' ').map(stem);
  return tokens.includes(stemmedTerm);
}

/**
 * @param {string} text
 * @returns {number}
 */
export function wordCount(text) {
  const normalised = normaliseText(text);
  return normalised.length === 0 ? 0 : normalised.split(' ').length;
}

/**
 * @typedef {Object} ConceptResult
 * @property {string} label
 * @property {boolean} found
 * @property {boolean} required
 */

/**
 * @typedef {Object} RubricResult
 * @property {boolean} meetsMinWords
 * @property {number} wordCount
 * @property {ConceptResult[]} concepts
 * @property {number} hits
 * @property {number} groupCount
 * @property {boolean} missedRequired
 * @property {number} score   0-1, "indicative mark"
 */

/**
 * @param {import('../data/scenarios/index.js').FreeTextPrompt} promptDef
 * @param {string} text
 * @returns {RubricResult}
 */
export function markFreeText(promptDef, text) {
  const count = wordCount(text);
  const meetsMinWords = count >= promptDef.minWords;
  const normalised = normaliseText(text);

  const concepts = promptDef.concepts.map((group) => ({
    label: group.label,
    required: Boolean(group.required),
    found: meetsMinWords && group.terms.some((term) => termMatches(normalised, term)),
  }));

  const hits = concepts.filter((c) => c.found).length;
  const groupCount = concepts.length;
  const missedRequired = concepts.some((c) => c.required && !c.found);

  let score = 0;
  if (meetsMinWords && groupCount > 0) {
    score = hits / groupCount;
    if (missedRequired) score = Math.min(score, 0.5);
  }

  return { meetsMinWords, wordCount: count, concepts, hits, groupCount, missedRequired, score };
}
