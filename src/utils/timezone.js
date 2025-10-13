/**
 * Timezone utilities for converting to Pacific Time (PDT/PST)
 */

const moment = require('moment-timezone');

// Pacific timezone
const PACIFIC_TZ = 'America/Los_Angeles';

/**
 * Get current timestamp in Pacific Time (PDT/PST)
 * Automatically handles daylight saving time
 * @returns {string} Formatted timestamp in Pacific Time
 */
function getPacificTimestamp() {
  return moment().tz(PACIFIC_TZ).format('YYYY-MM-DD HH:mm:ss z');
}

/**
 * Get current timestamp in ISO format but in Pacific Time
 * @returns {string} ISO formatted timestamp in Pacific Time
 */
function getPacificISO() {
  return moment().tz(PACIFIC_TZ).toISOString();
}

/**
 * Format a date object or timestamp to Pacific Time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted timestamp in Pacific Time
 */
function formatToPacific(date) {
  return moment(date).tz(PACIFIC_TZ).format('YYYY-MM-DD HH:mm:ss z');
}

/**
 * Get human-readable Pacific Time
 * Example: "October 7, 2025 5:30:45 PM PDT"
 * @returns {string} Human-readable timestamp
 */
function getPacificReadable() {
  return moment().tz(PACIFIC_TZ).format('MMMM D, YYYY h:mm:ss A z');
}

/**
 * Get just the time in Pacific Time
 * Example: "5:30:45 PM PDT"
 * @returns {string} Time only
 */
function getPacificTime() {
  return moment().tz(PACIFIC_TZ).format('h:mm:ss A z');
}

/**
 * Get just the date in Pacific Time
 * Example: "October 7, 2025"
 * @returns {string} Date only
 */
function getPacificDate() {
  return moment().tz(PACIFIC_TZ).format('MMMM D, YYYY');
}

module.exports = {
  getPacificTimestamp,
  getPacificISO,
  formatToPacific,
  getPacificReadable,
  getPacificTime,
  getPacificDate,
  PACIFIC_TZ
};
