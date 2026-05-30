const locationScreen = document.getElementById('location-screen');
const loadingScreen  = document.getElementById('loading-screen');
const resultsScreen  = document.getElementById('results-screen');
const cityInput      = document.getElementById('city-input');
const autocompleteEl = document.getElementById('autocomplete-list');

let selectedLocation = null;
let debounceTimer    = null;

// ── Screen switching ──────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Toast errors ──────────────────────────────────────────────────
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// ── Autocomplete (Nominatim) ──────────────────────────────────────
cityInput.addEventListener('input', () => {
  selectedLocation = null;
  clearTimeout(debounceTimer);
  const q = cityInput.value.trim();
  if (q.length < 2) { closeAutocomplete(); return; }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 380);
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    closeAutocomplete();
    handleSearch();
  }
  if (e.key === 'Escape') closeAutocomplete();
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-box')) closeAutocomplete();
});

async function fetchSuggestions(query) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
      `&format=json&limit=6&addressdetails=0&accept-language=he,en`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'he,en' } });
    const data = await res.json();

    autocompleteEl.innerHTML = '';
    if (!data.length) { closeAutocomplete(); return; }

    data.forEach(place => {
      const item = document.createElement('div');
      item.className   = 'autocomplete-item';
      item.textContent = place.display_name;
      item.setAttribute('role', 'option');
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        selectedLocation = {
          lat:  parseFloat(place.lat),
          lng:  parseFloat(place.lon),
          name: place.display_name.split(',').slice(0, 2).join(',').trim(),
        };
        cityInput.value = selectedLocation.name;
        closeAutocomplete();
      });
      autocompleteEl.appendChild(item);
    });

    autocompleteEl.style.display = 'block';
  } catch {
    closeAutocomplete();
  }
}

function closeAutocomplete() {
  autocompleteEl.style.display = 'none';
  autocompleteEl.innerHTML = '';
}

// ── Geolocation ───────────────────────────────────────────────────
document.getElementById('geo-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('הדפדפן שלך אינו תומך באיתור מיקום אוטומטי');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      selectedLocation = {
        lat:  pos.coords.latitude,
        lng:  pos.coords.longitude,
        name: 'מיקומך הנוכחי',
      };
      cityInput.value = 'מיקומך הנוכחי';
      closeAutocomplete();
    },
    err => {
      const msgs = {
        1: 'הגישה למיקום נדחתה. אפשר גישה בהגדרות הדפדפן.',
        2: 'לא ניתן לאתר את מיקומך כרגע.',
        3: 'הזמן לאיתור המיקום פג. נסה שוב.',
      };
      showToast(msgs[err.code] || 'שגיאה באיתור המיקום');
    },
    { timeout: 10000 }
  );
});

// ── Search button ─────────────────────────────────────────────────
document.getElementById('search-btn').addEventListener('click', handleSearch);

async function handleSearch() {
  if (selectedLocation) {
    await fetchShabbat(selectedLocation);
    return;
  }

  const query = cityInput.value.trim();
  if (!query) {
    showToast('אנא הזן עיר או השתמש במיקום הנוכחי');
    cityInput.focus();
    return;
  }

  showScreen('loading-screen');
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
      `&format=json&limit=1&accept-language=he,en`;
    const res   = await fetch(url);
    const data  = await res.json();

    if (!data.length) {
      showScreen('location-screen');
      showToast(`לא נמצא מיקום עבור "${query}"`);
      return;
    }

    await fetchShabbat({
      lat:  parseFloat(data[0].lat),
      lng:  parseFloat(data[0].lon),
      name: data[0].display_name.split(',').slice(0, 2).join(',').trim(),
    });
  } catch {
    showScreen('location-screen');
    showToast('שגיאה בחיפוש המיקום. בדוק את החיבור לאינטרנט.');
  }
}

// ── Fetch from server ─────────────────────────────────────────────
async function fetchShabbat(location) {
  showScreen('loading-screen');

  try {
    const res  = await fetch(`/api/shabbat?lat=${location.lat}&lng=${location.lng}`);
    const data = await res.json();

    if (!res.ok) {
      showScreen('location-screen');
      showToast(data.error || 'שגיאה בטעינת הנתונים');
      return;
    }

    displayResults(data, location.name);
  } catch {
    showScreen('location-screen');
    showToast('שגיאת שרת. בדוק את החיבור ונסה שוב.');
  }
}

// ── Render results ────────────────────────────────────────────────
function displayResults(data, locationName) {
  const displayName = locationName || data.locationTitle || 'מיקומך';
  document.getElementById('location-name').textContent  = `📍 ${displayName}`;
  document.getElementById('parasha-name').textContent   = data.parasha || '';
  document.getElementById('shabbat-date').textContent   = data.shabbatDate || '';
  document.getElementById('candle-lighting').textContent = data.candleLighting || '—';
  document.getElementById('havdalah').textContent        = data.havdalah || '—';
  document.getElementById('dvar-torah').textContent      = data.dvarTorah || '';
  document.getElementById('halacha-1').textContent       = data.halachot?.[0] || '';
  document.getElementById('halacha-2').textContent       = data.halachot?.[1] || '';
  showScreen('results-screen');
}

// ── Back button ───────────────────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('location-screen');
});
