/**
 * Date Utility Functions
 */

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayString() {
    const today = new Date();
    return formatDateToISO(today);
}

/**
 * Get date N days from now in YYYY-MM-DD format
 * @param {number} daysFromNow 
 * @returns {string}
 */
export function getFutureDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return formatDateToISO(date);
}

/**
 * Format Date object to YYYY-MM-DD (without timezone conversion)
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDateToDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Parse DD/MM/YYYY to YYYY-MM-DD
 * @param {string} displayDate 
 * @returns {string}
 */
export function parseDisplayDate(displayDate) {
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate rental duration in hours
 * @param {string} pickupDate - YYYY-MM-DD
 * @param {string} pickupTime - HH:MM
 * @param {string} returnDate - YYYY-MM-DD
 * @param {string} returnTime - HH:MM
 * @returns {number} Hours
 */
export function calculateRentalHours(pickupDate, pickupTime, returnDate, returnTime) {
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);
    const diffMs = returnDateTime - pickup;
    return diffMs / (1000 * 60 * 60);
}

/**
 * Format rental duration to human-readable string
 * @param {number} hours 
 * @returns {string}
 */
export function formatRentalDuration(hours) {
    if (hours < 0) return 'Invalid duration';
    if (hours === 0) return 'Less than 1 hour';
    
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    
    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (remainingHours > 0) result += `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    
    return result.trim() || '0 hours';
}

/**
 * Check if a date is in the past
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function isPastDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

/**
 * Check if a date is today
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function isToday(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.toDateString() === today.toDateString();
}
