import wifiB12 from './wifi-b12.js';
import loginFailure from './login-failure.js';
import siteDown from './site-down.js';
import backupLoss from './backup-loss.js';
import checkoutTotals from './checkout-totals.js';
import slowApi from './slow-api.js';

/**
 * Ordered scenario list for the catalogue (section 12). Adding a scenario
 * means adding a file here and listing it - no component changes needed.
 * @type {import('./wifi-b12.js').default[]}
 */
export const scenarios = [wifiB12, loginFailure, siteDown, backupLoss, checkoutTotals, slowApi];

/**
 * @param {string} id
 * @returns {Object|undefined}
 */
export function getScenarioById(id) {
  return scenarios.find((s) => s.id === id);
}
