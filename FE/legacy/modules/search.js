/**
 * Search Module - Handles all search-related functionality
 */

import { TIME_OPTIONS, MONTH_NAMES, DEFAULT_PICKUP_TIME, DEFAULT_RETURN_TIME, DEFAULT_RENTAL_DAYS, MIN_RENTAL_HOURS } from '../utils/constants.js';
import { getTodayString, getFutureDateString, formatDateToDisplay, formatRentalDuration, calculateRentalHours, isPastDate, isToday } from '../utils/dateUtils.js';

/**
 * Search State
 */
export const searchState = {
    location: '',
    locationName: '',
    pickupDate: getTodayString(),
    pickupTime: DEFAULT_PICKUP_TIME,
    returnDate: getFutureDateString(DEFAULT_RENTAL_DAYS),
    returnTime: DEFAULT_RETURN_TIME,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    calendarMode: 'pickup' // 'pickup' or 'return'
};

/**
 * Initialize search from URL parameters
 * @param {URLSearchParams} params 
 */
export function initializeSearchFromParams(params) {
    const stationId = params.get('location');
    const pickupDate = params.get('pickup-date');
    const pickupTime = params.get('pickup-time');
    const returnDate = params.get('return-date');
    const returnTime = params.get('return-time');

    if (stationId) searchState.location = stationId;
    if (pickupDate) searchState.pickupDate = pickupDate;
    if (pickupTime) searchState.pickupTime = pickupTime;
    if (returnDate) searchState.returnDate = returnDate;
    if (returnTime) searchState.returnTime = returnTime;

    // Try to load location name from localStorage
    try {
        const rentalContext = JSON.parse(localStorage.getItem('rentalContext') || '{}');
        if (rentalContext.stationName && rentalContext.stationId === stationId) {
            searchState.locationName = rentalContext.stationName;
        }
    } catch (e) {
        console.error('Failed to load rentalContext:', e);
    }
}

/**
 * Update summary bar display
 */
export function updateSummaryBar() {
    document.getElementById('summaryLocation').textContent = searchState.locationName || 'Select location';
    document.getElementById('summaryPickupDate').textContent = formatDateToDisplay(searchState.pickupDate);
    document.getElementById('summaryPickupTime').textContent = searchState.pickupTime;
    document.getElementById('summaryReturnDate').textContent = formatDateToDisplay(searchState.returnDate);
    document.getElementById('summaryReturnTime').textContent = searchState.returnTime;

    // Update modal fields if they exist
    const selectedLocation = document.getElementById('selectedLocation');
    if (selectedLocation) {
        selectedLocation.textContent = searchState.locationName || 'Select location';
        document.getElementById('selectedPickupDate').textContent = formatDateToDisplay(searchState.pickupDate);
        document.getElementById('selectedPickupTime').textContent = searchState.pickupTime;
        document.getElementById('selectedReturnDate').textContent = formatDateToDisplay(searchState.returnDate);
        document.getElementById('selectedReturnTime').textContent = searchState.returnTime;
    }
}

/**
 * Open search modal
 */
export function openSearchModal() {
    document.getElementById('searchModal').classList.add('active');
    loadLocations();
}

/**
 * Close search modal
 */
export function closeSearchModal() {
    document.getElementById('searchModal').classList.remove('active');
    // Close all dropdowns
    document.querySelectorAll('.location-dropdown, .time-picker-dropdown, .calendar-widget').forEach(el => {
        el.classList.remove('active');
    });
}

/**
 * Toggle location dropdown
 */
export function toggleLocationDropdown() {
    const dropdown = document.getElementById('locationDropdown');
    const isActive = dropdown.classList.toggle('active');
    
    // Close others
    document.querySelectorAll('.time-picker-dropdown, .calendar-widget').forEach(el => {
        el.classList.remove('active');
    });
    
    if (isActive && dropdown.children.length === 0) {
        loadLocations();
    }
}

/**
 * Load locations from API
 */
export async function loadLocations() {
    const dropdown = document.getElementById('locationDropdown');
    
    try {
        const stations = await window.API.getAllStations(1, 500);
        const stationList = stations.data || stations.items || stations;
        
        if (!stationList || stationList.length === 0) {
            dropdown.innerHTML = '<div class="location-option" style="color: #999;">No locations available</div>';
            return;
        }
        
        dropdown.innerHTML = stationList.map(station => {
            const stationName = station.stationName || station.name || 'Unknown Location';
            const stationId = station.id || station.stationId;
            const safeName = stationName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            return `
                <div class="location-option" onclick="window.SearchModule.selectLocation('${stationId}', '${safeName}')">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${stationName}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load locations:', error);
        dropdown.innerHTML = '<div class="location-option" style="color: red; padding: 12px;">Failed to load locations</div>';
    }
}

/**
 * Select a location
 */
export function selectLocation(id, name) {
    searchState.location = id;
    searchState.locationName = name;
    document.getElementById('selectedLocation').textContent = name;
    document.getElementById('summaryLocation').textContent = name;
    document.getElementById('locationDropdown').classList.remove('active');
}

/**
 * Toggle time picker
 */
export function toggleTimePicker(type) {
    const pickerId = type === 'pickup' ? 'pickupTimePicker' : 'returnTimePicker';
    const picker = document.getElementById(pickerId);
    const isActive = picker.classList.toggle('active');
    
    // Close others
    const otherId = type === 'pickup' ? 'returnTimePicker' : 'pickupTimePicker';
    document.getElementById(otherId).classList.remove('active');
    document.getElementById('locationDropdown').classList.remove('active');
    document.getElementById('calendarWidget').classList.remove('active');
    
    // Highlight selected time
    if (isActive) {
        const selectedTime = type === 'pickup' ? searchState.pickupTime : searchState.returnTime;
        picker.querySelectorAll('.time-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.time === selectedTime);
        });
    }
}

/**
 * Select a time
 */
export function selectTime(type, time) {
    if (type === 'pickup') {
        searchState.pickupTime = time;
        document.getElementById('selectedPickupTime').textContent = time;
        document.getElementById('summaryPickupTime').textContent = time;
        document.getElementById('pickupTimePicker').classList.remove('active');
    } else {
        searchState.returnTime = time;
        document.getElementById('selectedReturnTime').textContent = time;
        document.getElementById('summaryReturnTime').textContent = time;
        document.getElementById('returnTimePicker').classList.remove('active');
    }
    updateRentalDuration();
}

/**
 * Toggle calendar
 */
export function toggleCalendar(mode) {
    const calendar = document.getElementById('calendarWidget');
    searchState.calendarMode = mode;
    
    const isActive = calendar.classList.toggle('active');
    
    // Close others
    document.querySelectorAll('.location-dropdown, .time-picker-dropdown').forEach(el => {
        el.classList.remove('active');
    });
    
    if (isActive) {
        renderCalendar();
    }
}

/**
 * Change calendar month
 */
export function changeMonth(delta) {
    searchState.currentMonth += delta;
    if (searchState.currentMonth > 11) {
        searchState.currentMonth = 0;
        searchState.currentYear++;
    } else if (searchState.currentMonth < 0) {
        searchState.currentMonth = 11;
        searchState.currentYear--;
    }
    renderCalendar();
}

/**
 * Render calendar
 */
export function renderCalendar() {
    document.getElementById('calendarMonth').textContent = 
        `${MONTH_NAMES[searchState.currentMonth]} ${searchState.currentYear}`;
    
    const firstDay = new Date(searchState.currentYear, searchState.currentMonth, 1);
    const lastDay = new Date(searchState.currentYear, searchState.currentMonth + 1, 0);
    
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div class="calendar-day"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        // Create dateStr directly without Date object to avoid timezone issues
        const dateStr = `${searchState.currentYear}-${(searchState.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        const isPast = isPastDate(dateStr);
        const isTodayFlag = isToday(dateStr);
        const isSelected = dateStr === (searchState.calendarMode === 'pickup' ? searchState.pickupDate : searchState.returnDate);
        
        let classes = ['calendar-day'];
        if (isPast) classes.push('disabled');
        if (isTodayFlag) classes.push('today');
        if (isSelected) classes.push('selected');
        
        html += `<div class="${classes.join(' ')}" 
                     onclick="${isPast ? '' : `window.SearchModule.selectDate('${dateStr}')`}">
                    ${day}
                 </div>`;
    }
    
    document.getElementById('calendarDays').innerHTML = html;
}

/**
 * Select a date
 */
export function selectDate(dateStr) {
    const formattedDate = formatDateToDisplay(dateStr);
    
    if (searchState.calendarMode === 'pickup') {
        searchState.pickupDate = dateStr;
        document.getElementById('selectedPickupDate').textContent = formattedDate;
        document.getElementById('summaryPickupDate').textContent = formattedDate;
        
        // Only auto-adjust return date if return datetime is before pickup datetime
        const pickupDateTime = new Date(`${dateStr}T${searchState.pickupTime}`);
        const returnDateTime = new Date(`${searchState.returnDate}T${searchState.returnTime}`);
        
        if (returnDateTime < pickupDateTime) {
            // Set return date same as pickup date, but time +2 hours
            searchState.returnDate = dateStr;
            const pickupHour = parseInt(searchState.pickupTime.split(':')[0]);
            const newReturnHour = Math.min(pickupHour + 2, 23);
            searchState.returnTime = `${newReturnHour.toString().padStart(2, '0')}:00`;
            
            document.getElementById('selectedReturnDate').textContent = formattedDate;
            document.getElementById('summaryReturnDate').textContent = formattedDate;
            document.getElementById('selectedReturnTime').textContent = searchState.returnTime;
            document.getElementById('summaryReturnTime').textContent = searchState.returnTime;
        }
    } else {
        searchState.returnDate = dateStr;
        document.getElementById('selectedReturnDate').textContent = formattedDate;
        document.getElementById('summaryReturnDate').textContent = formattedDate;
    }
    
    document.getElementById('calendarWidget').classList.remove('active');
    updateRentalDuration();
}

/**
 * Update rental duration display
 */
export function updateRentalDuration() {
    const hours = calculateRentalHours(
        searchState.pickupDate,
        searchState.pickupTime,
        searchState.returnDate,
        searchState.returnTime
    );
    
    document.getElementById('rentalDurationText').textContent = formatRentalDuration(hours);
}

/**
 * Submit search
 */
export function submitSearch() {
    if (!searchState.location) {
        alert('Please select a pick-up location');
        return;
    }
    
    // Validate datetime
    const hours = calculateRentalHours(
        searchState.pickupDate,
        searchState.pickupTime,
        searchState.returnDate,
        searchState.returnTime
    );
    
    if (hours <= 0) {
        alert('Return date and time must be after pick-up date and time.\n\nPlease select a later return time or date.');
        return;
    }
    
    if (hours < MIN_RENTAL_HOURS) {
        alert('Minimum rental duration is 1 hour.\n\nPlease adjust your return time.');
        return;
    }
    
    // Save rental context
    const rentalContext = {
        stationId: searchState.location,
        stationName: searchState.locationName,
        pickupDate: searchState.pickupDate,
        pickupTime: searchState.pickupTime,
        returnDate: searchState.returnDate,
        returnTime: searchState.returnTime,
        createdAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('rentalContext', JSON.stringify(rentalContext));
    } catch (e) {
        console.error('Failed to save rental context:', e);
    }
    
    // Navigate to car list page
    const params = new URLSearchParams({
        location: searchState.location,
        'pickup-date': searchState.pickupDate,
        'pickup-time': searchState.pickupTime,
        'return-date': searchState.returnDate,
        'return-time': searchState.returnTime
    });
    
    window.location.href = `car_list_page.html?${params.toString()}`;
}

/**
 * Initialize event listeners
 */
export function initializeSearchEventListeners() {
    // Add click handlers to time options
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-option')) {
            const time = e.target.dataset.time;
            const picker = e.target.closest('.time-picker-dropdown');
            const type = picker.id === 'pickupTimePicker' ? 'pickup' : 'return';
            selectTime(type, time);
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-field') && !e.target.closest('.calendar-widget')) {
            document.querySelectorAll('.location-dropdown, .time-picker-dropdown, .calendar-widget').forEach(el => {
                el.classList.remove('active');
            });
        }
        
        // Close modal when clicking on overlay
        if (e.target.id === 'searchModal') {
            closeSearchModal();
        }
        
        // Close calendar when clicking on overlay
        if (e.target.id === 'calendarWidget') {
            document.getElementById('calendarWidget').classList.remove('active');
        }
    });
}

/**
 * Load station name by ID (async)
 */
export async function loadStationNameById(stationId) {
    try {
        const stations = await window.API.getAllStations(1, 500);
        const stationList = stations.data || stations.items || stations;
        const station = stationList.find(s => s.id == stationId || s.stationId == stationId);
        if (station) {
            searchState.locationName = station.stationName || station.name || 'Unknown Location';
            updateSummaryBar();
        }
    } catch (e) {
        console.error('Failed to load station name:', e);
    }
}
