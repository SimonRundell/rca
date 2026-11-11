/**
 * App-level settings, bundled at build time. There is no backend and no
 * secrets, so nothing here needs to come from a runtime `.config.json`.
 */

export const APP_TITLE = 'RCA Doctor';

/** localStorage key. Bump the suffix if the saved shape ever changes. */
export const STORAGE_KEY = 'rcaTrainer.v1';

/** @typedef {'practice'|'assessed'} Mode */
export const MODES = {
  PRACTICE: 'practice',
  ASSESSED: 'assessed',
};

/** Number of evidence requests allowed in Stage 3, per scenario difficulty. */
export const EVIDENCE_REQUEST_LIMIT = 6;

/** Stage index -> percentage weight of the scenario total. Section 10.3. */
export const STAGE_WEIGHTS = {
  0: 5,
  1: 8,
  2: 5,
  3: 15,
  4: 5,
  5: 35,
  6: 12,
  7: 8,
  8: 5,
  9: 2,
};

export const STAGE_TITLES = {
  0: 'Briefing',
  1: 'Define the problem',
  2: 'Restore service',
  3: 'Evidence and timeline',
  4: 'Contributing factors',
  5: 'Apply the technique',
  6: 'Confirm the root cause',
  7: 'Corrective and preventative actions',
  8: 'Verify and monitor',
  9: 'Document',
};

export const STAGE_COUNT = Object.keys(STAGE_TITLES).length;

/** Percentage thresholds for the descriptive bands. Not mapped to grades. */
export const BANDS = [
  { min: 0, label: 'Developing' },
  { min: 50, label: 'Secure' },
  { min: 75, label: 'Strong' },
];

/**
 * @param {number} percent 0-100
 * @returns {string} band label
 */
export function bandForPercent(percent) {
  let label = BANDS[0].label;
  for (const band of BANDS) {
    if (percent >= band.min) label = band.label;
  }
  return label;
}
