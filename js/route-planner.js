(function (global) {
  'use strict';

  const PACE_HOURS = {
    intensywne: 10,
    zrownowazone: 8,
    spokojne: 6
  };

  const TRANSPORT_ALIASES = {
    motor: 'motor',
    kamper: 'kamper'
  };

  const ROAD_SPEED_KMH = {
    samochod: 70,
    motor: 65,
    kamper: 60,
    pociag: 80,
    rower: 15,
    pieszo: 4
  };

  function normalizeTransport(transport) {
    return TRANSPORT_ALIASES[transport] || transport || 'samochod';
  }

  function getTripDays(startDate, endDate) {
    if (!startDate || !endDate) return 5;
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const diff = Math.round((end - start) / 86400000) + 1;
    return Math.max(1, diff);
  }

  function getSeasonFromDate(dateStr) {
    if (!dateStr) return 'calorocznie';
    const month = new Date(dateStr + 'T12:00:00').getMonth() + 1;
    if (month >= 3 && month <= 5) return 'wiosna';
    if (month >= 6 && month <= 8) return 'lato';
    if (month >= 9 && month <= 11) return 'jesien';
    return 'zima';
  }

  function getVisitMinutes(place, pace) {
    const hours = place.visitHours || { min: 3, recommended: 5, max: 7 };
    if (pace === 'intensywne') return hours.min * 60;
    if (pace === 'spokojne') return hours.max * 60;
    return hours.recommended * 60;
  }

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h + ' h';
    return m + ' min';
  }

  function haversineKm(a, b) {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function estimateTravelMinutes(from, to, transport, travelMatrix) {
    const mode = normalizeTransport(transport);
    const matrix = travelMatrix[mode] || travelMatrix.samochod || {};
    const key = from.id + '_' + to.id;
    const reverseKey = to.id + '_' + from.id;
    if (matrix[key] != null) return matrix[key];
    if (matrix[reverseKey] != null) return matrix[reverseKey];

    const dist = haversineKm(from, to) * 1.35;
    const speed = ROAD_SPEED_KMH[mode] || 60;
    return Math.max(15, Math.round((dist / speed) * 60));
  }

  function resolveStartHub(origin, places) {
    const text = (origin || '').toLowerCase();
    const inAustria = [
      { match: ['wied', 'vienna'], id: 'wieden' },
      { match: ['salzburg'], id: 'salzburg' },
      { match: ['innsbruck'], id: 'innsbruck' },
      { match: ['hallstatt'], id: 'hallstatt' },
      { match: ['wolfgang'], id: 'wolfgangsee' },
      { match: ['grossglockner', 'heiligenblut'], id: 'grossglockner' }
    ];

    for (const item of inAustria) {
      if (item.match.some(token => text.includes(token))) {
        const hub = places.find(place => place.id === item.id);
        if (hub) return { hub, inboundMinutes: 0, fromPoland: false };
      }
    }

    const salzburg = places.find(place => place.id === 'salzburg');
    return { hub: salzburg || places[0], inboundMinutes: null, fromPoland: true };
  }

  function getInboundMinutes(hub, transport, originTravelMinutes, fromPoland) {
    if (!fromPoland || !hub) return 0;
    const mode = normalizeTransport(transport);
    const table = originTravelMinutes[mode] || originTravelMinutes.samochod || {};
    return table['polska_' + hub.id] || table.polska_salzburg || 360;
  }

  function scorePlace(place, formData, season) {
    let score = 0;
    const interests = formData.interests || [];

    interests.forEach(tag => {
      if ((place.interests || []).includes(tag)) score += 3;
    });

    if ((place.transport || []).includes(formData.transport)) score += 2;
    if ((place.pace || []).includes(formData.pace)) score += 1;
    if ((place.budget || []).includes(formData.budget)) score += 1;
    if ((place.style || []).includes(formData.style)) score += 1;

    const seasons = place.season || [];
    if (seasons.includes(season) || seasons.includes('calorocznie')) score += 1;
    else score -= 2;

    if (place.type === 'miasto' || place.type === 'jezioro') score += 1;
    if (place.type === 'trasa' && formData.transport === 'pieszo') score -= 3;

    return score;
  }

  function filterCandidates(places, formData, season) {
    return places
      .filter(place => place.type !== 'inspiracja' && place.lat != null && place.lng != null)
      .map(place => ({ place, score: scorePlace(place, formData, season) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function buildGreedyRoute(candidates, startHub, transport, travelMatrix, budgetMinutes, inboundMinutes, pace) {
    const route = [];
    let remaining = budgetMinutes - inboundMinutes;
    let current = startHub;
    const pool = candidates.map(item => item.place).filter(place => place.id !== startHub.id);

    while (pool.length && route.length < 5) {
      let bestIndex = -1;
      let bestCost = Infinity;

      pool.forEach((place, index) => {
        const travel = current.id === place.id ? 0 : estimateTravelMinutes(current, place, transport, travelMatrix);
        const visit = getVisitMinutes(place, pace);
        const cost = travel + visit;
        if (cost <= remaining && cost < bestCost) {
          bestCost = cost;
          bestIndex = index;
        }
      });

      if (bestIndex === -1) break;

      const next = pool.splice(bestIndex, 1)[0];
      const travelMinutes = current.id === next.id ? 0 : estimateTravelMinutes(current, next, transport, travelMatrix);
      route.push({ place: next, travelMinutes, visitMinutes: getVisitMinutes(next, pace) });
      remaining -= travelMinutes + route[route.length - 1].visitMinutes;
      current = next;
    }

    return route;
  }

  function assignDays(stops, formData, inboundMinutes, originLabel, startHub) {
    const pace = formData.pace || 'zrownowazone';
    const dailyBudget = (PACE_HOURS[pace] || 8) * 60;
    const days = [];
    let dayNumber = 1;
    let dayItems = [];
    let dayUsed = 0;

    const pushDay = () => {
      if (!dayItems.length) return;
      days.push({ day: dayNumber, items: dayItems, totalMinutes: dayUsed });
      dayNumber += 1;
      dayItems = [];
      dayUsed = 0;
    };

    const addItem = item => {
      if (dayUsed + item.minutes > dailyBudget && dayItems.length) pushDay();
      dayItems.push(item);
      dayUsed += item.minutes;
    };

    if (inboundMinutes > 0) {
      addItem({
        type: 'travel',
        label: 'Dojazd: ' + originLabel + ' → ' + (startHub?.name || stops[0]?.place?.name || 'Austria'),
        minutes: inboundMinutes
      });
    }

    stops.forEach((stop, index) => {
      if (stop.travelMinutes > 0) {
        addItem({
          type: 'travel',
          label: 'Przejazd do ' + stop.place.name,
          minutes: stop.travelMinutes
        });
      }
      addItem({
        type: 'visit',
        place: stop.place,
        label: stop.place.name,
        minutes: getVisitMinutes(stop.place, pace)
      });
    });

    pushDay();
    return days;
  }

  function buildRoute(formData, catalog) {
    const places = catalog.places || [];
    const travelMatrix = catalog.travelMinutes || {};
    const originTravelMinutes = catalog.originTravelMinutes || {};
    const tripDays = getTripDays(formData.startDate, formData.endDate);
    const pace = formData.pace || 'zrownowazone';
    const transport = formData.transport || 'samochod';
    const season = getSeasonFromDate(formData.startDate);
    const dailyHours = PACE_HOURS[pace] || 8;
    const budgetMinutes = tripDays * dailyHours * 60;

    const { hub, fromPoland } = resolveStartHub(formData.origin, places);
    const inboundMinutes = getInboundMinutes(hub, transport, originTravelMinutes, fromPoland);
    const candidates = filterCandidates(places, formData, season);

    let stops = buildGreedyRoute(candidates, hub, transport, travelMatrix, budgetMinutes, inboundMinutes, pace);

    if (fromPoland && hub && !stops.some(stop => stop.place.id === hub.id)) {
      stops.unshift({
        place: hub,
        travelMinutes: 0,
        visitMinutes: getVisitMinutes(hub, pace)
      });
    }

    if (!stops.length && hub) {
      stops = [{
        place: hub,
        travelMinutes: 0,
        visitMinutes: getVisitMinutes(hub, pace)
      }];
    }

    stops = stops.map(stop => ({
      ...stop,
      visitMinutes: getVisitMinutes(stop.place, pace)
    }));

    const days = assignDays(stops, formData, inboundMinutes, formData.origin || 'Twój punkt startowy', hub);
    const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);

    return {
      tripDays,
      pace,
      transport,
      season,
      budgetMinutes,
      totalMinutes,
      startHub: hub,
      inboundMinutes,
      stops,
      days,
      orderedPlaces: stops.map(stop => stop.place)
    };
  }

  function buildRouteSummary(route) {
    return [
      'Dni podróży: ' + route.tripDays,
      'Dostępny czas: ' + formatDuration(route.budgetMinutes),
      'Zaplanowany czas: ' + formatDuration(route.totalMinutes),
      'Kolejność: ' + route.orderedPlaces.map(place => place.name).join(' → ')
    ].join('\n');
  }

  global.PlanerRoutePlanner = {
    buildRoute,
    buildRouteSummary,
    formatDuration,
    getTripDays
  };
})(window);
