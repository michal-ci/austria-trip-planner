(function () {
  'use strict';

  const AI_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1',
    // Wklej klucz OpenRouter (https://openrouter.ai/keys) albo ustaw w konsoli:
    // localStorage.setItem('planer_openrouter_key', 'sk-or-...')
    token: localStorage.getItem('planer_openrouter_key') || '',
    model: 'openai/gpt-4o-mini'
  };

  let austriaInfoPlaces = [];
  let planCatalog = { places: [], travelMinutes: {}, originTravelMinutes: {} };
  let lastBuiltRoute = null;

  const TOTAL_STEPS = 7;
  const storageKey = 'austria-trip-planner';
  const appShell = document.querySelector('[data-screen="app"]');
  const loadingScreen = document.querySelector('[data-screen="loading"]');
  const loadingProgress = document.querySelector('[data-loading-progress]');
  const loadingValue = document.querySelector('[data-loading-value]');
  const loadingStatus = document.querySelector('[data-loading-status]');
  const quizForm = document.querySelector('[data-quiz-form]');
  const toast = document.querySelector('[data-toast]');
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  let formData = saved.formData || {};
  let currentStep = 1;
  let toastTimer;
  let autoAdvanceTimer = null;
  let pendingPlanHtml = null;
  let planProgressTimer = null;
  let isGeneratingPlan = false;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function setRoute(route) {
    const safeRoute = ['home', 'form', 'result'].includes(route) ? route : 'home';
    document.querySelectorAll('[data-route]').forEach(section => {
      const active = section.dataset.route === safeRoute;
      section.hidden = !active;
    });
    document.body.classList.remove('is-route-home', 'is-route-form', 'is-route-result');
    document.body.classList.add('is-route-' + safeRoute);
    if (safeRoute === 'form') resetQuiz();
    if (safeRoute === 'result') renderResult();
    history.replaceState({}, '', '#' + safeRoute);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function playLoadingVideo() {
    const video = document.querySelector('[data-loading-video]');
    if (!video) return;
    video.muted = true;
    const play = () => video.play().catch(() => {});
    if (video.readyState >= 2) play();
    else video.addEventListener('canplay', play, { once: true });
  }

  function finishLoading() {
    loadingScreen.classList.remove('is-active');
    loadingScreen.hidden = true;
    appShell.hidden = false;
    setRoute(location.hash.slice(1) || 'home');
  }

  function runLoading() {
    playLoadingVideo();
    if (new URLSearchParams(location.search).has('skipLoading')) {
      finishLoading();
      return;
    }
    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(100, value + (value < 70 ? 4 : 2));
      loadingProgress.value = value;
      loadingValue.textContent = value + '%';
      if (value >= 70) loadingStatus.textContent = 'UKŁADAMY TWOJĄ TRASĘ.....';
      if (value === 100) {
        clearInterval(timer);
        setTimeout(finishLoading, 350);
      }
    }, 55);
  }

  function showPlanGenerating() {
    clearInterval(planProgressTimer);
    appShell.hidden = true;
    loadingScreen.hidden = false;
    loadingScreen.classList.add('is-active');
    loadingStatus.textContent = 'PRZYGOTOWUJEMY TWÓJ PLAN PODRÓŻY.....';
    loadingProgress.value = 0;
    loadingValue.textContent = '0%';
    playLoadingVideo();

    let value = 0;
    planProgressTimer = setInterval(() => {
      value = Math.min(92, value + (value < 60 ? 3 : 1));
      loadingProgress.value = value;
      loadingValue.textContent = value + '%';
      if (value >= 55) loadingStatus.textContent = 'DOBIERAMY MIEJSCA Z AUSTRIA.INFO.....';
    }, 120);
  }

  function hidePlanGenerating() {
    clearInterval(planProgressTimer);
    planProgressTimer = null;
    loadingProgress.value = 100;
    loadingValue.textContent = '100%';
    loadingStatus.textContent = 'TWÓJ PLAN JEST GOTOWY.....';
    return new Promise(resolve => {
      setTimeout(() => {
        loadingScreen.classList.remove('is-active');
        loadingScreen.hidden = true;
        appShell.hidden = false;
        resolve();
      }, 420);
    });
  }

  function setupMotionVideos() {
    if (matchMedia('(max-width: 700px)').matches) return;

    document.querySelectorAll('.planer_motion-frame').forEach(frame => {
      const video = frame.querySelector('[data-motion-video]');
      if (!video) return;

      const isHome = frame.classList.contains('planer_home-frame');
      const shade = frame.querySelector('.planer_home-frame__shade');
      const strengthX = isHome ? 28 : 10;
      const strengthY = isHome ? 20 : 8;
      const hoverScale = isHome ? 1.08 : 1.03;
      const restScale = isHome ? 1.03 : 1.01;
      const ease = isHome ? .1 : .14;

      let raf = 0;
      let hovering = false;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      const render = () => {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
        const scale = hovering ? hoverScale : restScale;
        const rotateY = isHome ? currentX * -.045 : 0;
        const rotateX = isHome ? currentY * .05 : 0;
        video.style.transform = `scale(${scale}) translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;

        if (shade && isHome) {
          shade.style.transform = `translate3d(${(currentX * -.35).toFixed(2)}px, ${(currentY * -.35).toFixed(2)}px, 0)`;
        }

        const stillMoving = Math.abs(targetX - currentX) > .04 || Math.abs(targetY - currentY) > .04;
        if (hovering || stillMoving) {
          raf = requestAnimationFrame(render);
          return;
        }

        raf = 0;
        video.style.transform = `scale(${restScale})`;
        if (shade) shade.style.transform = '';
      };

      const kickRender = () => {
        if (!raf) raf = requestAnimationFrame(render);
      };

      video.muted = true;
      video.pause();
      video.addEventListener('loadeddata', () => {
        video.pause();
        try { video.currentTime = 0; } catch (_) { /* ignore seek errors */ }
      }, { once: true });

      frame.addEventListener('pointerenter', () => {
        hovering = true;
        frame.classList.add('is-parallax');
        video.play().catch(() => {});
        kickRender();
      });

      frame.addEventListener('pointermove', event => {
        if (!hovering) return;
        const rect = frame.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        targetX = x * -strengthX;
        targetY = y * -strengthY;
        kickRender();
      });

      frame.addEventListener('pointerleave', () => {
        hovering = false;
        frame.classList.remove('is-parallax');
        targetX = 0;
        targetY = 0;
        video.pause();
        kickRender();
      });
    });
  }

  function clearAutoAdvance() {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  function updateQuiz(step) {
    clearAutoAdvance();
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
    document.querySelectorAll('.planer_quiz-step').forEach(item => item.classList.toggle('is-active', Number(item.dataset.step) === currentStep));
    document.querySelector('[data-step-number]').textContent = currentStep;
    const backBtn = document.querySelector('[data-quiz-prev]');
    if (backBtn) backBtn.classList.toggle('is-visible', currentStep > 1);
    document.querySelector('[data-quiz-next]').setAttribute('aria-label', currentStep === TOTAL_STEPS ? 'Generuj plan podróży' : 'Następne pytanie');
  }

  function resetQuiz() { updateQuiz(1); }

  function isCurrentStepComplete() {
    const data = collectFormData();
    if (currentStep === 1) {
      return Boolean(data.startDate && data.endDate && data.endDate >= data.startDate);
    }
    if (currentStep === 2) return Boolean(data.style);
    if (currentStep === 3) return Boolean((data.origin || '').trim().length >= 2);
    if (currentStep === 4) return Boolean(data.transport);
    if (currentStep === 5) return Boolean(data.pace);
    if (currentStep === 6) return (data.interests || []).length > 0;
    if (currentStep === 7) return Boolean(data.budget);
    return false;
  }

  function goNextStep() {
    if (currentStep < TOTAL_STEPS) {
      updateQuiz(currentStep + 1);
      return;
    }
    generatePlanAndShowResult();
  }

  function scheduleAutoAdvance(delay) {
    clearAutoAdvance();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      if (!isCurrentStepComplete() || isGeneratingPlan) return;
      goNextStep();
    }, delay);
  }

  function handleQuizFieldChange(event) {
    const field = event.target;
    if (!field || !quizForm.contains(field)) return;

    if (currentStep === 1 && (field.name === 'startDate' || field.name === 'endDate')) {
      if (isCurrentStepComplete()) scheduleAutoAdvance(280);
      return;
    }

    if (currentStep === 2 && field.name === 'style') {
      scheduleAutoAdvance(320);
      return;
    }

    if (currentStep === 3 && field.name === 'origin') {
      if (event.type === 'keydown' && event.key === 'Enter') {
        event.preventDefault();
        if (isCurrentStepComplete()) goNextStep();
        return;
      }
      if (isCurrentStepComplete()) scheduleAutoAdvance(700);
      return;
    }

    if (currentStep === 4 && field.name === 'transport') {
      scheduleAutoAdvance(320);
      return;
    }

    if (currentStep === 5 && field.name === 'pace') {
      scheduleAutoAdvance(320);
      return;
    }

    if (currentStep === 6 && field.name === 'interests') {
      // Multi-select: nie przechodź automatycznie — użytkownik klika strzałkę dalej.
      clearAutoAdvance();
      return;
    }

    if (currentStep === 7 && field.name === 'budget') {
      scheduleAutoAdvance(420);
    }
  }

  function collectFormData() {
    const data = Object.fromEntries(new FormData(quizForm).entries());
    data.interests = [...quizForm.querySelectorAll('input[name="interests"]:checked')].map(input => input.value);
    return data;
  }

  function buildRoutePlan(data) {
    if (!globalThis.PlanerRoutePlanner) return null;
    return PlanerRoutePlanner.buildRoute(data, planCatalog);
  }

  function formatAustriaImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('assets/')) return url;
    if (url.includes('filerobot.com')) {
      const base = url.split('?')[0];
      return base + '?w=960&h=540&func=crop&gravity=auto&q=80';
    }
    return url;
  }

  function resolvePlaceImage(place) {
    if (!place) return '';
    if (place.image) return formatAustriaImageUrl(place.image);
    if (place.id) return 'assets/places/' + place.id + '.jpg';
    return '';
  }

  function buildPlacePhotoHtml(place) {
    const src = resolvePlaceImage(place);
    if (!src) return '';
    return '<img class="planer_place__photo" src="' + src + '" alt="' + place.name + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="960" height="540">';
  }

  function buildPlaceStoryHtml(place) {
    const chunks = Array.isArray(place.story) && place.story.length ? place.story : [place.blurb];
    return '<div class="planer_place__story">' + chunks.map(text => '<p>' + text + '</p>').join('') + '</div>';
  }

  const TRANSPORT_LABELS = {
    samochod: 'samochodem',
    motor: 'motorem',
    kamper: 'kamperem',
    rower: 'rowerem',
    pieszo: 'pieszo',
    pociag: 'pociągiem'
  };

  function buildNarrativeIntro(route, data) {
    const origin = (data && data.origin) || 'Twojego miasta';
    const transport = TRANSPORT_LABELS[data.transport] || 'w drodze';
    const places = route.orderedPlaces.map(place => place.name).join(', ');

    return (
      '<div class="planer_plan-intro">' +
        '<p>Hej — gotowy na podróż, której jeszcze nie znasz? Ruszamy z <strong>' + origin + '</strong> ' + transport + ' w serce Austrii. ' +
        'Przygotowaliśmy dla Ciebie <strong>' + route.tripDays + ' dni</strong> ułożonych tak, żeby zobaczyć więcej, ale bez chaosu — z czasem na widoki, jedzenie i spokojne tempo.</p>' +
        '<p>Twoja trasa prowadzi przez: ' + places + '. Każdy dzień ma swój rytm — dojazdy, zwiedzanie i chwile na to, żeby po prostu być w miejscu. ' +
        'Poniżej znajdziesz plan krok po kroku, z orientacyjnymi czasami przejazdów i pobytu.</p>' +
      '</div>'
    );
  }

  function findPlaceByName(name) {
    const label = (name || '').trim().toLowerCase();
    return austriaInfoPlaces.find(place => place.name.toLowerCase() === label);
  }

  function buildDayItemHtml(item) {
    if (item.type === 'travel') {
      return (
        '<p class="planer_route-item planer_route-item--travel">' + item.label +
        '<span class="planer_route-item__time">≈ ' + PlanerRoutePlanner.formatDuration(item.minutes) + '</span></p>'
      );
    }

    const place = item.place;
    return (
      '<section class="planer_place">' +
        '<h3>' + place.name + '</h3>' +
        buildPlacePhotoHtml(place) +
        buildPlaceStoryHtml(place) +
        '<p class="planer_route-item__time">Czas zwiedzania: ≈ ' + PlanerRoutePlanner.formatDuration(item.minutes) + '</p>' +
        '<p><a class="planer_place__more" href="' + place.url + '" target="_blank" rel="noopener noreferrer">Więcej o miejscu na austria.info</a></p>' +
      '</section>'
    );
  }

  function buildRouteHtml(route, data) {
    const intro = buildNarrativeIntro(route, data || formData);

    const daysHtml = route.days.map(day => (
      '<section class="planer_route-day">' +
        '<h3 class="planer_route-day__title">Dzień ' + day.day + '</h3>' +
        day.items.map(buildDayItemHtml).join('') +
      '</section>'
    )).join('');

    return intro + daysHtml;
  }

  function buildFallbackPlan(data) {
    const route = buildRoutePlan(data || {});
    if (!route) {
      return '<p>Nie udało się wygenerować trasy. Sprawdź połączenie z serwerem i plik data/austria-places.json.</p>';
    }
    lastBuiltRoute = route;
    return buildRouteHtml(route, data);
  }

  function routeForPrompt(route) {
    return JSON.stringify({
      tripDays: route.tripDays,
      transport: route.transport,
      pace: route.pace,
      budgetMinutes: route.budgetMinutes,
      totalMinutes: route.totalMinutes,
      days: route.days.map(day => ({
        day: day.day,
        items: day.items.map(item => item.type === 'travel'
          ? { type: 'travel', label: item.label, minutes: item.minutes }
          : { type: 'visit', name: item.place.name, url: item.place.url, minutes: item.minutes, blurb: item.place.blurb, story: item.place.story, image: resolvePlaceImage(item.place) })
      }))
    });
  }

  function placesCatalogForPrompt(route) {
    const places = route ? route.orderedPlaces : austriaInfoPlaces;
    return places.map(place => '- ' + place.name + ' | ' + place.url + ' | image: ' + resolvePlaceImage(place) + ' | story: ' + (Array.isArray(place.story) ? place.story.join(' ') : place.blurb)).join('\n');
  }

  function enhancePlanLinks(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    wrap.querySelectorAll('a[href*="austria.info"]').forEach(link => {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (!link.classList.contains('planer_place__more')) link.classList.add('planer_place__more');
    });

    wrap.querySelectorAll('.planer_place').forEach(section => {
      const title = section.querySelector('h3');
      const place = findPlaceByName(title && title.textContent);
      if (!place) return;

      const photo = section.querySelector('.planer_place__photo');
      if (photo) {
        photo.src = resolvePlaceImage(place);
        photo.alt = place.name;
        photo.setAttribute('referrerpolicy', 'no-referrer');
      } else {
        const img = document.createElement('img');
        img.className = 'planer_place__photo';
        img.src = resolvePlaceImage(place);
        img.alt = place.name;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.width = 960;
        img.height = 540;
        if (title && title.nextSibling) section.insertBefore(img, title.nextSibling);
        else section.appendChild(img);
      }

      if (!section.querySelector('.planer_place__story') && Array.isArray(place.story)) {
        const story = document.createElement('div');
        story.className = 'planer_place__story';
        story.innerHTML = place.story.map(text => '<p>' + text + '</p>').join('');
        const timeNode = section.querySelector('.planer_route-item__time');
        if (timeNode) section.insertBefore(story, timeNode);
        else section.appendChild(story);
      }
    });

    return wrap.innerHTML;
  }

  async function requestAiPlan(data, route) {
    const { baseUrl, token, model } = AI_CONFIG;
    if (!baseUrl || !token || token === 'WSTAW_OPENROUTER_KEY' || token === 'WSTAW_TUTAJ_TOKEN_LITELLM') return null;

    const system = 'Jesteś redaktorem podróży w stylu magazynu turystycznego (jak planer Onet). Piszesz po polsku, narracyjnie, ciepło i konkretnie — angażujesz czytelnika, ale nie zmieniasz faktów trasy.';
    const prompt = [
      'Na podstawie odpowiedzi użytkownika i GOTOWEJ trasy (z czasami) napisz rozbudowany plan podróży po Austrii.',
      'Dane użytkownika: ' + JSON.stringify(data),
      'Gotowa trasa (NIE ZMIENIAJ kolejności, nazw miejsc ani czasów): ' + routeForPrompt(route),
      'Styl (jak Onet / planer podróży):',
      '- intro: 2 pełne akapity w <div class="planer_plan-intro">, ton „Hej, gotowy na podróż...”, druga osoba',
      '- każde miejsce: 2-3 pełne akapity w <div class="planer_place__story"> (min. 2 zdania na akapit), zmysły, tip praktyczny',
      '- łącz akapity w narrację trasy, nie suchą listę faktów',
      'Zasady formatu HTML:',
      '1. Zwróć wyłącznie bezpieczny HTML, bez markdown.',
      '2. Zachowaj podział na dni z gotowej trasy.',
      '3. Dzień: <section class="planer_route-day"><h3 class="planer_route-day__title">Dzień N</h3>...</section>',
      '4. Przejazd: <p class="planer_route-item planer_route-item--travel">...<span class="planer_route-item__time">≈ ...</span></p>',
      '5. Miejsce: <section class="planer_place"><h3>Nazwa</h3><img class="planer_place__photo" src="URL_ZDJECIA_Z_KATALOGU" alt="Nazwa" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="960" height="540"><div class="planer_place__story"><p>...</p><p>...</p></div><p class="planer_route-item__time">Czas zwiedzania: ...</p><p><a class="planer_place__more" href="URL" target="_blank" rel="noopener noreferrer">Więcej o miejscu na austria.info</a></p></section>',
      '6. Katalog (url + image z austria.info + story — używaj wyłącznie stąd):',
      placesCatalogForPrompt(route)
    ].join('\n');

    const response = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'HTTP-Referer': location.origin || 'http://localhost',
        'X-Title': 'Austria Trip Planner'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: .75,
        max_tokens: 3200
      })
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error('OpenRouter request failed: ' + response.status + ' ' + details);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || null;
    return content ? enhancePlanLinks(content) : null;
  }

  function updateMapLink(data, route) {
    const origin = (data && data.origin) || 'Salzburg, Austria';
    const stops = (route && route.orderedPlaces.length)
      ? route.orderedPlaces
      : austriaInfoPlaces.slice(0, 3);

    if (!stops.length) return;

    const destination = stops[stops.length - 1].name + ', Austria';
    const waypoints = stops.slice(0, -1).map(place => place.name + ', Austria').join('|');
    let url = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(origin) +
      '&destination=' + encodeURIComponent(destination);
    if (waypoints) url += '&waypoints=' + encodeURIComponent(waypoints);
    document.querySelector('[data-map-link]').href = url;
  }

  function renderResult() {
    const copy = document.querySelector('[data-plan-copy]');
    copy.innerHTML = pendingPlanHtml || buildFallbackPlan(formData);
    pendingPlanHtml = null;
    updateMapLink(formData, lastBuiltRoute);
  }

  async function generatePlanAndShowResult() {
    if (isGeneratingPlan) return;
    if (!isCurrentStepComplete() && currentStep === TOTAL_STEPS) {
      showToast('Wybierz budżet, aby przygotować plan.');
      return;
    }

    clearAutoAdvance();
    isGeneratingPlan = true;
    formData = collectFormData();
    localStorage.setItem(storageKey, JSON.stringify({ formData }));
    showPlanGenerating();

    const route = buildRoutePlan(formData);
    lastBuiltRoute = route;

    try {
      const plan = route ? await requestAiPlan(formData, route) : null;
      pendingPlanHtml = plan || buildRouteHtml(route, formData);
      if (!plan) showToast('AI niedostępne — pokazujemy trasę z obliczonymi czasami.');
    } catch (_) {
      pendingPlanHtml = route ? buildRouteHtml(route, formData) : buildFallbackPlan(formData);
      showToast('Nie udało się połączyć z AI — pokazujemy trasę z obliczonymi czasami.');
    }

    await hidePlanGenerating();
    isGeneratingPlan = false;
    setRoute('result');
  }

  async function loadPlanData() {
    const response = await fetch('data/austria-places.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data/austria-places.json');
    const payload = await response.json();
    planCatalog = {
      places: Array.isArray(payload) ? payload : (payload.places || []),
      travelMinutes: payload.travelMinutes || {},
      originTravelMinutes: payload.originTravelMinutes || {}
    };
    austriaInfoPlaces = planCatalog.places;
  }

  function initApp() {
    document.addEventListener('click', event => {
      const routeButton = event.target.closest('[data-go]');
      if (routeButton) {
        event.preventDefault();
        setRoute(routeButton.dataset.go);
      }
    });

    quizForm.addEventListener('change', handleQuizFieldChange);
    quizForm.addEventListener('input', handleQuizFieldChange);
    quizForm.addEventListener('keydown', handleQuizFieldChange);

    document.querySelector('[data-quiz-next]').addEventListener('click', () => {
      if (!isCurrentStepComplete()) {
        showToast('Uzupełnij to pole, aby przejść dalej.');
        return;
      }
      goNextStep();
    });
    document.querySelector('[data-quiz-prev]').addEventListener('click', () => updateQuiz(currentStep - 1));
    document.querySelector('[data-print]').addEventListener('click', () => window.print());
    document.querySelector('[data-share]').addEventListener('click', async () => {
      const shareData = { title: 'Moja podróż po Austrii', text: 'Zobacz mój plan podróży po Austrii.', url: location.href };
      try {
        if (navigator.share) await navigator.share(shareData);
        else { await navigator.clipboard.writeText(location.href); showToast('Link do planu został skopiowany.'); }
      } catch (_) { /* anulowane przez użytkownika */ }
    });

    setupMotionVideos();
    runLoading();
  }

  loadPlanData()
    .then(initApp)
    .catch(() => {
      austriaInfoPlaces = [];
      initApp();
      showToast('Nie udało się wczytać katalogu miejsc — plan może być ograniczony.');
    });
})();
