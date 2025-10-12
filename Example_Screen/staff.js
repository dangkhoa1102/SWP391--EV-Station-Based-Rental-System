// Extracted JS from Staff_HomePage.html
// Sample bookings data
const bookings = [
    { id:1, title:'Tesla Model 3', customer:'Nguyen Van A', status:'booked', date:'2025-10-10', img:'https://via.placeholder.com/220x140?text=Tesla+3', facePhoto:'https://via.placeholder.com/220x220.png?text=Face+A', idString:'012345678901', phone:'0912345678' },
    { id:2, title:'Nissan Leaf', customer:'Tran Thi B', status:'denied', date:'2025-10-11', img:'https://via.placeholder.com/220x140?text=Nissan+Leaf', facePhoto:'https://via.placeholder.com/220x220.png?text=Face+B', idString:'987654321098', phone:'0987654321' },
    { id:3, title:'BMW i3', customer:'Le Van C', status:'completed', date:'2025-10-09', img:'https://via.placeholder.com/220x140?text=BMW+i3', facePhoto:'https://via.placeholder.com/220x220.png?text=Face+C', idString:'123123123123', phone:'0911222333' },
    { id:4, title:'Hyundai Kona', customer:'Pham Thi D', status:'booked', date:'2025-10-12', img:'https://via.placeholder.com/220x140?text=Hyundai+Kona', facePhoto:'https://via.placeholder.com/220x220.png?text=Face+D', idString:'321321321321', phone:'0900111222' },
];
const bookingGrid = document.getElementById('bookingGrid');
function renderBookings() {
    bookingGrid.innerHTML = '';
    const search = document.getElementById('searchBooking').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const filtered = bookings.filter(b => 
        (b.title.toLowerCase().includes(search) || b.customer.toLowerCase().includes(search)) &&
        (statusFilter === '' || b.status === statusFilter)
    );
    filtered.forEach(b => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        let statusClass = '';
        if (b.status === 'booked') statusClass = 'booking-status-chip booking-status-confirmed';
        else if (b.status === 'denied') statusClass = 'booking-status-chip booking-status-pending';
        else if (b.status === 'completed') statusClass = 'booking-status-chip booking-status-completed';
        card.innerHTML = `
            <img src="${b.img}" alt="${b.title}">
            <div class="booking-info">
                <div class="booking-title">${b.title}</div>
                <div class="booking-customer">${b.customer}</div>
            </div>
            <div class="${statusClass}">${b.status.toUpperCase()}</div>
        `;
        card.onclick = () => openModal(b);
        bookingGrid.appendChild(card);
    });
}
function openModal(booking) {
    document.getElementById('modalTitle').textContent = booking.title;
    document.getElementById('modalStatus').textContent = 'Status: ' + booking.status;
    document.getElementById('modalCustomer').textContent = 'Customer: ' + booking.customer;
    document.getElementById('modalDate').textContent = 'Date: ' + booking.date;
    // Show face photo if available as primary image (facePhoto saved as PNG in DB)
    document.getElementById('modalImage').src = booking.facePhoto || booking.img;
    document.getElementById('modalTransactionInfo').style.display = booking.status === 'completed' ? 'block' : 'none';
    // Populate ID string and phone number fields (read-only display)
    // Replace ID card input area with string display
    const idArea = document.querySelector('#bookingModal div[style*="ID Card"]');
    // Instead of querying inline styles, set the input displays directly:
    const idLabel = document.getElementById('checkID');
    if (document.getElementById('modalIDValue')) {
        document.getElementById('modalIDValue').textContent = booking.idString || '';
    } else {
        // inject a small span to show ID value next to label
        const idBox = document.createElement('span');
        idBox.id = 'modalIDValue';
        idBox.style.marginLeft = '12px';
        idBox.style.fontWeight = '600';
        idBox.textContent = booking.idString || '';
        // find first ID Card container and append
        const containers = document.querySelectorAll('#bookingModal div');
        for (let c of containers) {
            if (c.innerText && c.innerText.indexOf('ID Card') !== -1) {
                // remove existing checkbox label to avoid duplication
                const chk = c.querySelector('#checkID');
                if (chk) chk.checked = false; // leave unchecked by default
                c.appendChild(idBox);
                break;
            }
        }
    }
    // Populate phone
    const phoneInput = document.getElementById('customerPhone');
    phoneInput.value = booking.phone || '';
    // If facePhoto exists, disable file input and mark verified visually
    const uploadFace = document.getElementById('uploadFace');
    const checkFace = document.getElementById('checkFace');
    if (booking.facePhoto) {
        uploadFace.disabled = true;
        uploadFace.style.opacity = '0.6';
        checkFace.checked = true;
    } else {
        uploadFace.disabled = false;
        uploadFace.style.opacity = '1';
        checkFace.checked = false;
    }
    document.getElementById('bookingModal').style.display = 'flex';

    const confirmBtn = document.getElementById('confirmBookingBtn');
    const completeBtn = document.getElementById('completeBookingBtn');
    const denyBtn = document.getElementById('denyBookingBtn');

    // Setup button visibility and labels based on current status
    if (booking.status === 'booked') {
        // deposit already paid -> allow marking as completed
        confirmBtn.textContent = 'Confirm (Deposit Received)';
        confirmBtn.disabled = false;
        completeBtn.style.display = 'inline-block';
    } else if (booking.status === 'completed') {
        confirmBtn.textContent = 'Confirm';
        confirmBtn.disabled = true;
        completeBtn.style.display = 'none';
    } else if (booking.status === 'denied') {
        confirmBtn.textContent = 'Confirm';
        confirmBtn.disabled = true;
        completeBtn.style.display = 'none';
    } else {
        // default (not booked yet)
        confirmBtn.textContent = 'Confirm (Record Deposit)';
        confirmBtn.disabled = false;
        completeBtn.style.display = 'none';
    }

    // Remove previous handlers to avoid stacking
    confirmBtn.onclick = null;
    completeBtn.onclick = null;
    denyBtn.onclick = null;

    // Confirm button: either record deposit (booked) or no-op if completed/denied
    confirmBtn.onclick = function() {
        if (booking.status === 'completed' || booking.status === 'denied') return;
        const ok = confirm(booking.status === 'booked' ?
            'This booking is already booked. Do you want to mark it completed instead?' :
            'Record deposit payment and mark as BOOKED?');
        if (!ok) return;
        booking.status = 'booked';
        document.getElementById('modalStatus').textContent = 'Status: booked';
        document.getElementById('modalTransactionInfo').style.display = 'block';
        renderBookings();
        // update buttons
        confirmBtn.textContent = 'Confirm (Deposit Received)';
        completeBtn.style.display = 'inline-block';
    };

    // Complete button: staff marks as completed when renter pays on spot
    completeBtn.onclick = function() {
        if (booking.status !== 'booked') {
            alert('You can only mark as completed after deposit is recorded (booked).');
            return;
        }
        const ok = confirm('Renter will pay in full on the spot. Mark booking as COMPLETED?');
        if (!ok) return;
        booking.status = 'completed';
        document.getElementById('modalStatus').textContent = 'Status: completed';
        document.getElementById('modalTransactionInfo').style.display = 'block';
        renderBookings();
        confirmBtn.disabled = true;
        completeBtn.style.display = 'none';
    };

    // Deny button
    denyBtn.onclick = function() {
        const ok = confirm('Are you sure you want to DENY this booking?');
        if (!ok) return;
        booking.status = 'denied';
        document.getElementById('modalTransactionInfo').style.display = 'none';
        document.getElementById('modalStatus').textContent = 'Status: denied';
        renderBookings();
        confirmBtn.disabled = true;
        completeBtn.style.display = 'none';
    };
}
function closeModal() { document.getElementById('bookingModal').style.display = 'none'; }
document.getElementById('searchBooking').addEventListener('input', renderBookings);
document.getElementById('statusFilter').addEventListener('change', renderBookings);

// Sample vehicles data
let vehicles = [
    { id:1, name:'Tesla Model 3', desc:'Electric sedan', detail:'Range: 350km', img:'https://via.placeholder.com/220x140?text=Tesla+3' },
    { id:2, name:'Nissan Leaf', desc:'Compact EV', detail:'Range: 250km', img:'https://via.placeholder.com/220x140?text=Nissan+Leaf' },
    { id:3, name:'BMW i3', desc:'Urban EV', detail:'Range: 200km', img:'https://via.placeholder.com/220x140?text=BMW+i3' },
    { id:4, name:'Hyundai Kona', desc:'SUV EV', detail:'Range: 400km', img:'https://via.placeholder.com/220x140?text=Hyundai+Kona' },
];
function renderVehicles() {
    const vehicleGrid = document.getElementById('vehicleGrid');
    vehicleGrid.innerHTML = '';
    vehicles.forEach(v => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <button class="vehicle-remove-btn" onclick="removeVehicle(${v.id}, event)"><i class="fas fa-times"></i></button>
            <img src="${v.img}" alt="${v.name}">
            <div class="vehicle-info">
                <div class="vehicle-title">${v.name}</div>
                <div class="vehicle-battery">Battery: ${v.battery || 'N/A'}%</div>
                <div class="vehicle-tech">Condition: ${v.tech || 'N/A'}</div>
                <div class="vehicle-issue">Issue: ${v.issue || 'None'}</div>
            </div>
        `;
        card.onclick = (e) => {
            if (!e.target.classList.contains('vehicle-remove-btn') && !e.target.classList.contains('fa-times')) openVehicleModal(v);
        };
        vehicleGrid.appendChild(card);
    });
}
function openVehicleModal(vehicle) {
    const modal = document.getElementById('vehicleModal');
    const content = document.getElementById('vehicleModalContent');
    content.innerHTML = `<span class='vehicle-modal-close' id='vehicleModalCloseBtn'>&times;</span>
        <img src='${vehicle.img}' alt='${vehicle.name}'>
        <h3>${vehicle.name}</h3>
        <p><strong>Description:</strong> ${vehicle.desc}</p>
        <p><strong>Detail:</strong> ${vehicle.detail}</p>
        <div style='width:100%;margin-top:18px;'>
            <label style='font-weight:600;'>Battery Status:</label>
            <input type='range' id='updateBatteryStatus' min='0' max='100' value='${vehicle.battery ? parseInt(vehicle.battery) : 80}' style='width:100%;margin-bottom:10px;'>
            <span id='batteryStatusValue'>${vehicle.battery || '80'}%</span>
            <label style='font-weight:600;margin-top:14px;'>Condition:</label>
            <select id='updateTechStatus' style='width:120px;margin-bottom:14px;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:0.95rem;'>
                <option value='Rented' ${vehicle.tech==='Rented'?'selected':''}>Rented</option>
                <option value='Running' ${vehicle.tech==='Running'?'selected':''}>Running</option>
                <option value='Maintained' ${vehicle.tech==='Maintained'?'selected':''}>Maintained</option>
                <option value='Open' ${vehicle.tech==='Open'?'selected':''}>Open</option>
            </select>
            <label style='font-weight:600;margin-top:14px;'>Issue:</label>
            <textarea id='updateIssueReport' placeholder='Report issue or malfunction...' style='width:100%;margin-bottom:14px;padding:8px 12px;border-radius:8px;border:1px solid #ccc;min-height:80px;'>${vehicle.issue || ''}</textarea>
            <button onclick='submitVehicleUpdateFromModal(${vehicle.id})' style='background:#43a047;color:white;padding:8px 24px;border:none;border-radius:16px;font-weight:600;'>Submit Update</button>
        </div>`;
    modal.style.display = 'flex';
    // Fix slider value update
    setTimeout(function() {
        var slider = document.getElementById('updateBatteryStatus');
        var valueSpan = document.getElementById('batteryStatusValue');
        if (slider && valueSpan) {
            slider.oninput = function() { valueSpan.textContent = this.value + '%'; };
        }
        var closeBtn = document.getElementById('vehicleModalCloseBtn');
        if (closeBtn) { closeBtn.onclick = closeVehicleModal; }
    }, 10);
}
function submitVehicleUpdateFromModal(id) {
    const battery = document.getElementById('updateBatteryStatus').value;
    const tech = document.getElementById('updateTechStatus').value;
    const issue = document.getElementById('updateIssueReport').value;
    const vehicle = vehicles.find(v => v.id == id);
    if (vehicle) { vehicle.battery = battery; vehicle.tech = tech; vehicle.issue = issue; }
    renderVehicles(); closeVehicleModal();
}
function removeVehicle(id, event) { event.stopPropagation(); vehicles = vehicles.filter(v => v.id !== id); renderVehicles(); }
function openAddVehicleModal() { document.getElementById('addVehicleModal').style.display = 'flex'; }
function closeAddVehicleModal() { document.getElementById('addVehicleModal').style.display = 'none'; }
function submitAddVehicle() {
    const name = document.getElementById('addVehicleName').value; const desc = document.getElementById('addVehicleDesc').value; const detail = document.getElementById('addVehicleDetail').value; const img = document.getElementById('addVehicleImg').value || 'https://via.placeholder.com/220x140?text='+encodeURIComponent(name);
    if (!name) return; const id = Date.now(); vehicles.push({ id, name, desc, detail, img }); renderVehicles(); closeAddVehicleModal();
}
function openProfileModal() { document.getElementById('profileModal').style.display = 'flex'; }
function closeProfileModal() { document.getElementById('profileModal').style.display = 'none'; }
function openVehicleUpdateModal(event, id) { event.stopPropagation(); document.getElementById('vehicleUpdateModal').style.display = 'flex'; document.getElementById('vehicleUpdateModal').dataset.vehicleId = id; }
function closeVehicleUpdateModal() { document.getElementById('vehicleUpdateModal').style.display = 'none'; }
function submitVehicleUpdate() {
    const id = document.getElementById('vehicleUpdateModal').dataset.vehicleId; const battery = document.getElementById('updateBatteryStatus').value; const tech = document.getElementById('updateTechStatus').value; const issue = document.getElementById('updateIssueReport').value;
    const vehicle = vehicles.find(v => v.id == id); if (vehicle) { vehicle.battery = battery; vehicle.tech = tech; vehicle.issue = issue; }
    renderVehicles(); closeVehicleUpdateModal();
}
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section'); sections.forEach(s => s.style.display = 'none'); document.getElementById(sectionId).style.display = 'block'; if(sectionId==='booking') renderBookings(); if(sectionId==='vehicle') renderVehicles();
}
// Initial load
showSection('booking');
