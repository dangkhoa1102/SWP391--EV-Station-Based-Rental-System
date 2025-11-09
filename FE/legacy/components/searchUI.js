/**
 * Search UI Component - HTML generation for search modal
 */

import { TIME_OPTIONS } from '../utils/constants.js';

/**
 * Generate search summary bar HTML
 */
export function generateSearchSummaryBar() {
    return `
        <div class="search-summary">
            <div class="summary-item" onclick="window.SearchModule.openSearchModal()">
                <div class="summary-label">Pick-up Location</div>
                <div class="summary-value" id="summaryLocation">Select location</div>
            </div>
            <div class="summary-item" onclick="window.SearchModule.openSearchModal()">
                <div class="summary-label">Pick-up Date</div>
                <div class="summary-value" id="summaryPickupDate">18/10/2025</div>
            </div>
            <div class="summary-item" onclick="window.SearchModule.openSearchModal()">
                <div class="summary-label">Pick-up Time</div>
                <div class="summary-value" id="summaryPickupTime">15:00</div>
            </div>
            <div class="summary-item" onclick="window.SearchModule.openSearchModal()">
                <div class="summary-label">Return Date</div>
                <div class="summary-value" id="summaryReturnDate">20/10/2025</div>
            </div>
            <div class="summary-item" onclick="window.SearchModule.openSearchModal()">
                <div class="summary-label">Return Time</div>
                <div class="summary-value" id="summaryReturnTime">19:00</div>
            </div>
            <button type="button" class="btn-search" onclick="window.SearchModule.submitSearch()">
                <i class="fas fa-search"></i>
                SEARCH
            </button>
        </div>
    `;
}

/**
 * Generate time picker options HTML
 */
export function generateTimeOptions() {
    return TIME_OPTIONS.map(time => 
        `<div class="time-option" data-time="${time}">${time}</div>`
    ).join('');
}

/**
 * Generate search modal HTML
 */
export function generateSearchModal() {
    const timeOptionsHTML = generateTimeOptions();
    
    return `
    <div id="searchModal" class="search-modal">
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h3>Search Cars</h3>
                <button class="search-modal-close" onclick="window.SearchModule.closeSearchModal()">&times;</button>
            </div>
            <div class="search-modal-body">
                <!-- Location -->
                <div class="search-field">
                    <label>
                        <i class="fas fa-map-marker-alt"></i>
                        Pick-up Location
                    </label>
                    <div class="search-input" onclick="window.SearchModule.toggleLocationDropdown()">
                        <i class="fas fa-map-marker-alt"></i>
                        <span id="selectedLocation">Select location</span>
                    </div>
                    <div class="location-dropdown" id="locationDropdown">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>

                <!-- Pick-up Date & Time -->
                <div class="search-field-row">
                    <div class="search-field">
                        <label>
                            <i class="fas fa-calendar"></i>
                            Pick-up Date
                        </label>
                        <div class="search-input" onclick="window.SearchModule.toggleCalendar('pickup')">
                            <i class="fas fa-calendar"></i>
                            <span id="selectedPickupDate">18/10/2025</span>
                        </div>
                    </div>
                    <div class="search-field">
                        <label>
                            <i class="fas fa-clock"></i>
                            Pick-up Time
                        </label>
                        <div class="search-input" onclick="window.SearchModule.toggleTimePicker('pickup')">
                            <i class="fas fa-clock"></i>
                            <span id="selectedPickupTime">15:00</span>
                        </div>
                        <div class="time-picker-dropdown" id="pickupTimePicker">
                            <div class="time-picker-label">Choose pick-up time</div>
                            <div class="time-picker-options">
                                ${timeOptionsHTML}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Return Date & Time -->
                <div class="search-field-row">
                    <div class="search-field">
                        <label>
                            <i class="fas fa-calendar-check"></i>
                            Return Date
                        </label>
                        <div class="search-input" onclick="window.SearchModule.toggleCalendar('return')">
                            <i class="fas fa-calendar-check"></i>
                            <span id="selectedReturnDate">20/10/2025</span>
                        </div>
                    </div>
                    <div class="search-field">
                        <label>
                            <i class="fas fa-clock"></i>
                            Return Time
                        </label>
                        <div class="search-input" onclick="window.SearchModule.toggleTimePicker('return')">
                            <i class="fas fa-clock"></i>
                            <span id="selectedReturnTime">19:00</span>
                        </div>
                        <div class="time-picker-dropdown" id="returnTimePicker">
                            <div class="time-picker-label">Choose return time</div>
                            <div class="time-picker-options">
                                ${timeOptionsHTML}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Calendar Widget -->
                <div class="calendar-widget" id="calendarWidget">
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button onclick="window.SearchModule.changeMonth(-1)">&lt;</button>
                            <span id="calendarMonth">October 2025</span>
                            <button onclick="window.SearchModule.changeMonth(1)">&gt;</button>
                        </div>
                        <div class="calendar-weekdays">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>
                        <div class="calendar-days" id="calendarDays">
                            <!-- Will be populated by JavaScript -->
                        </div>
                    </div>
                </div>

                <!-- Rental Duration Info -->
                <div class="rental-duration">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Rental Duration</strong>
                        <p id="rentalDurationText">2 days 4 hours</p>
                    </div>
                </div>

                <!-- Warning -->
                <div class="rental-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Minimum rental duration is 1 hour. Same-day rentals are available. To ensure cars are properly prepared and meet environmental standards, please book at least 2 hours in advance.</p>
                </div>

                <!-- Search Button -->
                <button class="btn-search-submit" onclick="window.SearchModule.submitSearch()">
                    <i class="fas fa-search"></i>
                    Search Cars
                </button>
            </div>
        </div>
    </div>
    `;
}
