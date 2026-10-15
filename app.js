/* ==========================================================================
   MGM SPORT - TURF BOOKING PLATFORM APPLICATION LOGIC
   Architectural Specifications:
   - Redis Atomic 10-minute Hold Lock Simulation
   - PostgreSQL Unique Constraint Guard (court_id, date, slot_start)
   - Razorpay Route Payout Split & Webhook Idempotency
   - English & Tamil (தமிழ்) Bilingual UI System
   - Turf Owner Interactive Matrix & Front-Desk Walk-in Counter
   - Platform Admin KYC & Real-time Audit Trail
   ========================================================================== */

// --- STATE MANAGEMENT ---
const AppState = {
  currentLang: 'en',
  currentView: 'player', // 'player' | 'owner' | 'admin'
  currentUser: {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    isLoggedIn: true,
    role: 'player'
  },
  venues: [
    {
      id: 'venue-1',
      name: 'MGM Grand Sports Arena',
      city: 'OMR, Chennai',
      area: 'OMR',
      sports: ['football', 'cricket'],
      rating: 4.9,
      reviewsCount: 312,
      priceFrom: 900,
      image: 'assets/images/turf_football.jpg',
      featured: true,
      amenities: ['FIFA 2-Star Astroturf', 'Floodlights', 'Shower & Locker', 'RO Water', 'Parking', 'First Aid'],
      courts: [
        { id: 'c1', name: 'Court A (FIFA 7-a-side Turf)', sport: 'football', priceWeekday: 1000, pricePeak: 1400, lengthMin: 60 },
        { id: 'c2', name: 'Court B (5-a-side Astro Cage)', sport: 'football', priceWeekday: 800, pricePeak: 1100, lengthMin: 60 },
        { id: 'c3', name: 'Court C (Indoor Box Cricket Cage)', sport: 'cricket', priceWeekday: 900, pricePeak: 1300, lengthMin: 60 }
      ]
    },
    {
      id: 'venue-2',
      name: 'Smash & Strike Turf Club',
      city: 'Anna Nagar, Chennai',
      area: 'Anna Nagar',
      sports: ['cricket', 'football'],
      rating: 4.8,
      reviewsCount: 198,
      priceFrom: 850,
      image: 'assets/images/turf_cricket.jpg',
      featured: true,
      amenities: ['Cricket Pitch Netting', 'LED Floodlights', 'Free Bibs & Balls', 'AC Cafeteria', 'Parking'],
      courts: [
        { id: 'c4', name: 'Pitch 1 (Box Cricket Arena)', sport: 'cricket', priceWeekday: 900, pricePeak: 1250, lengthMin: 60 },
        { id: 'c5', name: 'Pitch 2 (Fast Cage Cricket)', sport: 'cricket', priceWeekday: 850, pricePeak: 1200, lengthMin: 60 }
      ]
    },
    {
      id: 'venue-3',
      name: 'ProShuttle & Multi-Sport Arena',
      city: 'Adyar & ECR, Chennai',
      area: 'Adyar',
      sports: ['badminton'],
      rating: 4.9,
      reviewsCount: 245,
      priceFrom: 600,
      image: 'assets/images/turf_badminton.jpg',
      featured: true,
      amenities: ['BWF Synthetic Mats', 'Yonex Netting', 'Glare-free Lighting', 'Dressing Room', 'Pro-Shop'],
      courts: [
        { id: 'c6', name: 'Court 1 (Yonex BWF Court)', sport: 'badminton', priceWeekday: 600, pricePeak: 850, lengthMin: 60 },
        { id: 'c7', name: 'Court 2 (Synthetic Green Court)', sport: 'badminton', priceWeekday: 600, pricePeak: 850, lengthMin: 60 }
      ]
    }
  ],
  bookings: [
    {
      id: 'MGM-2026-8941',
      venueName: 'MGM Grand Sports Arena',
      courtName: 'Court A (FIFA 7-a-side Turf)',
      date: '2026-10-17',
      slot: '07:00 PM - 08:00 PM',
      totalAmount: 1400,
      paidAmount: 1400,
      paymentStatus: 'PAID_FULL',
      bookingStatus: 'CONFIRMED',
      customerName: 'Rajesh Kumar',
      customerPhone: '9876543210',
      createdAt: '2026-10-15 18:30:10'
    },
    {
      id: 'MGM-2026-7723',
      venueName: 'Smash & Strike Turf Club',
      courtName: 'Pitch 1 (Box Cricket Arena)',
      date: '2026-10-16',
      slot: '08:00 PM - 09:00 PM',
      totalAmount: 1250,
      paidAmount: 375, // 30% advance
      paymentStatus: 'PARTIAL_30',
      bookingStatus: 'CONFIRMED',
      customerName: 'Rajesh Kumar',
      customerPhone: '9876543210',
      createdAt: '2026-10-14 11:20:00'
    }
  ],
  ownerSchedule: [
    { court: 'Court A (FIFA 7s)', time: '06:00 AM - 07:00 AM', status: 'booked-online', customer: 'Vignesh FC', mode: 'Online UPI' },
    { court: 'Court A (FIFA 7s)', time: '07:00 AM - 08:00 AM', status: 'free' },
    { court: 'Court A (FIFA 7s)', time: '08:00 AM - 09:00 AM', status: 'free' },
    { court: 'Court A (FIFA 7s)', time: '04:00 PM - 05:00 PM', status: 'free' },
    { court: 'Court A (FIFA 7s)', time: '05:00 PM - 06:00 PM', status: 'booked-walkin', customer: 'Karthik (Walk-in)', mode: 'Counter Cash' },
    { court: 'Court A (FIFA 7s)', time: '06:00 PM - 07:00 PM', status: 'booked-online', customer: 'Suresh 7s', mode: 'Online UPI' },
    { court: 'Court A (FIFA 7s)', time: '07:00 PM - 08:00 PM', status: 'booked-online', customer: 'Rajesh Kumar', mode: 'Online UPI' },
    { court: 'Court A (FIFA 7s)', time: '08:00 PM - 09:00 PM', status: 'booked-online', customer: 'Chennai Strikers', mode: 'Online GPay' },
    { court: 'Court A (FIFA 7s)', time: '09:00 PM - 10:00 PM', status: 'free' },

    { court: 'Court B (5-a-side)', time: '06:00 PM - 07:00 PM', status: 'booked-online', customer: 'Arun Team', mode: 'Online PhonePe' },
    { court: 'Court B (5-a-side)', time: '07:00 PM - 08:00 PM', status: 'free' },
    { court: 'Court B (5-a-side)', time: '08:00 PM - 09:00 PM', status: 'blocked-maint', customer: 'Turf Brushing & Floodlight Repair', mode: 'Owner Block' },

    { court: 'Court C (Box Cricket)', time: '07:00 PM - 08:00 PM', status: 'booked-walkin', customer: 'Dinesh Friends', mode: 'Counter UPI' },
    { court: 'Court C (Box Cricket)', time: '08:00 PM - 09:00 PM', status: 'booked-online', customer: 'Night Riders XI', mode: 'Online UPI' }
  ],
  adminVenues: [
    { name: 'MGM Grand Sports Arena', owner: 'MGM Sports Pvt Ltd (Naresh M)', courts: 3, commission: '5%', kycStatus: 'VERIFIED', bankStatus: 'ACTIVE' },
    { name: 'Smash & Strike Turf Club', owner: 'Ramesh Sundaram', courts: 2, commission: '5%', kycStatus: 'VERIFIED', bankStatus: 'ACTIVE' },
    { name: 'ProShuttle Badminton Academy', owner: 'Deepak V', courts: 2, commission: '5%', kycStatus: 'VERIFIED', bankStatus: 'ACTIVE' },
    { name: 'Velachery Strikers Turf', owner: 'Praveen Chandran', courts: 2, commission: '6%', kycStatus: 'PENDING_DOCS', bankStatus: 'UNDER_REVIEW' },
    { name: 'Tambaram Turf Arena', owner: 'Gopinath K', courts: 1, commission: '5%', kycStatus: 'PENDING_APPROVAL', bankStatus: 'SUBMITTED' }
  ],
  auditLogs: [
    { time: '20:14:10', event: 'REDIS_SET_NX', entity: 'court:c1:2026-10-17:19:00', details: 'Hold lock acquired. TTL 600s', status: 'SUCCESS' },
    { time: '20:14:22', event: 'PG_INSERT_PENDING', entity: 'MGM-2026-8941', details: 'Status PENDING. Unique constraint OK', status: 'SUCCESS' },
    { time: '20:14:55', event: 'RAZORPAY_WEBHOOK', entity: 'pay_Or9B6w31aX', details: 'Signature verified. Amount ₹1,400', status: 'CONFIRMED' },
    { time: '20:14:56', event: 'REDIS_KEY_DEL', entity: 'court:c1:2026-10-17:19:00', details: 'Lock released after payment', status: 'RELEASED' },
    { time: '19:40:15', event: 'WALKIN_COUNTER_BOOK', entity: 'MGM-2026-7832', details: 'Counter cash collected: ₹1,200', status: 'CONFIRMED' }
  ],
  selectedVenue: null,
  selectedCourt: null,
  selectedDate: null,
  selectedSlots: [],
  redisHoldTimer: null,
  redisSecondsLeft: 600,
  activeCoupon: null
};

// --- BILINGUAL DICTIONARY (English & தமிழ்) ---
const I18N = {
  en: {
    tagline: 'Turf Booking Platform',
    navPlayer: 'Player Booking',
    navOwner: 'Owner Dashboard',
    navAdmin: 'Admin Console',
    myBookingsBtn: 'My Bookings',
    loginBtn: 'Login / OTP',
    liveSlotsBadge: 'Live 10-Minute Redis Hold • Zero Double Bookings',
    heroTitle: 'Book Your Arena. <span class="highlight">Play Your Game.</span> Never Lose a Slot.',
    heroSubtitle: 'Instant online slot bookings for 5-a-side / 7-a-side football, box cricket, badminton, and multi-sport turfs with real-time court availability and instant UPI payment.',
    searchLocation: 'Location / City',
    searchSport: 'Sport Category',
    searchDate: 'Date',
    searchTimeBand: 'Time Band',
    findSlotsBtn: 'Find Slots',
    popularTurfsHeading: 'Featured Sports Arenas Near You',
    popularTurfsSub: 'Verified FIFA-grade astroturf, high-power LED floodlights, shower rooms & parking.',
    addWalkinBtn: 'New Walk-In Booking',
    blockSlotBtn: 'Block for Maintenance'
  },
  ta: {
    tagline: 'விளையாட்டு மைதான முன்பதிவு தளம்',
    navPlayer: 'வீரர் முன்பதிவு',
    navOwner: 'உரிமையாளர் டாஷ்போர்டு',
    navAdmin: 'நிர்வாக மையம்',
    myBookingsBtn: 'எனது முன்பதிவுகள்',
    loginBtn: 'உள்நுழை / OTP',
    liveSlotsBadge: 'நேரடி 10 நிமிட லாக் • இரட்டை முன்பதிவு இல்லை',
    heroTitle: 'உங்கள் மைதானத்தை பதிவு செய்யுங்கள். <span class="highlight">விளையாடுங்கள்.</span> ஸ்லாட் தவறவிடாதீர்கள்.',
    heroSubtitle: 'கால்பந்து (5s & 7s), பாக்ஸ் கிரிக்கெட், பேட்மிண்டன் மைதானங்களுக்கான நேரடி முன்பதிவு மற்றும் உடனடி UPI பணம் செலுத்துதல்.',
    searchLocation: 'இடம் / நகரம்',
    searchSport: 'விளையாட்டு வகை',
    searchDate: 'தேதி',
    searchTimeBand: 'நேர பிரிவு',
    findSlotsBtn: 'ஸ்லாட் தேடுக',
    popularTurfsHeading: 'உங்களுக்கு அருகிலுள்ள சிறந்த விளையாட்டு டர்ப்கள்',
    popularTurfsSub: 'தரமான செயற்கை புல் மைதானங்கள், LED ஃப்ளட்லைட் மற்றும் வாகன நிறுத்துமிடம்.',
    addWalkinBtn: 'புதிய நேரடி முன்பதிவு',
    blockSlotBtn: 'பராமரிப்புக்காக பூட்டுக'
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDefaultDate();
  renderVenues();
  renderOwnerMatrix();
  renderAdminTables();
  setupEventListeners();
  updateI18nText();
});

// --- THEME SWITCHER (Day Light / Stadium Dark) ---
function initTheme() {
  const savedTheme = localStorage.getItem('mgm_sport_theme') || 'dark';
  applyTheme(savedTheme, false);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme, true);
  localStorage.setItem('mgm_sport_theme', nextTheme);
}

function applyTheme(theme, notify = false) {
  AppState.currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');

  if (theme === 'light') {
    if (icon) {
      icon.className = 'fa-solid fa-sun';
      icon.style.color = '#f59e0b';
    }
    if (label) {
      label.textContent = AppState.currentLang === 'ta' ? 'பகல்' : 'Light';
    }
    if (notify) {
      showToast('Switched to Day Match (Light Turf) Theme ☀️');
    }
  } else {
    if (icon) {
      icon.className = 'fa-solid fa-moon';
      icon.style.color = '#38bdf8';
    }
    if (label) {
      label.textContent = AppState.currentLang === 'ta' ? 'இரவு' : 'Dark';
    }
    if (notify) {
      showToast('Switched to Stadium Night (Dark) Theme 🌙');
    }
  }
}

function initDefaultDate() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dateInput = document.getElementById('searchDateInput');
  const ownerDateInput = document.getElementById('ownerScheduleDate');
  if (dateInput) dateInput.value = dateStr;
  if (ownerDateInput) ownerDateInput.value = dateStr;
  AppState.selectedDate = dateStr;
}

// --- LANGUAGE SWITCHER ---
function toggleLanguage() {
  AppState.currentLang = AppState.currentLang === 'en' ? 'ta' : 'en';
  const label = document.getElementById('currentLangLabel');
  if (label) {
    label.textContent = AppState.currentLang === 'en' ? 'தமிழ்' : 'English';
  }
  applyTheme(AppState.currentTheme || 'dark', false);
  updateI18nText();
  showToast(AppState.currentLang === 'en' ? 'Switched to English' : 'தமிழ் மொழிக்கு மாற்றப்பட்டது');
}

function updateI18nText() {
  const dict = I18N[AppState.currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });
}

// --- PORTAL NAVIGATION TABS ---
function switchView(viewName) {
  AppState.currentView = viewName;
  
  // Hide all views
  document.getElementById('playerView').classList.remove('active');
  document.getElementById('ownerView').classList.remove('active');
  document.getElementById('adminView').classList.remove('active');

  // Deactivate all nav pills
  document.getElementById('btnViewPlayer').classList.remove('active');
  document.getElementById('btnViewOwner').classList.remove('active');
  document.getElementById('btnViewAdmin').classList.remove('active');

  if (viewName === 'player') {
    document.getElementById('playerView').classList.add('active');
    document.getElementById('btnViewPlayer').classList.add('active');
  } else if (viewName === 'owner') {
    document.getElementById('ownerView').classList.add('active');
    document.getElementById('btnViewOwner').classList.add('active');
    renderOwnerMatrix();
  } else if (viewName === 'admin') {
    document.getElementById('adminView').classList.add('active');
    document.getElementById('btnViewAdmin').classList.add('active');
    renderAdminTables();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- VENUES RENDERING & SEARCH ---
function renderVenues(filteredList = null) {
  const container = document.getElementById('venuesContainer');
  if (!container) return;
  const list = filteredList || AppState.venues;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:50px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-subtle);">
        <i class="fa-regular fa-futbol" style="font-size:40px; color:var(--text-muted); margin-bottom:12px;"></i>
        <h3>No Turfs Match Your Search</h3>
        <p style="color:var(--text-secondary); margin-top:6px;">Try switching location or selecting all sports.</p>
        <button class="btn-primary" style="margin-top:16px;" onclick="resetSearchFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(v => {
    const sportsTags = v.sports.map(s => {
      const icon = s === 'football' ? 'fa-futbol' : s === 'cricket' ? 'fa-baseball-bat-ball' : 'fa-table-tennis-paddle-ball';
      const label = s.charAt(0).toUpperCase() + s.slice(1);
      return `<span><i class="fa-solid ${icon}"></i> ${label}</span>`;
    }).join(' • ');

    const amenitiesList = v.amenities.slice(0, 4).map(a => `<span class="amenity-pill"><i class="fa-solid fa-check" style="color:var(--primary-bright); font-size:10px;"></i> ${a}</span>`).join('');

    return `
      <div class="venue-card">
        <div class="venue-img-wrap">
          <img src="${v.image}" alt="${v.name}" class="venue-img">
          <div class="venue-sport-tag">${sportsTags}</div>
          <div class="venue-rating-badge">
            <i class="fa-solid fa-star"></i> ${v.rating} <span style="font-size:10px; opacity:0.8;">(${v.reviewsCount})</span>
          </div>
        </div>

        <div class="venue-body">
          <div class="venue-header-row">
            <h3 class="venue-name">${v.name}</h3>
          </div>
          <div class="venue-location">
            <i class="fa-solid fa-location-dot" style="color:var(--primary-bright);"></i>
            <span>${v.city} • 1.8 km</span>
          </div>

          <div class="venue-amenities">${amenitiesList}</div>

          <div class="venue-courts-info">
            <span>Available: <strong>${v.courts.length} Courts/Pitches</strong></span>
            <span style="color:var(--primary-bright);"><i class="fa-solid fa-bolt"></i> Instant Confirmation</span>
          </div>

          <div class="venue-footer">
            <div class="price-container">
              <span class="price-sub">Starting from</span>
              <span class="price-main">₹${v.priceFrom} <small>/hr</small></span>
            </div>
            <button class="btn-primary" onclick="openSlotBookingModal('${v.id}')">
              <span>Book Slot</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterVenues() {
  const loc = document.getElementById('searchLocationSelect').value;
  const sport = document.getElementById('searchSportSelect').value;

  let filtered = AppState.venues.filter(v => {
    let matchLoc = loc === 'all' || v.area.toLowerCase().includes(loc.toLowerCase());
    let matchSport = sport === 'all' || v.sports.includes(sport);
    return matchLoc && matchSport;
  });

  renderVenues(filtered);
  showToast(`Found ${filtered.length} venue(s) for your criteria`);
}

function setQuickSportFilter(sport, el) {
  document.querySelectorAll('.sport-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  const sportSelect = document.getElementById('searchSportSelect');
  if (sportSelect) sportSelect.value = sport;
  filterVenues();
}

function resetSearchFilters() {
  document.getElementById('searchLocationSelect').value = 'all';
  document.getElementById('searchSportSelect').value = 'all';
  document.querySelectorAll('.sport-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.sport-chip').classList.add('active');
  renderVenues();
}

// --- INTERACTIVE SLOT BOOKING MODAL ---
function openSlotBookingModal(venueId) {
  const venue = AppState.venues.find(v => v.id === venueId);
  if (!venue) return;

  AppState.selectedVenue = venue;
  AppState.selectedCourt = venue.courts[0];
  AppState.selectedSlots = [];
  AppState.activeCoupon = null;

  document.getElementById('modalVenueName').textContent = venue.name;
  document.getElementById('modalVenueLocation').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${venue.city}`;

  renderModalCourtTabs();
  renderModalDateRibbon();
  renderModalSlots();
  updateCheckoutCalculations();

  document.getElementById('slotBookingModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSlotBookingModal() {
  clearRedisHoldTimer();
  AppState.selectedSlots = [];
  document.getElementById('slotBookingModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function renderModalCourtTabs() {
  const container = document.getElementById('modalCourtsRow');
  const venue = AppState.selectedVenue;
  if (!venue || !container) return;

  container.innerHTML = venue.courts.map(court => {
    const isActive = court.id === AppState.selectedCourt.id;
    return `
      <div class="court-tab-card ${isActive ? 'active' : ''}" onclick="selectModalCourt('${court.id}')">
        <div class="court-name">${court.name}</div>
        <div class="court-spec">Weekday: ₹${court.priceWeekday} • Peak: ₹${court.pricePeak}</div>
      </div>
    `;
  }).join('');
}

function selectModalCourt(courtId) {
  AppState.selectedCourt = AppState.selectedVenue.courts.find(c => c.id === courtId);
  AppState.selectedSlots = [];
  clearRedisHoldTimer();
  renderModalCourtTabs();
  renderModalSlots();
  updateCheckoutCalculations();
}

function renderModalDateRibbon() {
  const container = document.getElementById('modalDateRibbon');
  if (!container) return;

  const dates = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayNames[d.getDay()],
      dayNum: d.getDate()
    });
  }

  container.innerHTML = dates.map((item, idx) => {
    const isActive = item.dateStr === AppState.selectedDate;
    return `
      <div class="date-btn ${isActive ? 'active' : ''}" onclick="selectModalDate('${item.dateStr}')">
        <span class="date-day">${item.dayName}</span>
        <span class="date-num">${item.dayNum}</span>
      </div>
    `;
  }).join('');
}

function selectModalDate(dateStr) {
  AppState.selectedDate = dateStr;
  AppState.selectedSlots = [];
  clearRedisHoldTimer();
  renderModalDateRibbon();
  renderModalSlots();
  updateCheckoutCalculations();
}

// Slot generator with peak pricing logic
function renderModalSlots() {
  const container = document.getElementById('modalSlotsContainer');
  if (!container) return;

  const court = AppState.selectedCourt;
  const timeBands = [
    {
      title: 'Morning Session (6 AM - 12 PM)',
      icon: 'fa-sun',
      slots: [
        { time: '06:00 AM - 07:00 AM', status: 'available', price: court.priceWeekday },
        { time: '07:00 AM - 08:00 AM', status: 'available', price: court.priceWeekday },
        { time: '08:00 AM - 09:00 AM', status: 'booked', price: court.priceWeekday },
        { time: '09:00 AM - 10:00 AM', status: 'available', price: court.priceWeekday },
        { time: '10:00 AM - 11:00 AM', status: 'available', price: court.priceWeekday },
        { time: '11:00 AM - 12:00 PM', status: 'available', price: court.priceWeekday }
      ]
    },
    {
      title: 'Afternoon Session (12 PM - 4 PM)',
      icon: 'fa-cloud-sun',
      slots: [
        { time: '12:00 PM - 01:00 PM', status: 'available', price: court.priceWeekday - 100 },
        { time: '01:00 PM - 02:00 PM', status: 'available', price: court.priceWeekday - 100 },
        { time: '02:00 PM - 03:00 PM', status: 'available', price: court.priceWeekday },
        { time: '03:00 PM - 04:00 PM', status: 'booked', price: court.priceWeekday }
      ]
    },
    {
      title: 'Evening Peak Floodlights (4 PM - 9 PM)',
      icon: 'fa-lightbulb',
      slots: [
        { time: '04:00 PM - 05:00 PM', status: 'available', price: court.pricePeak - 100 },
        { time: '05:00 PM - 06:00 PM', status: 'available', price: court.pricePeak },
        { time: '06:00 PM - 07:00 PM', status: 'booked', price: court.pricePeak },
        { time: '07:00 PM - 08:00 PM', status: 'available', price: court.pricePeak },
        { time: '08:00 PM - 09:00 PM', status: 'available', price: court.pricePeak }
      ]
    },
    {
      title: 'Night Game Session (9 PM - 1 AM)',
      icon: 'fa-moon',
      slots: [
        { time: '09:00 PM - 10:00 PM', status: 'available', price: court.pricePeak },
        { time: '10:00 PM - 11:00 PM', status: 'available', price: court.pricePeak },
        { time: '11:00 PM - 12:00 AM', status: 'available', price: court.priceWeekday + 100 },
        { time: '12:00 AM - 01:00 AM', status: 'available', price: court.priceWeekday }
      ]
    }
  ];

  container.innerHTML = timeBands.map(band => {
    const slotsHTML = band.slots.map(slot => {
      const isSelected = AppState.selectedSlots.some(s => s.time === slot.time);
      const isBooked = slot.status === 'booked';
      const cssClass = isSelected ? 'selected' : isBooked ? 'booked' : 'available';

      return `
        <div class="slot-card ${cssClass}" onclick="handleSlotClick('${slot.time}', ${slot.price}, '${slot.status}')">
          <span class="slot-time">${slot.time.split(' - ')[0]}</span>
          <span class="slot-price">₹${slot.price}</span>
          <span class="slot-status-tag">${isSelected ? 'LOCKED' : slot.status.toUpperCase()}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="time-band-group">
        <div class="time-band-title">
          <i class="fa-solid ${band.icon}"></i> ${band.title}
        </div>
        <div class="slots-grid">${slotsHTML}</div>
      </div>
    `;
  }).join('');
}

// Handling Slot Selection + Redis 10-Min Hold Acquisition
function handleSlotClick(time, price, status) {
  if (status === 'booked') {
    showToast('This slot is already booked and protected by database uniqueness rule.', 'warning');
    return;
  }

  const existingIdx = AppState.selectedSlots.findIndex(s => s.time === time);
  if (existingIdx >= 0) {
    AppState.selectedSlots.splice(existingIdx, 1);
  } else {
    // Acquire Redis Hold simulation
    AppState.selectedSlots.push({ time, price });
    startRedisHoldTimer();
    addAuditLog('REDIS_SET_NX', `court:${AppState.selectedCourt.id}:${AppState.selectedDate}:${time.split(' ')[0]}`, '10m Hold Acquired');
  }

  renderModalSlots();
  updateCheckoutCalculations();
}

// Redis 10-Minute Timer Simulation
function startRedisHoldTimer() {
  if (AppState.redisHoldTimer) return; // already ticking

  AppState.redisSecondsLeft = 600; // 10 minutes
  const alertBox = document.getElementById('holdTimerAlert');
  const countdownEl = document.getElementById('holdTimerCountdown');
  if (alertBox) alertBox.style.display = 'flex';

  AppState.redisHoldTimer = setInterval(() => {
    AppState.redisSecondsLeft--;
    if (AppState.redisSecondsLeft <= 0) {
      clearRedisHoldTimer();
      AppState.selectedSlots = [];
      renderModalSlots();
      updateCheckoutCalculations();
      showToast('Your 10-minute slot lock expired in Redis. Please re-select slots.', 'warning');
      addAuditLog('REDIS_KEY_EXPIRED', `court:${AppState.selectedCourt?.id}`, 'Lock timed out, released to pool');
      return;
    }

    const mins = Math.floor(AppState.redisSecondsLeft / 60);
    const secs = AppState.redisSecondsLeft % 60;
    if (countdownEl) {
      countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function clearRedisHoldTimer() {
  if (AppState.redisHoldTimer) {
    clearInterval(AppState.redisHoldTimer);
    AppState.redisHoldTimer = null;
  }
  const alertBox = document.getElementById('holdTimerAlert');
  if (alertBox) alertBox.style.display = 'none';
}

// Checkout Calculations & Coupon
function updateCheckoutCalculations() {
  const summaryEl = document.getElementById('checkoutSlotSummary');
  const payableEl = document.getElementById('checkoutPayableAmt');
  const btnProceed = document.getElementById('btnProceedToPay');
  const payMode = document.getElementById('checkoutPayModeSelect').value;

  if (AppState.selectedSlots.length === 0) {
    if (summaryEl) summaryEl.textContent = 'No slot selected';
    if (payableEl) payableEl.textContent = '₹0';
    if (btnProceed) btnProceed.disabled = true;
    return;
  }

  let totalCourtAmount = AppState.selectedSlots.reduce((acc, curr) => acc + curr.price, 0);

  // Apply Coupon if any
  let discount = 0;
  if (AppState.activeCoupon === 'MGMFIRST') {
    discount = 200;
  } else if (AppState.activeCoupon === 'WEEKEND20') {
    discount = Math.round(totalCourtAmount * 0.2);
  }

  let finalTotal = Math.max(0, totalCourtAmount - discount);
  let payableNow = payMode === 'advance30' ? Math.round(finalTotal * 0.3) : finalTotal;

  if (summaryEl) {
    summaryEl.textContent = `${AppState.selectedSlots.length} Slot(s) • ${AppState.selectedCourt.name}`;
  }
  if (payableEl) {
    payableEl.innerHTML = `₹${payableNow.toLocaleString('en-IN')} <span style="font-size:12px; font-weight:400; color:var(--text-secondary);">${payMode === 'advance30' ? '(30% Token)' : '(Full)'}</span>`;
  }
  if (btnProceed) btnProceed.disabled = false;
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const code = input ? input.value.trim().toUpperCase() : '';

  if (code === 'MGMFIRST') {
    AppState.activeCoupon = 'MGMFIRST';
    showToast('Coupon MGMFIRST applied! ₹200 Flat Discount');
    updateCheckoutCalculations();
  } else if (code === 'WEEKEND20') {
    AppState.activeCoupon = 'WEEKEND20';
    showToast('Coupon WEEKEND20 applied! 20% Discount');
    updateCheckoutCalculations();
  } else {
    showToast('Invalid Coupon. Try MGMFIRST or WEEKEND20', 'warning');
  }
}

// --- RAZORPAY GATEWAY MODAL SIMULATION ---
function proceedToPaymentGateway() {
  if (AppState.selectedSlots.length === 0) return;

  const payMode = document.getElementById('checkoutPayModeSelect').value;
  let totalCourtAmount = AppState.selectedSlots.reduce((acc, curr) => acc + curr.price, 0);
  let discount = AppState.activeCoupon === 'MGMFIRST' ? 200 : AppState.activeCoupon === 'WEEKEND20' ? Math.round(totalCourtAmount * 0.2) : 0;
  let finalTotal = Math.max(0, totalCourtAmount - discount);
  let payableNow = payMode === 'advance30' ? Math.round(finalTotal * 0.3) : finalTotal;

  document.getElementById('gatewayPayableAmount').textContent = `₹${payableNow.toLocaleString('en-IN')}`;
  document.getElementById('gatewaySlotInfo').textContent = `${AppState.selectedCourt.name} • ${AppState.selectedSlots.map(s => s.time).join(', ')}`;

  document.getElementById('paymentGatewayModal').classList.add('active');
  addAuditLog('PG_ORDER_CREATED', `order_MGM_${Date.now()}`, `Razorpay Order generated for ₹${payableNow}`);
}

function closePaymentModal() {
  document.getElementById('paymentGatewayModal').classList.remove('active');
}

function selectPayMethod(method) {
  const upiSec = document.getElementById('upiPaymentSection');
  const cardSec = document.getElementById('cardPaymentSection');
  const cardTab = document.getElementById('payMethodCard');
  const upiTab = document.getElementById('payMethodUpi');

  if (method === 'upi') {
    upiSec.style.display = 'block';
    cardSec.style.display = 'none';
    upiTab.classList.add('active');
    cardTab.classList.remove('active');
  } else {
    upiSec.style.display = 'none';
    cardSec.style.display = 'flex';
    upiTab.classList.remove('active');
    cardTab.classList.add('active');
  }
}

// Mock Payment Execution
function executeMockPayment(providerName) {
  closePaymentModal();
  showToast(`Simulating payment verification with ${providerName}...`);

  setTimeout(() => {
    const bookingId = 'MGM-2026-' + Math.floor(1000 + Math.random() * 9000);
    const payMode = document.getElementById('checkoutPayModeSelect').value;
    let totalCourtAmount = AppState.selectedSlots.reduce((acc, curr) => acc + curr.price, 0);
    let discount = AppState.activeCoupon === 'MGMFIRST' ? 200 : AppState.activeCoupon === 'WEEKEND20' ? Math.round(totalCourtAmount * 0.2) : 0;
    let finalTotal = Math.max(0, totalCourtAmount - discount);
    let payableNow = payMode === 'advance30' ? Math.round(finalTotal * 0.3) : finalTotal;

    const newBooking = {
      id: bookingId,
      venueName: AppState.selectedVenue.name,
      courtName: AppState.selectedCourt.name,
      date: AppState.selectedDate,
      slot: AppState.selectedSlots.map(s => s.time).join(', '),
      totalAmount: finalTotal,
      paidAmount: payableNow,
      paymentStatus: payMode === 'advance30' ? 'PARTIAL_30' : 'PAID_FULL',
      bookingStatus: 'CONFIRMED',
      customerName: AppState.currentUser.name,
      customerPhone: AppState.currentUser.phone,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    AppState.bookings.unshift(newBooking);

    // Also update owner schedule matrix
    AppState.selectedSlots.forEach(s => {
      AppState.ownerSchedule.push({
        court: AppState.selectedCourt.name,
        time: s.time,
        status: 'booked-online',
        customer: AppState.currentUser.name,
        mode: `Online ${providerName}`
      });
    });

    // Audit logs
    addAuditLog('RAZORPAY_WEBHOOK', `pay_tx_${Date.now()}`, `Signature OK. ₹${payableNow} confirmed via ${providerName}`);
    addAuditLog('BOOKING_CONFIRMED', bookingId, `Slot confirmed. Unique index rule satisfied.`);

    closeSlotBookingModal();
    openTicketModal(newBooking);
  }, 1200);
}

// --- TICKET PASS MODAL ---
function openTicketModal(booking) {
  document.getElementById('ticketVenueName').textContent = booking.venueName;
  document.getElementById('ticketBookingId').textContent = `Booking Ref: #${booking.id}`;
  document.getElementById('ticketCourtSport').textContent = booking.courtName;
  document.getElementById('ticketDateTiming').textContent = `${booking.date} • ${booking.slot}`;
  
  const paymentText = booking.paymentStatus === 'PAID_FULL' 
    ? `₹${booking.paidAmount.toLocaleString('en-IN')} (Paid in Full via UPI)`
    : `₹${booking.paidAmount.toLocaleString('en-IN')} Paid (30% Token) • Balance ₹${booking.totalAmount - booking.paidAmount} due at venue`;
  document.getElementById('ticketAmountSummary').textContent = paymentText;
  document.getElementById('ticketCustomer').textContent = `${booking.customerName} (${booking.customerPhone})`;

  document.getElementById('ticketModal').classList.add('active');
}

function closeTicketModal() {
  document.getElementById('ticketModal').classList.remove('active');
  openMyBookingsModal();
}

function shareSplitBillWhatsApp() {
  const booking = AppState.bookings[0];
  if (!booking) return;

  const perPlayer = Math.round(booking.totalAmount / 10);
  const text = `Hey team! I have booked ${booking.courtName} at ${booking.venueName} for ${booking.date} (${booking.slot}). Total: ₹${booking.totalAmount}. Your share is ₹${perPlayer}. Pay me on UPI / GPay!`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// --- MY BOOKINGS MODAL ---
function openMyBookingsModal() {
  const container = document.getElementById('myBookingsListContainer');
  if (!container) return;

  if (AppState.bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-secondary);">
        <i class="fa-solid fa-ticket" style="font-size:36px; margin-bottom:12px; color:var(--text-muted);"></i>
        <h4>No Bookings Yet</h4>
        <p>Your upcoming turf passes will appear here.</p>
      </div>
    `;
  } else {
    container.innerHTML = AppState.bookings.map(b => {
      const isPaidFull = b.paymentStatus === 'PAID_FULL';
      return `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <div>
              <span class="badge-tag badge-green">#${b.id}</span>
              <h4 style="font-size:17px; margin-top:4px;">${b.venueName}</h4>
              <p style="font-size:13px; color:var(--text-secondary);">${b.courtName}</p>
            </div>
            <div style="text-align:right;">
              <span class="badge-tag ${isPaidFull ? 'badge-green' : 'badge-amber'}">${isPaidFull ? '100% PAID' : '30% ADVANCE'}</span>
              <div style="font-size:18px; font-weight:800; color:var(--primary-bright); margin-top:4px;">₹${b.totalAmount}</div>
            </div>
          </div>
          <div style="display:flex; gap:16px; font-size:12px; color:var(--text-secondary); margin-bottom:14px; flex-wrap:wrap;">
            <span><i class="fa-regular fa-calendar"></i> ${b.date}</span>
            <span><i class="fa-regular fa-clock"></i> ${b.slot}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px;">
            <button class="btn-secondary" style="font-size:11px; padding:6px 12px; color:var(--accent-rose); border-color:rgba(244,63,94,0.3);" onclick="cancelBooking('${b.id}')">
              <i class="fa-solid fa-ban"></i> Cancel Booking (Refund Policy)
            </button>
            <button class="btn-primary" style="font-size:11px; padding:6px 14px;" onclick="viewPass('${b.id}')">
              <i class="fa-solid fa-qrcode"></i> View QR Pass
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('myBookingsModal').classList.add('active');
}

function closeMyBookingsModal() {
  document.getElementById('myBookingsModal').classList.remove('active');
}

function viewPass(bookingId) {
  closeMyBookingsModal();
  const b = AppState.bookings.find(item => item.id === bookingId);
  if (b) openTicketModal(b);
}

function cancelBooking(bookingId) {
  const b = AppState.bookings.find(item => item.id === bookingId);
  if (!b) return;

  const confirmCancel = confirm(`Cancellation Policy:\n- More than 24h: 100% refund\n- 6 to 24h: 50% refund\n- Less than 6h: 0% refund\n\nDo you want to cancel booking #${bookingId}?`);
  if (!confirmCancel) return;

  AppState.bookings = AppState.bookings.filter(item => item.id !== bookingId);
  addAuditLog('BOOKING_CANCELLED', bookingId, `Refund issued per policy: ₹${b.paidAmount}`);
  showToast(`Booking #${bookingId} cancelled. Refund of ₹${b.paidAmount} initiated to original payment source.`);
  openMyBookingsModal();
}

// --- TURF OWNER SCHEDULE MATRIX & COUNTER ACTIONS ---
function renderOwnerMatrix() {
  const table = document.getElementById('ownerScheduleTable');
  if (!table) return;

  const hours = [
    '06:00 AM - 07:00 AM',
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM',
    '09:00 PM - 10:00 PM'
  ];

  const courts = ['Court A (FIFA 7s)', 'Court B (5-a-side)', 'Court C (Box Cricket)'];

  let headerHTML = `<thead><tr><th>Time Hour</th>` + courts.map(c => `<th>${c}</th>`).join('') + `</tr></thead>`;

  let bodyHTML = `<tbody>`;
  hours.forEach(hour => {
    bodyHTML += `<tr><td style="font-weight:700; font-size:12px; color:var(--text-secondary);">${hour}</td>`;

    courts.forEach(court => {
      const match = AppState.ownerSchedule.find(s => s.court === court && s.time === hour);
      if (match) {
        let label = match.customer || 'Reserved';
        let sub = match.mode || '';
        bodyHTML += `
          <td>
            <div class="matrix-slot-cell ${match.status}">
              <span>${label}</span>
              <span style="font-size:10px; opacity:0.8;">${sub}</span>
            </div>
          </td>
        `;
      } else {
        bodyHTML += `
          <td>
            <div class="matrix-slot-cell free" onclick="quickBookFromMatrix('${court}', '${hour}')">
              <span>+ Available</span>
              <span style="font-size:10px;">Click to book</span>
            </div>
          </td>
        `;
      }
    });

    bodyHTML += `</tr>`;
  });
  bodyHTML += `</tbody>`;

  table.innerHTML = headerHTML + bodyHTML;
}

function quickBookFromMatrix(court, hour) {
  document.getElementById('walkinCourt').value = court;
  document.getElementById('walkinSlot').value = hour;
  openWalkinModal();
}

// Walk-in modal
function openWalkinModal() {
  document.getElementById('walkinModal').classList.add('active');
}
function closeWalkinModal() {
  document.getElementById('walkinModal').classList.remove('active');
}

function submitWalkinBooking() {
  const name = document.getElementById('walkinName').value || 'Walk-in Player';
  const phone = document.getElementById('walkinPhone').value || '9999999999';
  const court = document.getElementById('walkinCourt').value;
  const slot = document.getElementById('walkinSlot').value;
  const method = document.getElementById('walkinPaymentMethod').value;
  const amount = parseInt(document.getElementById('walkinAmount').value) || 1200;

  // Add to owner matrix
  AppState.ownerSchedule = AppState.ownerSchedule.filter(s => !(s.court === court && s.time === slot));
  AppState.ownerSchedule.push({
    court,
    time: slot,
    status: 'booked-walkin',
    customer: `${name} (Walk-in)`,
    mode: method
  });

  addAuditLog('WALKIN_COUNTER_BOOK', `WALK-${Date.now()}`, `${court} booked via ${method} for ₹${amount}`);
  renderOwnerMatrix();
  closeWalkinModal();
  showToast(`Walk-in booked for ${name} on ${court}! Slot locked across online app.`);
}

// Block slot modal
function openBlockSlotModal() {
  document.getElementById('blockSlotModal').classList.add('active');
}
function closeBlockSlotModal() {
  document.getElementById('blockSlotModal').classList.remove('active');
}

function confirmBlockSlot() {
  const court = document.getElementById('blockCourtSelect').value;
  const time = document.getElementById('blockSlotTimeSelect').value;
  const reason = document.getElementById('blockReasonSelect').value;

  AppState.ownerSchedule = AppState.ownerSchedule.filter(s => !(s.court === court && s.time === time));
  AppState.ownerSchedule.push({
    court,
    time,
    status: 'blocked-maint',
    customer: reason,
    mode: 'Owner Block'
  });

  addAuditLog('SLOT_BLOCK_MAINT', `BLOCK-${court}`, `Blocked: ${reason}`);
  renderOwnerMatrix();
  closeBlockSlotModal();
  showToast(`${court} slot blocked for "${reason}". Prevented online double-booking.`);
}

function savePricingRules() {
  showToast('Pricing rules and peak hours updated successfully in Redis & PostgreSQL.');
}

// QR scanner modal
function openStaffScannerModal() {
  document.getElementById('staffScannerModal').classList.add('active');
}
function closeStaffScannerModal() {
  document.getElementById('staffScannerModal').classList.remove('active');
}

function verifyCheckIn() {
  const code = document.getElementById('manualBookingCodeInput').value.trim();
  if (!code) {
    showToast('Please enter a 4-digit booking code', 'warning');
    return;
  }
  showToast(`Pass #${code} verified! Player marked Checked-In.`);
  closeStaffScannerModal();
}

// --- PLATFORM ADMIN CONSOLE ---
function renderAdminTables() {
  const venueTableBody = document.getElementById('adminVenuesTableBody');
  const auditTableBody = document.getElementById('auditLogTableBody');

  if (venueTableBody) {
    venueTableBody.innerHTML = AppState.adminVenues.map(v => {
      const isOk = v.kycStatus === 'VERIFIED';
      return `
        <tr>
          <td><strong>${v.name}</strong></td>
          <td>${v.owner}</td>
          <td>${v.courts} Courts</td>
          <td><span class="badge-tag badge-blue">${v.commission}</span></td>
          <td>
            <span class="badge-tag ${isOk ? 'badge-green' : 'badge-amber'}">${v.kycStatus}</span>
          </td>
          <td>
            ${isOk ? '<button class="btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="showToast(\'Settlement automated via Razorpay Route\')">View Payouts</button>' : '<button class="btn-primary" style="font-size:11px; padding:4px 10px;" onclick="approveVenue(\'' + v.name + '\')">Approve KYC</button>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  if (auditTableBody) {
    auditTableBody.innerHTML = AppState.auditLogs.map(log => {
      const isSuccess = log.status === 'SUCCESS' || log.status === 'CONFIRMED' || log.status === 'RELEASED';
      return `
        <tr>
          <td style="font-family:monospace; font-size:11px; color:var(--text-secondary);">${log.time}</td>
          <td><strong><code>${log.event}</code></strong></td>
          <td style="font-size:12px;">${log.entity}</td>
          <td style="font-size:12px; color:var(--text-secondary);">${log.details}</td>
          <td><span class="badge-tag ${isSuccess ? 'badge-green' : 'badge-amber'}">${log.status}</span></td>
        </tr>
      `;
    }).join('');
  }
}

function approveVenue(name) {
  const item = AppState.adminVenues.find(v => v.name === name);
  if (item) {
    item.kycStatus = 'VERIFIED';
    item.bankStatus = 'ACTIVE';
    addAuditLog('ADMIN_KYC_APPROVE', name, 'Venue approved for live bookings');
    renderAdminTables();
    showToast(`Turf venue ${name} approved and activated for live bookings!`);
  }
}

function simulateNewVenueOnboard() {
  const newName = prompt('Enter New Sports Turf Name:', 'Kovai Champions Arena');
  if (!newName) return;

  AppState.adminVenues.push({
    name: newName,
    owner: 'Arjun Sports Syndicate',
    courts: 2,
    commission: '5%',
    kycStatus: 'VERIFIED',
    bankStatus: 'ACTIVE'
  });
  renderAdminTables();
  showToast(`Venue "${newName}" onboarded with automatic Razorpay Route integration!`);
}

function addAuditLog(event, entity, details, status = 'SUCCESS') {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0];
  AppState.auditLogs.unshift({ time, event, entity, details, status });
  renderAdminTables();
}

// --- AUTH / OTP MODAL ---
function openAuthModal() {
  document.getElementById('authModal').classList.add('active');
}
function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

let otpStep = 1;
function handleAuthAction() {
  const btn = document.getElementById('btnSendVerifyOtp');
  const otpSec = document.getElementById('otpInputSection');

  if (otpStep === 1) {
    otpSec.style.display = 'block';
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Verify & Sign In`;
    otpStep = 2;
    showToast('OTP sent! Use demo OTP: 123456');
  } else {
    const name = document.getElementById('authNameInput').value || 'Rajesh Kumar';
    const phone = document.getElementById('authPhoneInput').value || '9876543210';
    AppState.currentUser.name = name;
    AppState.currentUser.phone = phone;
    AppState.currentUser.isLoggedIn = true;

    document.getElementById('authContainer').innerHTML = `
      <div class="user-profile-badge" onclick="openMyBookingsModal()">
        <div class="user-avatar">${name.charAt(0)}</div>
        <span style="font-weight:700;">${name}</span>
      </div>
    `;

    closeAuthModal();
    showToast(`Welcome back, ${name}!`);
    otpStep = 1;
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  const icon = type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
  const iconColor = type === 'warning' ? 'var(--accent-amber)' : 'var(--primary-bright)';

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color:${iconColor}; font-size:16px;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function setupEventListeners() {
  // ESC key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      document.body.style.overflow = 'auto';
    }
  });
}
