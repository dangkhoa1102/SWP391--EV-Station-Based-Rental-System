/**
 * Application Constants
 */

// Time constants
export const TIME_OPTIONS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

// Month names
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Default search values
export const DEFAULT_PICKUP_TIME = '15:00';
export const DEFAULT_RETURN_TIME = '19:00';
export const DEFAULT_RENTAL_DAYS = 2;

// Validation constants
export const MIN_RENTAL_HOURS = 1;
export const RECOMMENDED_ADVANCE_HOURS = 2;

// Storage keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER_EMAIL: 'userEmail',
    USER_ID: 'userId',
    RENTAL_CONTEXT: 'rentalContext'
};
