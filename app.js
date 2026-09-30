// ============================================================================
// DISTRICT BY ISTAROTH: MULTI-PAGE GOING-OUT PLATFORM CONTROLLER
// Features: For You, Events, Dining, Movies, Comedy, Treasury & Take-Rate Engine
// ============================================================================

import { 
  WORLD_REGIONS, 
  INDIA_CITIES, 
  CATEGORIES, 
  INITIAL_EVENTS, 
  INITIAL_LEDGER, 
  PIPELINE_SOURCES,
  DISTRICT_TABS,
  FEATURED_HERO_CAROUSEL,
  DINING_VENUES,
  MOVIES_SCREENINGS,
  COMEDY_GIGS 
} from './events-data.js';

class IstarothEventsApp {
  constructor() {
    this.currentRegion = localStorage.getItem('istaroth_region') || 'bengaluru';
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortMethod = 'upcoming';
    this.activeDistrictTab = 'forYouView';
    this.carouselIndex = 0;
    this.carouselTimer = null;
    this.diningFilter = 'all';
    this.movieFilter = 'all';
    this.comedyFilter = 'all';
    this.forYouFilter = 'all';
    this.activeDiningVenue = null;
    this.selectedDiningSlot = null;

    // Global Platform Take-Rate (Percentage cut you capture)
    this.platformTakeRate = parseFloat(localStorage.getItem('istaroth_take_rate')) || 8.0;

    // Load or initialize events & transactions
    this.events = this.loadEvents();
    this.ledger = this.loadLedger();
    this.myTickets = this.loadTickets();

    // Active checkout state
    this.activeEvent = null;
    this.selectedTier = 'general';
    this.ticketQuantity = 1;

    this.init();
  }

  init() {
    this.initDistrictNavigation();
    this.initDistrictCarousel();
    this.initBookMyShowLocationModal();
    this.renderCategoryPills();
    this.bindSearchAndSort();
    this.bindCheckoutModal();
    this.bindDiningModal();
    this.bindHostEventForm();
    this.bindTreasuryControls();
    this.initMasterSearch();
    
    // Apply initial state across all views
    this.updateRegionDisplay();
    this.renderForYouView();
    this.renderEvents();
    this.renderDiningView();
    this.renderMoviesView();
    this.renderComedyView();
    this.updateTreasuryView();
    this.renderMyTickets();

    // Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Scroll shadow on District Master Header
    window.addEventListener('scroll', () => {
      const header = document.getElementById('masterHeader');
      if (header) {
        if (window.scrollY > 15) {
          header.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)';
        } else {
          header.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // PERSISTENCE HELPERS
  // --------------------------------------------------------------------------
  loadEvents() {
    const saved = localStorage.getItem('istaroth_events_db_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached events', e);
      }
    }
    localStorage.setItem('istaroth_events_db_v2', JSON.stringify(INITIAL_EVENTS));
    return [...INITIAL_EVENTS];
  }

  saveEvents() {
    localStorage.setItem('istaroth_events_db_v2', JSON.stringify(this.events));
  }

  loadLedger() {
    const saved = localStorage.getItem('istaroth_ledger_db_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached ledger', e);
      }
    }
    localStorage.setItem('istaroth_ledger_db_v2', JSON.stringify(INITIAL_LEDGER));
    return [...INITIAL_LEDGER];
  }

  saveLedger() {
    localStorage.setItem('istaroth_ledger_db_v2', JSON.stringify(this.ledger));
  }

  loadTickets() {
    const saved = localStorage.getItem('istaroth_user_tickets_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tickets', e);
      }
    }
    return [];
  }

  saveTickets() {
    localStorage.setItem('istaroth_user_tickets_v2', JSON.stringify(this.myTickets));
    this.updateTicketBadge();
  }

  // --------------------------------------------------------------------------
  // DISTRICT.IN MULTI-PAGE NAVIGATION & TAB ROUTING
  // --------------------------------------------------------------------------
  initDistrictNavigation() {
    const switchDistrictTab = (targetTabId) => {
      this.activeDistrictTab = targetTabId;

      // Hide all view sections and activate target view
      document.querySelectorAll('.tab-view').forEach(v => {
        v.classList.remove('active');
        v.style.setProperty('display', 'none', 'important');
      });

      const targetEl = document.getElementById(targetTabId);
      if (targetEl) {
        targetEl.classList.add('active');
        targetEl.style.setProperty('display', 'block', 'important');
      }

      // Update District Header navigation tab buttons
      document.querySelectorAll('.district-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.districtTab === targetTabId);
      });

      window.scrollTo(0, 0);

      // Trigger respective page rendering
      if (targetTabId === 'forYouView') {
        this.renderForYouView();
      } else if (targetTabId === 'eventsView') {
        this.renderEvents();
      } else if (targetTabId === 'diningView') {
        this.renderDiningView();
      } else if (targetTabId === 'moviesView') {
        this.renderMoviesView();
      } else if (targetTabId === 'comedyView') {
        this.renderComedyView();
      } else if (targetTabId === 'treasuryView') {
        this.updateTreasuryView();
      } else if (targetTabId === 'ticketsView') {
        this.renderMyTickets();
      }

      if (window.lucide) window.lucide.createIcons();
    };

    this.switchDistrictTab = switchDistrictTab;

    // Listen to all tab triggers
    document.querySelectorAll('[data-district-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = el.dataset.districtTab;
        if (tabId) switchDistrictTab(tabId);
      });
    });

    document.getElementById('brandHomeBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchDistrictTab('forYouView');
    });

    // Quick category filters on For You page
    document.querySelectorAll('[data-for-you-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-for-you-filter]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.forYouFilter;
        this.forYouFilter = filter;
        if (filter === 'dining') {
          switchDistrictTab('diningView');
        } else if (filter === 'movies') {
          switchDistrictTab('moviesView');
        } else if (filter === 'comedy') {
          switchDistrictTab('comedyView');
        } else if (filter === 'all') {
          this.renderForYouView();
        } else {
          this.setCategory(filter);
          switchDistrictTab('eventsView');
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // DISTRICT SHOWCASE HERO CAROUSEL
  // --------------------------------------------------------------------------
  initDistrictCarousel() {
    const track = document.getElementById('carouselSlidesTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    if (!track) return;

    track.innerHTML = FEATURED_HERO_CAROUSEL.map(slide => `
      <div class="district-slide" style="background-image: url('${slide.image}');">
        <div class="district-slide-overlay"></div>
        <div class="district-slide-content">
          <span class="district-slide-badge">${slide.badge}</span>
          <h2 class="district-slide-title">${slide.title}</h2>
          <p class="district-slide-sub">${slide.subtitle} • ${slide.date}</p>
          <div class="district-slide-actions">
            <button class="district-slide-btn" data-slide-action="${slide.id}">
              <i data-lucide="ticket" style="width:16px;height:16px;color:#6444E4;"></i>
              <span>${slide.type === 'dining' ? 'Reserve Table' : slide.type === 'movies' ? 'Select Seats' : 'Book Tickets'}</span>
            </button>
            <div class="district-slide-price-tag">
              Starting from <strong>₹${slide.price}</strong>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = FEATURED_HERO_CAROUSEL.map((_, i) => 
        `<button class="district-carousel-dot ${i === 0 ? 'active' : ''}" data-slide-dot="${i}"></button>`
      ).join('');
    }

    const updateSlide = (index) => {
      this.carouselIndex = (index + FEATURED_HERO_CAROUSEL.length) % FEATURED_HERO_CAROUSEL.length;
      track.style.transform = `translateX(-${this.carouselIndex * 100}%)`;
      dotsContainer?.querySelectorAll('.district-carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === this.carouselIndex);
      });
    };

    prevBtn?.addEventListener('click', () => updateSlide(this.carouselIndex - 1));
    nextBtn?.addEventListener('click', () => updateSlide(this.carouselIndex + 1));

    dotsContainer?.querySelectorAll('.district-carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        updateSlide(parseInt(dot.dataset.slideDot, 10));
      });
    });

    track.querySelectorAll('[data-slide-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.slideAction;
        const item = FEATURED_HERO_CAROUSEL.find(s => s.id === id);
        if (!item) return;
        if (item.type === 'dining') {
          const diningSpot = DINING_VENUES.find(d => d.id === item.targetDiningId) || DINING_VENUES[0];
          this.openDiningModal(diningSpot);
        } else if (item.type === 'movies') {
          const movie = MOVIES_SCREENINGS.find(m => m.id === item.targetMovieId) || MOVIES_SCREENINGS[0];
          this.openMovieBooking(movie, movie.cinemas[0]);
        } else if (item.type === 'comedy') {
          const gig = COMEDY_GIGS.find(c => c.id === item.targetComedyId) || COMEDY_GIGS[0];
          this.openComedyBooking(gig);
        } else {
          const evt = this.events.find(e => e.id === item.targetEventId) || this.events[0];
          this.openCheckoutModal(evt);
        }
      });
    });

    if (this.carouselTimer) clearInterval(this.carouselTimer);
    this.carouselTimer = setInterval(() => updateSlide(this.carouselIndex + 1), 5000);

    const carouselEl = document.getElementById('districtHeroCarousel');
    carouselEl?.addEventListener('mouseenter', () => clearInterval(this.carouselTimer));
    carouselEl?.addEventListener('mouseleave', () => {
      this.carouselTimer = setInterval(() => updateSlide(this.carouselIndex + 1), 5000);
    });
  }

  // --------------------------------------------------------------------------
  // PAGE 1: FOR YOU PERSONALIZED STREAM
  // --------------------------------------------------------------------------
  renderForYouView() {
    // 1. Trending Events
    const trendingContainer = document.getElementById('forYouTrendingEvents');
    if (trendingContainer) {
      const topEvents = this.events.slice(0, 4);
      trendingContainer.innerHTML = topEvents.map(evt => `
        <div class="district-card" data-event-id="${evt.id}">
          <div class="district-card-media">
            <img src="${evt.image}" alt="${evt.title}" loading="lazy">
            <span class="district-card-overlay-badge">${evt.badge || 'Trending'}</span>
            <span class="district-card-overlay-city">${evt.city}</span>
          </div>
          <div class="district-card-body">
            <span class="district-card-category">${evt.category.toUpperCase()}</span>
            <h3 class="district-card-title">${evt.title}</h3>
            <div class="district-card-meta">
              <div class="district-card-meta-row">
                <i data-lucide="calendar" style="width:13px;height:13px;color:#6444E4;"></i>
                <span>${evt.date} • ${evt.time.split('-')[0].trim()}</span>
              </div>
              <div class="district-card-meta-row">
                <i data-lucide="map-pin" style="width:13px;height:13px;color:#6444E4;"></i>
                <span>${evt.venue}</span>
              </div>
            </div>
            <div class="district-card-footer">
              <div class="district-card-price">
                <span class="district-card-price-label">Price From</span>
                <span class="district-card-price-value">${evt.symbol}${evt.price.toLocaleString()}</span>
              </div>
              <button class="district-card-btn" data-book-evt="${evt.id}">Book Pass</button>
            </div>
          </div>
        </div>
      `).join('');

      trendingContainer.querySelectorAll('[data-book-evt]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const evt = this.events.find(ev => ev.id === btn.dataset.bookEvt);
          if (evt) this.openCheckoutModal(evt);
        });
      });
    }

    // 2. Dining Highlights
    const diningContainer = document.getElementById('forYouDiningHighlights');
    if (diningContainer) {
      const spots = DINING_VENUES.slice(0, 3);
      diningContainer.innerHTML = spots.map(dine => `
        <div class="district-venue-card" data-dining-id="${dine.id}">
          <div class="district-card-media">
            <img src="${dine.image}" alt="${dine.name}" loading="lazy">
            <span class="district-card-overlay-badge">★ ${dine.rating} (${dine.reviewsCount})</span>
            <span class="district-card-overlay-city">${dine.city}</span>
          </div>
          <div class="district-card-body">
            <h3 class="district-card-title" style="font-size:17px;">${dine.name}</h3>
            <div class="district-card-meta">
              <div class="district-card-meta-row">
                <i data-lucide="map-pin" style="width:13px;height:13px;color:#EA580C;"></i>
                <span>${dine.neighborhood}</span>
              </div>
              <div class="district-card-meta-row">
                <i data-lucide="coffee" style="width:13px;height:13px;color:#EA580C;"></i>
                <span>${dine.cuisine}</span>
              </div>
            </div>
            <div class="district-venue-perk-badge">
              <i data-lucide="sparkles" style="width:12px;height:12px;"></i>
              <span>${dine.perk}</span>
            </div>
            <div class="district-card-footer" style="margin-top:14px;">
              <div class="district-card-price">
                <span class="district-card-price-label">For Two Approx</span>
                <span class="district-card-price-value">${dine.currency}${dine.priceForTwo}</span>
              </div>
              <button class="district-card-btn" style="background:#EA580C;" data-reserve-dine="${dine.id}">Reserve Table</button>
            </div>
          </div>
        </div>
      `).join('');

      diningContainer.querySelectorAll('[data-reserve-dine]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const d = DINING_VENUES.find(v => v.id === btn.dataset.reserveDine);
          if (d) this.openDiningModal(d);
        });
      });
    }

    // 3. Movies Highlights
    const moviesContainer = document.getElementById('forYouMovieHighlights');
    if (moviesContainer) {
      moviesContainer.innerHTML = MOVIES_SCREENINGS.slice(0, 3).map(mov => `
        <div class="district-movie-card" data-movie-id="${mov.id}">
          <div class="district-card-media" style="height:210px;">
            <img src="${mov.banner}" alt="${mov.title}" loading="lazy">
            <span class="district-card-overlay-badge">${mov.badge}</span>
            <span class="district-card-overlay-city">${mov.rating}</span>
          </div>
          <div class="district-card-body">
            <span class="district-card-category">${mov.genre}</span>
            <h3 class="district-card-title">${mov.title}</h3>
            <div class="district-card-meta">
              <div class="district-card-meta-row">
                <i data-lucide="film" style="width:13px;height:13px;color:#0284C7;"></i>
                <span>${mov.cinemas[0].name}</span>
              </div>
              <div class="district-card-meta-row">
                <i data-lucide="clock" style="width:13px;height:13px;color:#0284C7;"></i>
                <span>${mov.duration} • ${mov.languages}</span>
              </div>
            </div>
            <div class="district-showtimes-strip">
              ${mov.cinemas[0].showtimes.slice(0, 3).map(t => `<span class="district-showtime-chip">${t}</span>`).join('')}
            </div>
            <div class="district-card-footer" style="margin-top:14px;">
              <div class="district-card-price">
                <span class="district-card-price-label">Tickets From</span>
                <span class="district-card-price-value">₹${mov.cinemas[0].price}</span>
              </div>
              <button class="district-card-btn" style="background:#0284C7;" data-book-movie="${mov.id}">Select Seats</button>
            </div>
          </div>
        </div>
      `).join('');

      moviesContainer.querySelectorAll('[data-book-movie]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const m = MOVIES_SCREENINGS.find(v => v.id === btn.dataset.bookMovie);
          if (m) this.openMovieBooking(m, m.cinemas[0]);
        });
      });
    }

    // 4. Comedy Highlights
    const comedyContainer = document.getElementById('forYouComedyHighlights');
    if (comedyContainer) {
      comedyContainer.innerHTML = COMEDY_GIGS.slice(0, 3).map(cmd => `
        <div class="district-card" data-comedy-id="${cmd.id}">
          <div class="district-card-media">
            <img src="${cmd.image}" alt="${cmd.title}" loading="lazy">
            <span class="district-card-overlay-badge">${cmd.badge}</span>
            <span class="district-card-overlay-city">${cmd.city}</span>
          </div>
          <div class="district-card-body">
            <span class="district-card-category" style="color:#D946EF;">${cmd.artist}</span>
            <h3 class="district-card-title">${cmd.title}</h3>
            <div class="district-card-meta">
              <div class="district-card-meta-row">
                <i data-lucide="calendar" style="width:13px;height:13px;color:#D946EF;"></i>
                <span>${cmd.date} • ${cmd.time}</span>
              </div>
              <div class="district-card-meta-row">
                <i data-lucide="map-pin" style="width:13px;height:13px;color:#D946EF;"></i>
                <span>${cmd.venue}</span>
              </div>
            </div>
            <div class="district-card-footer">
              <div class="district-card-price">
                <span class="district-card-price-label">Passes From</span>
                <span class="district-card-price-value">${cmd.currency}${cmd.price}</span>
              </div>
              <button class="district-card-btn" style="background:#D946EF;" data-book-cmd="${cmd.id}">Book Tickets</button>
            </div>
          </div>
        </div>
      `).join('');

      comedyContainer.querySelectorAll('[data-book-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const c = COMEDY_GIGS.find(v => v.id === btn.dataset.bookCmd);
          if (c) this.openComedyBooking(c);
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // PAGE 3: DINING VIEW & RESERVATIONS
  // --------------------------------------------------------------------------
  renderDiningView() {
    const grid = document.getElementById('diningGrid');
    const cityHeader = document.getElementById('diningCityHeader');
    if (!grid) return;

    if (cityHeader) {
      cityHeader.textContent = this.getRegionLabel(this.currentRegion).split(',')[0].trim();
    }

    let filtered = DINING_VENUES;
    if (this.currentRegion !== 'all' && this.currentRegion !== 'india') {
      const match = DINING_VENUES.filter(d => d.region === this.currentRegion);
      if (match.length > 0) filtered = match;
    }

    if (this.diningFilter !== 'all') {
      filtered = filtered.filter(d => 
        d.cuisine.toLowerCase().includes(this.diningFilter.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(this.diningFilter.toLowerCase()))
      );
    }

    grid.innerHTML = filtered.map(dine => `
      <div class="district-venue-card" data-dining-id="${dine.id}">
        <div class="district-card-media" style="height:210px;">
          <img src="${dine.image}" alt="${dine.name}" loading="lazy">
          <span class="district-card-overlay-badge">★ ${dine.rating} (${dine.reviewsCount})</span>
          <span class="district-card-overlay-city">${dine.city}</span>
        </div>
        <div class="district-card-body">
          <h3 class="district-card-title" style="font-size:18px;">${dine.name}</h3>
          <div class="district-card-meta">
            <div class="district-card-meta-row">
              <i data-lucide="map-pin" style="width:13px;height:13px;color:#EA580C;"></i>
              <span>${dine.neighborhood}</span>
            </div>
            <div class="district-card-meta-row">
              <i data-lucide="utensils" style="width:13px;height:13px;color:#EA580C;"></i>
              <span>${dine.cuisine}</span>
            </div>
          </div>
          <div class="district-venue-perk-badge">
            <i data-lucide="gift" style="width:12px;height:12px;"></i>
            <span>${dine.perk}</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:10px;">
            ${dine.features.map(f => `<span style="font-size:11px; background:#F1F5F9; color:var(--text-400); padding:2px 8px; border-radius:4px;">${f}</span>`).join('')}
          </div>
          <div class="district-card-footer" style="margin-top:16px;">
            <div class="district-card-price">
              <span class="district-card-price-label">For Two Approx</span>
              <span class="district-card-price-value">${dine.currency}${dine.priceForTwo}</span>
            </div>
            <button class="district-card-btn" style="background:#EA580C;" data-reserve-dine="${dine.id}">Reserve Table</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-reserve-dine]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = DINING_VENUES.find(v => v.id === btn.dataset.reserveDine);
        if (d) this.openDiningModal(d);
      });
    });

    document.querySelectorAll('[data-dining-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-dining-filter]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.diningFilter = pill.dataset.diningFilter;
        this.renderDiningView();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // PAGE 4: MOVIES & KEYNOTE SCREENINGS VIEW
  // --------------------------------------------------------------------------
  renderMoviesView() {
    const grid = document.getElementById('moviesGrid');
    const cityHeader = document.getElementById('moviesCityHeader');
    if (!grid) return;

    if (cityHeader) {
      cityHeader.textContent = this.getRegionLabel(this.currentRegion).split(',')[0].trim();
    }

    let filtered = MOVIES_SCREENINGS;
    if (this.movieFilter === 'imax') {
      filtered = MOVIES_SCREENINGS.filter(m => m.cinemas.some(c => c.format.includes('IMAX')));
    } else if (this.movieFilter === 'documentary') {
      filtered = MOVIES_SCREENINGS.filter(m => m.genre.includes('Documentary'));
    } else if (this.movieFilter === 'retrospective') {
      filtered = MOVIES_SCREENINGS.filter(m => m.status.includes('Anniversary') || m.status.includes('Special'));
    }

    grid.innerHTML = filtered.map(mov => `
      <div class="district-movie-card" data-movie-id="${mov.id}">
        <div class="district-card-media" style="height:220px;">
          <img src="${mov.banner}" alt="${mov.title}" loading="lazy">
          <span class="district-card-overlay-badge">${mov.badge}</span>
          <span class="district-card-overlay-city">${mov.rating}</span>
        </div>
        <div class="district-card-body">
          <span class="district-card-category">${mov.genre}</span>
          <h3 class="district-card-title" style="font-size:18px;">${mov.title}</h3>
          <p style="font-size:12.5px; color:var(--text-400); margin:0 0 12px; line-height:1.4;">${mov.description}</p>
          <div class="district-card-meta">
            <div class="district-card-meta-row">
              <i data-lucide="film" style="width:13px;height:13px;color:#0284C7;"></i>
              <span>${mov.cinemas[0].name}</span>
            </div>
            <div class="district-card-meta-row">
              <i data-lucide="clock" style="width:13px;height:13px;color:#0284C7;"></i>
              <span>${mov.duration} • ${mov.languages}</span>
            </div>
          </div>
          <div style="border-top:1px solid #F1F5F9; padding-top:10px; margin-top:8px;">
            <div style="font-size:12px; font-weight:700; color:var(--text-200); margin-bottom:6px;">
              📍 ${mov.cinemas[0].name} (${mov.cinemas[0].format})
            </div>
            <div class="district-showtimes-strip">
              ${mov.cinemas[0].showtimes.map(t => `<span class="district-showtime-chip">${t}</span>`).join('')}
            </div>
          </div>
          <div class="district-card-footer" style="margin-top:16px;">
            <div class="district-card-price">
              <span class="district-card-price-label">Tickets From</span>
              <span class="district-card-price-value">₹${mov.cinemas[0].price}</span>
            </div>
            <button class="district-card-btn" style="background:#0284C7;" data-book-movie="${mov.id}">Select Seats</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-book-movie]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = MOVIES_SCREENINGS.find(v => v.id === btn.dataset.bookMovie);
        if (m) this.openMovieBooking(m, m.cinemas[0]);
      });
    });

    document.querySelectorAll('[data-movie-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-movie-filter]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.movieFilter = pill.dataset.movieFilter;
        this.renderMoviesView();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // PAGE 5: COMEDY & GIGS VIEW
  // --------------------------------------------------------------------------
  renderComedyView() {
    const grid = document.getElementById('comedyGrid');
    const cityHeader = document.getElementById('comedyCityHeader');
    if (!grid) return;

    if (cityHeader) {
      cityHeader.textContent = this.getRegionLabel(this.currentRegion).split(',')[0].trim();
    }

    let filtered = COMEDY_GIGS;
    if (this.comedyFilter === 'roast') {
      filtered = COMEDY_GIGS.filter(c => c.title.toLowerCase().includes('roast') || c.tags.some(t => t.includes('Roast')));
    } else if (this.comedyFilter === 'solo') {
      filtered = COMEDY_GIGS.filter(c => c.tags.some(t => t.includes('Solo')));
    } else if (this.comedyFilter === 'auditorium') {
      filtered = COMEDY_GIGS.filter(c => c.tags.some(t => t.includes('Auditorium')));
    }

    grid.innerHTML = filtered.map(cmd => `
      <div class="district-card" data-comedy-id="${cmd.id}">
        <div class="district-card-media" style="height:210px;">
          <img src="${cmd.image}" alt="${cmd.title}" loading="lazy">
          <span class="district-card-overlay-badge">${cmd.badge}</span>
          <span class="district-card-overlay-city">${cmd.city}</span>
        </div>
        <div class="district-card-body">
          <span class="district-card-category" style="color:#D946EF;">${cmd.artist}</span>
          <h3 class="district-card-title" style="font-size:18px;">${cmd.title}</h3>
          <p style="font-size:12.5px; color:var(--text-400); margin:0 0 10px; line-height:1.4;">${cmd.description}</p>
          <div class="district-card-meta">
            <div class="district-card-meta-row">
              <i data-lucide="calendar" style="width:13px;height:13px;color:#D946EF;"></i>
              <span>${cmd.date} • ${cmd.time} (${cmd.duration})</span>
            </div>
            <div class="district-card-meta-row">
              <i data-lucide="map-pin" style="width:13px;height:13px;color:#D946EF;"></i>
              <span>${cmd.venue}</span>
            </div>
          </div>
          <div class="district-card-footer" style="margin-top:16px;">
            <div class="district-card-price">
              <span class="district-card-price-label">Passes From</span>
              <span class="district-card-price-value">${cmd.currency}${cmd.price}</span>
            </div>
            <button class="district-card-btn" style="background:#D946EF;" data-book-cmd="${cmd.id}">Book Tickets</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-book-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = COMEDY_GIGS.find(v => v.id === btn.dataset.bookCmd);
        if (c) this.openComedyBooking(c);
      });
    });

    document.querySelectorAll('[data-comedy-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-comedy-filter]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.comedyFilter = pill.dataset.comedyFilter;
        this.renderComedyView();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // DINING TABLE RESERVATION MODAL
  // --------------------------------------------------------------------------
  bindDiningModal() {
    const modal = document.getElementById('diningReserveModal');
    const closeBtn = document.getElementById('diningModalCloseBtn');
    const form = document.getElementById('diningReserveForm');

    closeBtn?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
      document.body.style.overflow = '';
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName = document.getElementById('diningGuestName').value;
      const guestPhone = document.getElementById('diningGuestPhone').value;
      const partySize = document.getElementById('diningPartySize').value;
      const date = document.getElementById('diningDate').value;
      const slot = this.selectedDiningSlot || '08:00 PM';

      const pass = {
        id: `DINE-RES-${Date.now().toString().slice(-5)}`,
        ticketId: `DINE-RES-${Date.now().toString().slice(-5)}`,
        eventId: this.activeDiningVenue?.id || 'dine-spot',
        eventTitle: `${this.activeDiningVenue?.name || 'Dining Spot'} (Table Reservation)`,
        city: this.activeDiningVenue?.city || 'Bengaluru',
        venue: `${this.activeDiningVenue?.neighborhood || 'City Hub'} • Slot: ${slot}`,
        date: date || 'Today',
        time: slot,
        tier: `${partySize} Guests VIP Table`,
        pricePaid: 'Complimentary (Istaroth 15% Member Perk)',
        currency: '₹',
        attendeeName: guestName,
        attendeeEmail: guestPhone,
        quantity: partySize,
        buyerName: guestName,
        buyerEmail: guestPhone,
        image: this.activeDiningVenue?.image,
        qrCode: `ISTAROTH-DINE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: 'Confirmed'
      };

      this.myTickets.unshift(pass);
      this.saveTickets();
      if (modal) modal.style.display = 'none';
      document.body.style.overflow = '';
      form.reset();

      this.showToast(`🎉 Table Reserved at ${this.activeDiningVenue?.name}! Added to your Passes.`);
      this.switchDistrictTab('ticketsView');
    });
  }

  openDiningModal(venue) {
    this.activeDiningVenue = venue;
    const modal = document.getElementById('diningReserveModal');
    if (!modal) return;

    document.getElementById('diningModalImg').src = venue.image;
    document.getElementById('diningModalName').textContent = venue.name;
    document.getElementById('diningModalLocation').textContent = `${venue.neighborhood}, ${venue.city}`;
    document.getElementById('diningModalPerk').textContent = venue.perk;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('diningDate').value = today;

    const slotContainer = document.getElementById('diningSlotSelector');
    this.selectedDiningSlot = venue.slots[0];
    slotContainer.innerHTML = venue.slots.map((s, idx) => `
      <button type="button" class="district-slot-btn ${idx === 0 ? 'active' : ''}" data-slot="${s}">${s}</button>
    `).join('');

    slotContainer.querySelectorAll('.district-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        slotContainer.querySelectorAll('.district-slot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDiningSlot = btn.dataset.slot;
      });
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  openMovieBooking(movie, cinema) {
    const movieEventObj = {
      id: `mov-${movie.id}`,
      title: `${movie.title} (${cinema.format})`,
      city: movie.city || 'Bengaluru',
      state: 'Cinema Hall',
      venue: cinema.name,
      date: 'TODAY / UPCOMING',
      time: cinema.showtimes.join(', '),
      price: cinema.price,
      vipPrice: cinema.price + 200,
      currency: 'INR',
      symbol: '₹',
      image: movie.banner,
      organizer: 'Istaroth Screenings Network',
      badge: cinema.format
    };
    this.openCheckoutModal(movieEventObj);
  }

  openComedyBooking(gig) {
    const comedyEventObj = {
      id: `cmd-${gig.id}`,
      title: `${gig.title} - ${gig.artist}`,
      city: gig.city,
      state: 'Live Gig',
      venue: gig.venue,
      date: gig.date,
      time: gig.time,
      price: gig.price,
      vipPrice: gig.vipPrice,
      currency: gig.currency === '₹' ? 'INR' : 'USD',
      symbol: gig.currency,
      image: gig.image,
      organizer: gig.artist,
      badge: gig.badge
    };
    this.openCheckoutModal(comedyEventObj);
  }

  // --------------------------------------------------------------------------
  // MASTER SEARCH (Across all events, movies, and dining)
  // --------------------------------------------------------------------------
  initMasterSearch() {
    const masterInput = document.getElementById('districtMasterSearchInput');
    const clearBtn = document.getElementById('btnClearMasterSearch');

    masterInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      this.searchQuery = q;
      if (clearBtn) clearBtn.style.display = q.length > 0 ? 'flex' : 'none';

      if (this.activeDistrictTab === 'forYouView') {
        this.renderForYouView();
      } else if (this.activeDistrictTab === 'eventsView') {
        this.renderEvents();
      } else if (this.activeDistrictTab === 'diningView') {
        this.diningFilter = q || 'all';
        this.renderDiningView();
      } else if (this.activeDistrictTab === 'moviesView') {
        this.renderMoviesView();
      } else if (this.activeDistrictTab === 'comedyView') {
        this.renderComedyView();
      }
    });

    clearBtn?.addEventListener('click', () => {
      if (masterInput) {
        masterInput.value = '';
        masterInput.focus();
      }
      if (clearBtn) clearBtn.style.display = 'none';
      this.searchQuery = '';
      this.diningFilter = 'all';
      this.movieFilter = 'all';
      this.comedyFilter = 'all';
      if (this.activeDistrictTab === 'forYouView') this.renderForYouView();
      else if (this.activeDistrictTab === 'eventsView') this.renderEvents();
      else if (this.activeDistrictTab === 'diningView') this.renderDiningView();
      else if (this.activeDistrictTab === 'moviesView') this.renderMoviesView();
      else if (this.activeDistrictTab === 'comedyView') this.renderComedyView();
    });
  }

  // --------------------------------------------------------------------------
  // BOOKMYSHOW CITY SELECTION MODAL & LOCATION ENGINE
  // --------------------------------------------------------------------------
  initBookMyShowLocationModal() {
    const modal = document.getElementById('bmsCityModal');
    const navBtn = document.getElementById('bmsNavCityBtn');
    const changeBtn = document.getElementById('btnChangeCityModal');
    const heroBtn = document.getElementById('heroOpenCityModalBtn');
    const closeBtn = document.getElementById('btnCloseBmsModal');
    const searchInput = document.getElementById('bmsCitySearchInput');
    const clearBtn = document.getElementById('btnClearBmsSearch');
    const modalDetectBtn = document.getElementById('bmsModalDetectBtn');
    const heroDetectBtn = document.getElementById('heroDetectBtn');
    const barDetectBtn = document.getElementById('btnAutoDetect');
    const allIndiaBtn = document.getElementById('bmsAllIndiaBtn');
    const allWorldBtn = document.getElementById('bmsAllWorldBtn');

    // Open Modal Handlers
    const openModal = () => {
      if (!modal) return;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      if (clearBtn) clearBtn.style.display = 'none';
      this.renderBmsPopularGrid('');
      this.renderBmsOtherCitiesList('');
      if (window.lucide) window.lucide.createIcons();
    };

    // Close Modal Handlers
    this.closeBmsModal = () => {
      if (!modal) return;
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };

    navBtn?.addEventListener('click', openModal);
    changeBtn?.addEventListener('click', openModal);
    heroBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', () => this.closeBmsModal());

    // Backdrop Click to Close
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeBmsModal();
      }
    });

    // Escape Key to Close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        this.closeBmsModal();
      }
    });

    // Modal Search Input
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = q.length > 0 ? 'flex' : 'none';
      this.renderBmsPopularGrid(q);
      this.renderBmsOtherCitiesList(q);
      if (window.lucide) window.lucide.createIcons();
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      if (clearBtn) clearBtn.style.display = 'none';
      this.renderBmsPopularGrid('');
      this.renderBmsOtherCitiesList('');
      if (window.lucide) window.lucide.createIcons();
    });

    // Auto-detect triggers
    const triggerDetect = () => {
      this.detectCurrentLocation(() => {
        this.closeBmsModal();
      });
    };

    modalDetectBtn?.addEventListener('click', triggerDetect);
    heroDetectBtn?.addEventListener('click', triggerDetect);
    barDetectBtn?.addEventListener('click', triggerDetect);

    // Modal Footer Quick Buttons
    allIndiaBtn?.addEventListener('click', () => {
      this.setRegion('india');
      this.closeBmsModal();
    });

    allWorldBtn?.addEventListener('click', () => {
      this.setRegion('all');
      this.closeBmsModal();
    });

    // Initial render of BookMyShow Quick Strip on Discovery Bar
    this.renderBmsQuickStrip();
  }

  renderBmsPopularGrid(query = '') {
    const grid = document.getElementById('bmsPopularGrid');
    const section = document.getElementById('bmsPopularSection');
    if (!grid) return;

    const q = (query || '').toLowerCase().trim();
    const popularCities = INDIA_CITIES.filter(c => c.isPopular);

    const filtered = popularCities.filter(c => 
      !q || 
      c.name.toLowerCase().includes(q) || 
      c.state.toLowerCase().includes(q) || 
      (c.landmark && c.landmark.toLowerCase().includes(q)) ||
      (c.tag && c.tag.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      if (section) section.style.display = q.length > 0 ? 'none' : 'block';
      grid.innerHTML = '';
      return;
    }

    if (section) section.style.display = 'block';

    grid.innerHTML = filtered.map(city => {
      const isActive = city.id === this.currentRegion;
      const icon = city.landmarkIcon || 'landmark';
      return `
        <div class="bms-popular-item ${isActive ? 'active' : ''}" data-city-id="${city.id}" title="${city.name} - ${city.landmark || city.state}">
          <div class="bms-circle-wrap">
            <div class="bms-landmark-circle">
              <i data-lucide="${icon}" style="width:24px;height:24px;"></i>
            </div>
            ${isActive ? '<span class="bms-check-badge"><i data-lucide="check" style="width:11px;height:11px;"></i></span>' : ''}
          </div>
          <span class="bms-popular-name">${city.name}</span>
          <span class="bms-popular-landmark">${city.landmark || city.state}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.bms-popular-item').forEach(item => {
      item.addEventListener('click', () => {
        const cityId = item.dataset.cityId;
        this.setRegion(cityId);
        this.closeBmsModal();
      });
    });
  }

  renderBmsOtherCitiesList(query = '') {
    const list = document.getElementById('bmsOtherCitiesList');
    const title = document.getElementById('bmsOtherSectionTitle');
    if (!list) return;

    const q = (query || '').toLowerCase().trim();

    // Indian cities + Global Tech Hubs
    const allHubs = [
      ...INDIA_CITIES.map(c => ({
        id: c.id,
        name: c.name,
        sub: c.state,
        flag: c.flag || '🇮🇳',
        isPopular: !!c.isPopular,
        tag: c.tag || ''
      })),
      ...WORLD_REGIONS.filter(w => w.id !== 'all' && w.id !== 'india').map(w => ({
        id: w.id,
        name: w.name.split('&')[0].trim(),
        sub: 'Global Tech Hub',
        flag: w.flag,
        isPopular: false,
        tag: 'International'
      }))
    ];

    let filtered = allHubs;
    if (q) {
      filtered = allHubs.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.sub.toLowerCase().includes(q) ||
        h.tag.toLowerCase().includes(q)
      );
    } else {
      filtered = allHubs.filter(h => !h.isPopular || ['sf', 'nyc', 'london', 'berlin', 'tokyo', 'dubai', 'singapore'].includes(h.id));
    }

    if (title) {
      title.textContent = q ? `MATCHING CITIES & HUBS (${filtered.length})` : 'OTHER CITIES & GLOBAL HUBS';
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-400); font-size: 13.5px;">
          No cities found matching "<strong>${this.escapeHtml(query)}</strong>".<br>
          <span style="font-size: 12px; margin-top: 4px; display: inline-block;">
            Try searching for "Bengaluru", "Mumbai", "San Francisco" or use auto-detect.
          </span>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(hub => {
      const isActive = hub.id === this.currentRegion;
      const count = this.events.filter(e => e.region === hub.id).length;
      return `
        <div class="bms-other-city-item ${isActive ? 'active' : ''}" data-city-id="${hub.id}">
          <div class="bms-other-city-left">
            <span class="bms-other-flag">${hub.flag}</span>
            <div>
              <div class="bms-other-name">${hub.name}</div>
              <div class="bms-other-sub">${hub.sub}</div>
            </div>
          </div>
          <span class="bms-other-count">${count} events</span>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.bms-other-city-item').forEach(item => {
      item.addEventListener('click', () => {
        const cityId = item.dataset.cityId;
        this.setRegion(cityId);
        this.closeBmsModal();
      });
    });
  }

  renderBmsQuickStrip() {
    const container = document.getElementById('bmsQuickStripList');
    if (!container) return;

    const quickPills = [
      { id: 'all', name: 'All World', flag: '🌐' },
      { id: 'india', name: 'All India', flag: '🇮🇳' },
      { id: 'bengaluru', name: 'Bengaluru', flag: '🇮🇳' },
      { id: 'hyderabad', name: 'Hyderabad', flag: '🇮🇳' },
      { id: 'mumbai', name: 'Mumbai', flag: '🇮🇳' },
      { id: 'delhi', name: 'Delhi NCR', flag: '🇮🇳' },
      { id: 'pune', name: 'Pune', flag: '🇮🇳' },
      { id: 'chennai', name: 'Chennai', flag: '🇮🇳' },
      { id: 'sf', name: 'San Francisco', flag: '🇺🇸' },
      { id: 'london', name: 'London', flag: '🇬🇧' }
    ];

    container.innerHTML = quickPills.map(p => {
      const isActive = p.id === this.currentRegion;
      const count = p.id === 'all' ? this.events.length :
                    p.id === 'india' ? this.events.filter(e => e.country === 'india').length :
                    this.events.filter(e => e.region === p.id).length;
      return `
        <button class="bms-strip-pill ${isActive ? 'active' : ''}" data-region-id="${p.id}">
          <span>${p.flag}</span>
          <span>${p.name}</span>
          <span class="bms-strip-count">${count}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.bms-strip-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.regionId;
        this.setRegion(id);
      });
    });
  }

  renderRegionSelectors() {
    this.renderBmsQuickStrip();
  }

  detectCurrentLocation(onSuccess) {
    const btn = document.getElementById('btnAutoDetect');
    const icon = document.getElementById('gpsCrosshairIcon');
    const label = document.getElementById('gpsButtonLabel');
    const heroBtn = document.getElementById('heroDetectBtn');
    const modalGpsIcon = document.getElementById('bmsModalGpsIcon');
    const modalDetectTitle = document.getElementById('bmsModalDetectTitle');

    if (btn) btn.disabled = true;
    if (label) label.textContent = 'Acquiring GPS...';
    if (icon) icon.classList.add('spin');
    if (modalGpsIcon) modalGpsIcon.classList.add('spin');
    if (modalDetectTitle) modalDetectTitle.textContent = 'Detecting nearest city via GPS...';

    if (heroBtn) {
      heroBtn.disabled = true;
      heroBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:15px;height:15px;"></i> Acquiring GPS...`;
      if (window.lucide) window.lucide.createIcons();
    }

    const resetButtons = () => {
      if (btn) btn.disabled = false;
      if (label) label.textContent = 'Detect My Location';
      if (icon) icon.classList.remove('spin');
      if (modalGpsIcon) modalGpsIcon.classList.remove('spin');
      if (modalDetectTitle) modalDetectTitle.textContent = 'Auto Detect My Location';
      if (heroBtn) {
        heroBtn.disabled = false;
        heroBtn.innerHTML = `<i data-lucide="crosshair" style="width:15px;height:15px;color:var(--primary);"></i> <span>Auto-Detect My Location</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          const allLocs = [
            ...INDIA_CITIES.map(c => ({ ...c, isIndia: true })),
            ...WORLD_REGIONS.filter(w => w.lat && w.lng).map(w => ({ ...w, isIndia: false }))
          ];

          let closest = null;
          let minDistance = Infinity;

          allLocs.forEach(loc => {
            const dist = this.haversineDistance(userLat, userLng, loc.lat, loc.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = loc;
            }
          });

          resetButtons();

          if (closest) {
            this.setRegion(closest.id);
            const distStr = minDistance < 1 ? 'Under 1 km away' : `${Math.round(minDistance)} km away`;
            this.showToast(`🎯 Current Location Detected: ${closest.name} (${distStr})`);
            if (onSuccess) onSuccess();
          } else {
            this.fallbackLocationDetection(resetButtons, onSuccess);
          }
        },
        (error) => {
          console.warn('Geolocation failed or permission denied:', error.message);
          this.fallbackLocationDetection(resetButtons, onSuccess);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      this.fallbackLocationDetection(resetButtons, onSuccess);
    }
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  fallbackLocationDetection(onComplete, onSuccess) {
    setTimeout(() => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      let detected = 'hyderabad';
      let reason = 'Network Timezone';

      if (timeZone.includes('Asia/Kolkata') || timeZone.includes('Calcutta')) {
        detected = 'hyderabad';
        reason = 'India Standard Network (Asia/Kolkata)';
      } else if (timeZone.includes('Europe/London')) {
        detected = 'london';
      } else if (timeZone.includes('Europe/Berlin') || timeZone.includes('Europe/Paris')) {
        detected = 'berlin';
      } else if (timeZone.includes('Asia/Tokyo')) {
        detected = 'tokyo';
      } else if (timeZone.includes('Asia/Dubai')) {
        detected = 'dubai';
      } else if (timeZone.includes('America/New_York')) {
        detected = 'nyc';
      } else if (timeZone.includes('America/Los_Angeles')) {
        detected = 'sf';
      }

      this.setRegion(detected);
      if (onComplete) onComplete();
      this.showToast(`📍 Location set via ${reason}: ${this.getRegionLabel(detected)}`);
      if (onSuccess) onSuccess();
    }, 400);
  }

  renderCategoryPills() {
    const container = document.getElementById('categoryPillsContainer');
    container.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-btn ${cat.id === this.currentCategory ? 'active' : ''}`;
      btn.dataset.catId = cat.id;
      btn.innerHTML = `<i data-lucide="${cat.icon}" style="width:14px;height:14px;"></i> <span>${cat.name}</span>`;
      btn.addEventListener('click', () => {
        this.setCategory(cat.id);
      });
      container.appendChild(btn);
    });

    document.querySelectorAll('[data-cat-pill]').forEach(pill => {
      pill.addEventListener('click', () => {
        const catId = pill.dataset.catPill;
        this.setCategory(catId);
        document.getElementById('discoverySection')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  setCategory(catId) {
    this.currentCategory = catId;
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.catId === catId);
    });
    document.querySelectorAll('[data-cat-pill]').forEach(p => {
      p.classList.toggle('active', p.dataset.catPill === catId);
    });
    this.renderEvents();
  }

  setRegion(regionId) {
    this.currentRegion = regionId;
    localStorage.setItem('istaroth_region', regionId);

    const navSelect = document.getElementById('navRegionSelect');
    if (navSelect) navSelect.value = regionId;

    document.querySelectorAll('.region-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.regionId === regionId);
    });

    document.querySelectorAll('.loc-chip-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hubId === regionId);
    });

    this.updateRegionDisplay();
    this.renderEvents();
    this.renderForYouView();
    this.renderDiningView();
    this.renderMoviesView();
    this.renderComedyView();
    this.showToast(`Region filtered to: ${this.getRegionLabel(regionId)}`);
  }

  getRegionLabel(id) {
    if (id === 'all') return 'All World & India';
    if (id === 'india') return 'All India (National Feed)';
    const city = INDIA_CITIES.find(c => c.id === id);
    if (city) return `${city.name}, India`;
    const world = WORLD_REGIONS.find(w => w.id === id);
    if (world) return world.name;
    return id;
  }

  updateRegionDisplay() {
    const navFlag = document.getElementById('navRegionFlag');
    const headerTitle = document.getElementById('currentRegionHeader');
    const activePillText = document.getElementById('activeLocationPillText');
    const labFlag = document.getElementById('labFlag');
    const labName = document.getElementById('labName');
    const labMeta = document.getElementById('labMeta');

    // BookMyShow Elements
    const bmsNavName = document.getElementById('bmsNavCityName');
    const bmsDisplay = document.getElementById('bmsCurrentCityDisplay');
    const heroBtnText = document.getElementById('heroCityBtnText');

    // Update Quick Strip Active States
    document.querySelectorAll('.bms-strip-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.regionId === this.currentRegion);
    });

    // Update Modal Items Active States (if rendered)
    document.querySelectorAll('.bms-popular-item').forEach(item => {
      item.classList.toggle('active', item.dataset.cityId === this.currentRegion);
    });
    document.querySelectorAll('.bms-other-city-item').forEach(item => {
      item.classList.toggle('active', item.dataset.cityId === this.currentRegion);
    });

    if (this.currentRegion === 'all') {
      if (bmsNavName) bmsNavName.textContent = 'All World';
      if (bmsDisplay) bmsDisplay.textContent = 'All World & India Hubs';
      if (heroBtnText) heroBtnText.textContent = 'All World ▾';
      if (navFlag) navFlag.textContent = '🌐';
      if (headerTitle) headerTitle.textContent = 'All India & World';
      if (activePillText) activePillText.textContent = 'All World & India Hubs';
      if (labFlag) labFlag.textContent = '🌐';
      if (labName) labName.textContent = 'All World & India Pipeline';
      if (labMeta) labMeta.textContent = `${this.events.length} Live Summits, Hackathons & Tech Events Indexed Globally`;
    } else if (this.currentRegion === 'india') {
      const indiaEvents = this.events.filter(e => e.country === 'india');
      if (bmsNavName) bmsNavName.textContent = 'All India';
      if (bmsDisplay) bmsDisplay.textContent = 'All India (National Feed)';
      if (heroBtnText) heroBtnText.textContent = 'All India ▾';
      if (navFlag) navFlag.textContent = '🇮🇳';
      if (headerTitle) headerTitle.textContent = 'All India (National Feed)';
      if (activePillText) activePillText.textContent = 'All India Tech Ecosystem';
      if (labFlag) labFlag.textContent = '🇮🇳';
      if (labName) labName.textContent = 'All India National Pipeline';
      if (labMeta) labMeta.textContent = `${indiaEvents.length} Events Across 10 Major Indian Tech Hubs`;
    } else {
      const city = INDIA_CITIES.find(c => c.id === this.currentRegion);
      if (city) {
        const cityEvents = this.events.filter(e => e.region === city.id);
        if (bmsNavName) bmsNavName.textContent = city.name;
        if (bmsDisplay) bmsDisplay.textContent = `${city.name}, ${city.state}`;
        if (heroBtnText) heroBtnText.textContent = `${city.name} ▾`;
        if (navFlag) navFlag.textContent = '🇮🇳';
        if (headerTitle) headerTitle.textContent = `${city.name}, ${city.state}`;
        if (activePillText) activePillText.textContent = `${city.name}, ${city.state}`;
        if (labFlag) labFlag.textContent = '🇮🇳';
        if (labName) labName.textContent = `${city.name}, ${city.state}`;
        if (labMeta) labMeta.textContent = `${city.tag} • ${cityEvents.length} Live Summits & Hacks`;
      } else {
        const world = WORLD_REGIONS.find(w => w.id === this.currentRegion);
        const worldEvents = this.events.filter(e => e.region === this.currentRegion);
        const shortName = world ? world.name.split('&')[0].trim() : this.currentRegion;
        if (bmsNavName) bmsNavName.textContent = shortName;
        if (bmsDisplay) bmsDisplay.textContent = world?.name || this.currentRegion;
        if (heroBtnText) heroBtnText.textContent = `${shortName} ▾`;
        if (navFlag) navFlag.textContent = world?.flag || '🌐';
        if (headerTitle) headerTitle.textContent = world?.name || this.currentRegion;
        if (activePillText) activePillText.textContent = world?.name || this.currentRegion;
        if (labFlag) labFlag.textContent = world?.flag || '🌐';
        if (labName) labName.textContent = world?.name || this.currentRegion;
        if (labMeta) labMeta.textContent = `Global Tech Hub • ${worldEvents.length} Live Events Indexed`;
      }
    }

    const currentCityName = this.getRegionLabel(this.currentRegion).split(',')[0].trim();
    const diningHeader = document.getElementById('diningCityHeader');
    if (diningHeader) diningHeader.textContent = currentCityName;
    const moviesHeader = document.getElementById('moviesCityHeader');
    if (moviesHeader) moviesHeader.textContent = currentCityName;
    const comedyHeader = document.getElementById('comedyCityHeader');
    if (comedyHeader) comedyHeader.textContent = currentCityName;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  autoDetectUserRegion() {
    this.detectCurrentLocation();
  }

  // --------------------------------------------------------------------------
  // SEARCH & FILTERING
  // --------------------------------------------------------------------------
  bindSearchAndSort() {
    const searchInput = document.getElementById('eventSearchInput');
    const sortSelect = document.getElementById('sortSelect');

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderEvents();
    });

    sortSelect?.addEventListener('change', (e) => {
      this.sortMethod = e.target.value;
      this.renderEvents();
    });
  }

  getFilteredEvents() {
    return this.events.filter(evt => {
      // Region filter
      if (this.currentRegion === 'all') {
        // show all
      } else if (this.currentRegion === 'india') {
        if (evt.country !== 'india') return false;
      } else {
        if (evt.region !== this.currentRegion) return false;
      }

      // Category filter
      if (this.currentCategory !== 'all' && evt.category !== this.currentCategory) {
        return false;
      }

      // Search query
      if (this.searchQuery) {
        const haystack = `${evt.title} ${evt.city} ${evt.state || ''} ${evt.venue} ${evt.organizer} ${(evt.tags || []).join(' ')} ${evt.description}`.toLowerCase();
        if (!haystack.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (this.sortMethod === 'price-asc') return a.price - b.price;
      if (this.sortMethod === 'price-desc') return b.price - a.price;
      if (this.sortMethod === 'popular') return (b.ticketsSold / b.totalCapacity) - (a.ticketsSold / a.totalCapacity);
      return 0;
    });
  }

  renderEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    const filtered = this.getFilteredEvents();
    const countBadge = document.getElementById('resultsCount');
    if (countBadge) countBadge.textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'} available`;

    const countSub = document.getElementById('eventsCountSub');
    if (countSub) {
      countSub.textContent = `Showing ${filtered.length} live summits, hackathons and mixers`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:50px 20px; background:#ffffff; border-radius:14px; border:1px dashed var(--border);">
          <i data-lucide="compass" style="width:38px;height:38px;color:var(--text-400);margin-bottom:10px;"></i>
          <h3 style="color:var(--text-100); font-size:17px; margin-bottom:6px;">No events found in this city or category</h3>
          <p style="color:var(--text-400); font-size:13.5px; max-width:400px; margin:0 auto 16px;">
            Try switching to another city or resetting your filters to explore events across India &amp; global hubs.
          </p>
          <button class="btn btn-p" id="btnResetFilters" style="padding:7px 18px; font-size:13px;">View All India &amp; World Events</button>
        </div>
      `;
      document.getElementById('btnResetFilters')?.addEventListener('click', () => {
        this.setRegion('all');
        this.setCategory('all');
        this.searchQuery = '';
        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput) searchInput.value = '';
        this.renderEvents();
      });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = filtered.map(evt => `
      <div class="district-card" data-event-id="${evt.id}">
        <div class="district-card-media">
          <img src="${evt.image}" alt="${evt.title}" loading="lazy">
          <span class="district-card-overlay-badge">${evt.badge || 'Featured'}</span>
          <span class="district-card-overlay-city">${evt.city}</span>
        </div>
        <div class="district-card-body">
          <span class="district-card-category">${evt.category.toUpperCase()}</span>
          <h3 class="district-card-title">${evt.title}</h3>
          <div class="district-card-meta">
            <div class="district-card-meta-row">
              <i data-lucide="calendar" style="width:13px;height:13px;color:#4F46E5;"></i>
              <span>${evt.date} • ${evt.time.split('-')[0].trim()}</span>
            </div>
            <div class="district-card-meta-row">
              <i data-lucide="map-pin" style="width:13px;height:13px;color:#4F46E5;"></i>
              <span>${evt.venue}</span>
            </div>
          </div>
          <div class="district-card-footer">
            <div class="district-card-price">
              <span class="district-card-price-label">Price From</span>
              <span class="district-card-price-value">${evt.symbol}${evt.price.toLocaleString()}</span>
            </div>
            <button class="district-card-btn" data-book-evt="${evt.id}">Reserve Pass</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-book-evt]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.bookEvt;
        this.openCheckoutModal(eventId);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // CHECKOUT & COMMISSION PROTOCOL
  // --------------------------------------------------------------------------
  bindCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const tierGeneral = document.getElementById('tierGeneralCard');
    const tierVip = document.getElementById('tierVipCard');
    const btnPlus = document.getElementById('btnQtyPlus');
    const btnMinus = document.getElementById('btnQtyMinus');
    const checkoutForm = document.getElementById('checkoutForm');

    closeBtn?.addEventListener('click', () => this.closeCheckoutModal());
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeCheckoutModal();
    });

    tierGeneral?.addEventListener('click', () => {
      this.selectedTier = 'general';
      tierGeneral.classList.add('selected');
      tierVip.classList.remove('selected');
      this.recalculateCheckout();
    });

    tierVip?.addEventListener('click', () => {
      this.selectedTier = 'vip';
      tierVip.classList.add('selected');
      tierGeneral.classList.remove('selected');
      this.recalculateCheckout();
    });

    btnPlus?.addEventListener('click', () => {
      this.ticketQuantity = Math.min(10, this.ticketQuantity + 1);
      document.getElementById('ticketQtyText').textContent = this.ticketQuantity;
      this.recalculateCheckout();
    });

    btnMinus?.addEventListener('click', () => {
      this.ticketQuantity = Math.max(1, this.ticketQuantity - 1);
      document.getElementById('ticketQtyText').textContent = this.ticketQuantity;
      this.recalculateCheckout();
    });

    checkoutForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processBooking();
    });
  }

  openCheckoutModal(target) {
    const event = (typeof target === 'object' && target !== null)
      ? target
      : this.events.find(e => e.id === target);
    if (!event) return;

    this.activeEvent = event;
    this.selectedTier = 'general';
    this.ticketQuantity = 1;

    document.getElementById('ticketQtyText').textContent = '1';
    document.getElementById('tierGeneralCard').classList.add('selected');
    document.getElementById('tierVipCard').classList.remove('selected');

    document.getElementById('modalEventImg').src = event.image;
    document.getElementById('modalEventTitle').textContent = event.title;
    document.getElementById('modalEventLocation').textContent = `${event.venue}, ${event.city}`;
    document.getElementById('modalEventDate').textContent = `${event.date} • ${event.time}`;

    document.getElementById('modalGeneralPrice').textContent = `${event.symbol}${event.price.toLocaleString()}`;
    document.getElementById('modalVipPrice').textContent = `${event.symbol}${(event.vipPrice || event.price * 2).toLocaleString()}`;
    document.getElementById('modalPlatformRate').textContent = this.platformTakeRate.toFixed(1);
    document.getElementById('modalFeePct').textContent = `${this.platformTakeRate.toFixed(1)}%`;

    this.recalculateCheckout();

    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  recalculateCheckout() {
    if (!this.activeEvent) return;

    const unitPrice = this.selectedTier === 'vip' 
      ? (this.activeEvent.vipPrice || this.activeEvent.price * 2) 
      : this.activeEvent.price;

    const subtotal = unitPrice * this.ticketQuantity;
    const platformCut = subtotal * (this.platformTakeRate / 100);
    const organizerNet = subtotal - platformCut;
    const totalAmount = subtotal;

    const sym = this.activeEvent.symbol || '₹';
    document.getElementById('modalSubtotal').textContent = `${sym}${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('modalPlatformFee').textContent = `${sym}${platformCut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('modalOrganizerNet').textContent = `${sym}${organizerNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('modalTotal').textContent = `${sym}${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  processBooking() {
    const nameInput = document.getElementById('attendeeName');
    const emailInput = document.getElementById('attendeeEmail');
    const attendeeName = nameInput.value.trim();
    const attendeeEmail = emailInput.value.trim();

    if (!attendeeName || !emailInput) return;

    const unitPrice = this.selectedTier === 'vip' 
      ? (this.activeEvent.vipPrice || this.activeEvent.price * 2) 
      : this.activeEvent.price;
    const subtotal = unitPrice * this.ticketQuantity;
    const platformCut = subtotal * (this.platformTakeRate / 100);
    const organizerNet = subtotal - platformCut;

    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const ticketId = `IST-${Math.floor(100000 + Math.random() * 900000)}`;

    const txnRecord = {
      id: txnId,
      eventTitle: this.activeEvent.title,
      buyerName: attendeeName,
      buyerEmail: attendeeEmail,
      tier: this.selectedTier === 'vip' ? 'VIP All-Access' : 'General Admission',
      quantity: this.ticketQuantity,
      subtotal: subtotal,
      platformRate: this.platformTakeRate / 100,
      platformFeeCut: platformCut,
      organizerPayout: organizerNet,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      region: this.activeEvent.region || 'india',
      currency: this.activeEvent.symbol || '₹'
    };

    this.ledger.unshift(txnRecord);
    this.saveLedger();

    if (typeof this.activeEvent.ticketsSold === 'number') {
      this.activeEvent.ticketsSold += this.ticketQuantity;
      this.saveEvents();
    }

    const passRecord = {
      ticketId: ticketId,
      txnId: txnId,
      eventId: this.activeEvent.id,
      eventTitle: this.activeEvent.title,
      venue: this.activeEvent.venue,
      city: this.activeEvent.city,
      date: this.activeEvent.date,
      time: this.activeEvent.time,
      tier: this.selectedTier === 'vip' ? 'VIP All-Access Pass' : 'General Admission',
      attendeeName: attendeeName,
      attendeeEmail: attendeeEmail,
      quantity: this.ticketQuantity,
      pricePaid: `${this.activeEvent.symbol}${subtotal.toLocaleString('en-IN')}`,
      platformFeeCaptured: `${this.activeEvent.symbol}${platformCut.toLocaleString('en-IN')}`,
      createdAt: new Date().toLocaleDateString()
    };

    this.myTickets.unshift(passRecord);
    this.saveTickets();

    this.closeCheckoutModal();
    this.renderEvents();
    this.updateTreasuryView();

    nameInput.value = '';
    emailInput.value = '';

    if (this.switchDistrictTab) {
      this.switchDistrictTab('ticketsView');
    } else {
      document.querySelector('.nav-tab[data-tab="ticketsView"]')?.click();
    }
    this.showToast(`🎉 Reservation confirmed! Captured ${this.activeEvent.symbol}${platformCut.toFixed(2)} Platform Cut into Treasury.`);
  }

  // --------------------------------------------------------------------------
  // DIGITAL TICKET PASS
  // --------------------------------------------------------------------------
  renderMyTickets() {
    const container = document.getElementById('ticketsContainer');
    this.updateTicketBadge();

    if (this.myTickets.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; background:#ffffff; border-radius:var(--r-xl); border:1px dashed var(--border);">
          <i data-lucide="ticket" style="width:44px;height:44px;color:var(--text-400);margin-bottom:12px;"></i>
          <h3 style="color:var(--text-100); font-size:18px; margin-bottom:8px;">No confirmed passes yet</h3>
          <p style="color:var(--text-400); font-size:14px; max-width:400px; margin:0 auto 20px;">
            Reserve tickets to upcoming tech summits or hackathons in your region to generate verified passes.
          </p>
          <button class="btn btn-p" id="btnExploreFromTickets">Explore Events</button>
        </div>
      `;
      document.getElementById('btnExploreFromTickets')?.addEventListener('click', () => {
        document.querySelector('.nav-tab[data-tab="exploreView"]')?.click();
      });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = this.myTickets.map(ticket => `
      <div class="ticket-pass-wrap">
        <div class="ticket-pass-header">
          <div class="tph-brand">Istaroth Events Pass</div>
          <div class="tph-tier">${ticket.tier}</div>
        </div>

        <div class="ticket-pass-body">
          <h3 class="tpb-title">${ticket.eventTitle}</h3>
          
          <div class="tpb-grid">
            <div class="tpb-field">
              <div class="label">Date &amp; Time</div>
              <div class="val">${ticket.date}</div>
            </div>
            <div class="tpb-field">
              <div class="label">Venue / City</div>
              <div class="val">${ticket.venue}, ${ticket.city}</div>
            </div>
            <div class="tpb-field">
              <div class="label">Attendee Name</div>
              <div class="val">${ticket.attendeeName}</div>
            </div>
            <div class="tpb-field">
              <div class="label">Passes Issued</div>
              <div class="val">${ticket.quantity} Ticket(s)</div>
            </div>
          </div>
        </div>

        <div class="ticket-notch-row">
          <div class="notch-left"></div>
          <div class="dashed-line"></div>
          <div class="notch-right"></div>
        </div>

        <div class="ticket-pass-footer">
          <div class="qr-code-box" title="Scan to verify attendee at door">
            <svg viewBox="0 0 100 100" fill="#111827">
              <rect x="0" y="0" width="30" height="30" fill="#111827"/>
              <rect x="5" y="5" width="20" height="20" fill="#fff"/>
              <rect x="9" y="9" width="12" height="12" fill="#111827"/>
              <rect x="70" y="0" width="30" height="30" fill="#111827"/>
              <rect x="75" y="5" width="20" height="20" fill="#fff"/>
              <rect x="79" y="9" width="12" height="12" fill="#111827"/>
              <rect x="0" y="70" width="30" height="30" fill="#111827"/>
              <rect x="5" y="75" width="20" height="20" fill="#fff"/>
              <rect x="9" y="79" width="12" height="12" fill="#111827"/>
              <rect x="36" y="10" width="6" height="6"/>
              <rect x="48" y="10" width="8" height="6"/>
              <rect x="36" y="24" width="12" height="8"/>
              <rect x="10" y="38" width="8" height="8"/>
              <rect x="24" y="38" width="6" height="14"/>
              <rect x="40" y="40" width="20" height="20"/>
              <rect x="46" y="46" width="8" height="8" fill="#fff"/>
              <rect x="70" y="38" width="16" height="6"/>
              <rect x="80" y="48" width="8" height="14"/>
              <rect x="38" y="70" width="10" height="18"/>
              <rect x="54" y="76" width="14" height="8"/>
              <rect x="74" y="70" width="18" height="18"/>
            </svg>
          </div>
          <div class="ticket-meta-block">
            <div class="ticket-id">${ticket.ticketId}</div>
            <div style="font-size:12px; color:var(--text-400);">Txn: ${ticket.txnId}</div>
            <div style="font-size:12px; color:var(--emerald); font-weight:700; margin-top:2px;">
              ✓ Verified &amp; Escrow Settled
            </div>
            <div style="font-size:11.5px; color:var(--text-400); margin-top:1px;">
              Protocol Fee Cut: ${ticket.platformFeeCaptured}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  updateTicketBadge() {
    const badge = document.getElementById('passCountBadge');
    if (badge) {
      badge.textContent = this.myTickets.length;
    }
  }

  // --------------------------------------------------------------------------
  // TREASURY & MONETIZATION DASHBOARD
  // --------------------------------------------------------------------------
  bindTreasuryControls() {
    const slider = document.getElementById('rateSlider') || document.getElementById('commissionSlider');
    const badge = document.getElementById('currentRateBadge') || document.getElementById('commissionRateLabel');

    if (slider) {
      slider.value = this.platformTakeRate;
      if (badge) badge.textContent = `${this.platformTakeRate.toFixed(1)}% Take-Rate`;

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.platformTakeRate = val;
        localStorage.setItem('istaroth_take_rate', val.toString());
        if (badge) badge.textContent = `${val.toFixed(1)}% Take-Rate`;
        this.updateTreasuryView();
      });
    }

    const saveBtn = document.getElementById('btnSaveCommissionRate');
    saveBtn?.addEventListener('click', () => {
      this.showToast(`✨ Platform take-rate updated to ${this.platformTakeRate.toFixed(1)}%!`);
    });
  }

  updateProjectedMonthlyRevenue(rate) {
    const projectedGMV = 500000;
    const cut = projectedGMV * (rate / 100);
    const element = document.getElementById('simulatedMonthlyCut');
    if (element) {
      element.textContent = `$${cut.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`;
    }
  }

  updateTreasuryView() {
    let totalGMV = 0;
    let totalPlatformCut = 0;
    let totalOrganizerPayout = 0;
    let totalTickets = 0;

    this.ledger.forEach(item => {
      totalGMV += (item.subtotal || 0);
      totalPlatformCut += (item.platformFeeCut || 0);
      totalOrganizerPayout += (item.organizerPayout || 0);
      totalTickets += (item.quantity || 1);
    });

    const baseGMV = 232166.00;
    const baseCut = baseGMV * (this.platformTakeRate / 100);
    const basePayout = baseGMV - baseCut;
    const baseTickets = 5212;

    const displayGMV = totalGMV > 3000 ? totalGMV : (baseGMV + totalGMV);
    const displayCut = totalGMV > 3000 ? totalPlatformCut : (baseCut + totalPlatformCut);
    const displayPayout = totalGMV > 3000 ? totalOrganizerPayout : (basePayout + totalOrganizerPayout);
    const displayTickets = baseTickets + totalTickets;

    const kpiRev = document.getElementById('kpiPlatformRevenue') || document.getElementById('kpiPlatformCut');
    if (kpiRev) kpiRev.textContent = `₹${displayCut.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const kpiGmv = document.getElementById('kpiTotalGmv') || document.getElementById('kpiTotalGMV');
    if (kpiGmv) kpiGmv.textContent = `₹${displayGMV.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const kpiPayout = document.getElementById('kpiOrganizerPayout') || document.getElementById('kpiOrganizerPayouts');
    if (kpiPayout) kpiPayout.textContent = `₹${displayPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const kpiTix = document.getElementById('kpiTicketsCount') || document.getElementById('kpiTotalTickets');
    if (kpiTix) kpiTix.textContent = displayTickets.toLocaleString();

    const tbody = document.getElementById('ledgerTableBody');
    if (tbody) {
      tbody.innerHTML = this.ledger.map(row => `
        <tr>
          <td class="td-id">${row.id}</td>
          <td>
            <div style="font-weight:700; color:var(--text-100);">${row.eventTitle}</div>
            <div style="font-size:12px; color:var(--text-400);">${this.getRegionLabel(row.region)}</div>
          </td>
          <td>
            <div style="font-weight:600; color:var(--text-200);">${row.buyerName}</div>
            <div style="font-size:12px; color:var(--text-400);">${row.buyerEmail}</div>
          </td>
          <td>${row.tier} (x${row.quantity})</td>
          <td style="font-family:var(--mono); font-weight:700; color:var(--text-100);">
            ${row.currency || '₹'}${row.subtotal.toLocaleString()}
          </td>
          <td class="td-cut">
            +${row.currency || '₹'}${row.platformFeeCut.toLocaleString()}
          </td>
          <td class="td-payout">
            ${row.currency || '₹'}${row.organizerPayout.toLocaleString()}
          </td>
          <td style="font-size:12px; color:var(--text-400);">
            ${row.timestamp}
          </td>
        </tr>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // HOST AN EVENT STUDIO
  // --------------------------------------------------------------------------
  bindHostEventForm() {
    const tixInput = document.getElementById('calcTicketsCount') || document.getElementById('newEventCapacity');
    const priceInput = document.getElementById('calcAvgPrice') || document.getElementById('newEventPrice');
    const form = document.getElementById('hostEventForm') || document.getElementById('createEventForm');

    const updateHostCalculator = () => {
      const price = parseFloat(priceInput?.value) || 2499;
      const tix = parseFloat(tixInput?.value) || 250;
      const gross = price * tix;
      const platformFee = gross * (this.platformTakeRate / 100);
      const organizerNet = gross - platformFee;

      const gmvEl = document.getElementById('calcGmvVal') || document.getElementById('calcGrossSales');
      if (gmvEl) gmvEl.textContent = `₹${gross.toLocaleString('en-IN')}`;

      const cutEl = document.getElementById('calcCutVal') || document.getElementById('calcPlatformCut');
      if (cutEl) cutEl.textContent = `₹${platformFee.toLocaleString('en-IN')}`;

      const netEl = document.getElementById('calcNetVal') || document.getElementById('calcOrganizerNet');
      if (netEl) netEl.textContent = `₹${organizerNet.toLocaleString('en-IN')}`;
    };

    priceInput?.addEventListener('input', updateHostCalculator);
    tixInput?.addEventListener('input', updateHostCalculator);
    updateHostCalculator();

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (document.getElementById('hostTitle') || document.getElementById('newEventTitle'))?.value?.trim() || 'Custom Tech Summit';
      const region = (document.getElementById('hostRegion') || document.getElementById('newEventRegion'))?.value || 'bengaluru';
      const category = (document.getElementById('hostCategory') || document.getElementById('newEventCategory'))?.value || 'ai-tech';
      const date = (document.getElementById('hostDate') || document.getElementById('newEventDate'))?.value?.trim() || 'UPCOMING';
      const time = (document.getElementById('hostTime') || document.getElementById('newEventTime'))?.value?.trim() || '06:00 PM';
      const venue = (document.getElementById('hostVenue') || document.getElementById('newEventVenue'))?.value?.trim() || 'City Tech Hub';
      const price = parseFloat((document.getElementById('hostPrice') || document.getElementById('newEventPrice'))?.value) || 999;
      const vipPrice = parseFloat((document.getElementById('hostVipPrice') || document.getElementById('newEventVipPrice'))?.value) || (price * 2);
      const organizer = (document.getElementById('hostOrganizer') || document.getElementById('newEventOrganizer'))?.value?.trim() || 'Community Organizer';
      const desc = (document.getElementById('hostDesc') || document.getElementById('newEventDesc'))?.value?.trim() || 'Exclusive gathering of innovators, engineers, and founders.';
      const imgInput = (document.getElementById('hostImgUrl') || document.getElementById('newEventImage'))?.value?.trim();

      const cityObj = INDIA_CITIES.find(c => c.id === region);
      const isIndia = Boolean(cityObj);

      const newEvent = {
        id: `evt-${region}-${Date.now().toString().slice(-4)}`,
        title,
        region,
        country: isIndia ? 'india' : 'world',
        category,
        date,
        time,
        venue,
        city: cityObj ? cityObj.name : region.toUpperCase(),
        state: cityObj ? cityObj.state : '',
        price,
        vipPrice,
        currency: isIndia ? 'INR' : 'USD',
        symbol: isIndia ? '₹' : '$',
        badge: 'Newly Published',
        organizer,
        pipelineSource: 'istaroth-native',
        verifiedOrganizer: true,
        totalCapacity: 300,
        ticketsSold: 0,
        image: imgInput || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
        description: desc,
        tags: [cityObj ? cityObj.name : region, category, 'Tech']
      };

      this.events.unshift(newEvent);
      this.saveEvents();

      form.reset();
      updateHostCalculator();

      this.setRegion(region);
      this.switchDistrictTab('eventsView');
      this.showToast(`🚀 "${title}" successfully published in ${this.getRegionLabel(region)}!`);
    });
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  showToast(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add('show');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.istarothApp = new IstarothEventsApp();
});
