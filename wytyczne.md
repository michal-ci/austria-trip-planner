# Wytyczne projektu – instrukcja dla agenta AI

Ten dokument opisuje **standard tworzenia statycznych stron WWW** w stylu projektu Oleander Legal (Lion Studio).  
Używaj go jako szablonu przy zakładaniu **nowych, podobnych projektów** – kancelarie, firmy usługowe, landing page’e wielosekcyjne.

---

## 1. Stos technologiczny

| Warstwa | Technologia | Uwagi |
|---------|-------------|--------|
| Markup | HTML5 | Statyczne pliki `.html`, bez frameworka |
| Style | SCSS → CSS | Kompilacja: `npx sass scss/style.scss css/style.css` |
| Skrypty | Vanilla JS (ES6+) | Bez React/Vue; moduły logiczne w osobnych plikach |
| Slidery | Swiper 11 (CDN) | Tylko tam, gdzie jest slider |
| Fonty | Google Fonts (CDN) | W `_variables.scss` |
| Backend | Brak | Formularze / popupy na razie front-endowe |

**Nie dodawaj** npm/webpack, chyba że klient wyraźnie tego wymaga.

---

## 2. Struktura katalogów (szablon nowego projektu)

```
nazwa-projektu/
├── assets/              # Obrazy, ikony, wideo, SVG (webp preferowane)
├── css/
│   ├── style.css        # Skompilowany CSS (commitowany)
│   └── style.min.css    # Opcjonalnie – minifikacja
├── js/
│   ├── main.js          # Header, nawigacja mobile, globalne zachowania
│   ├── slider.js        # Inicjalizacja Swiper
│   ├── consultation-popup.js
│   └── [moduł-strony].js  # Np. offer.js, article-print.js
├── scss/
│   ├── style.scss       # Główny plik – tylko @import
│   ├── _maximy.scss     # Breakpointy i mixiny responsywne
│   ├── _variables.scss  # Kolory, fonty, container
│   ├── _global.scss     # Reset, .container, .btn
│   ├── _header.scss
│   ├── _footer.scss
│   └── _[sekcja].scss   # Jeden partial na sekcję / typ strony
├── page-home.html       # Strona główna
├── page-[nazwa].html    # Podstrony (np. page-kontakt.html, page-ofert.html)
├── article-[typ].html   # Pojedyncze wpisy (blog, sukces)
├── archive-[typ].html   # Archiwum list
└── wytyczne.md          # Ten plik – kopiuj do nowych projektów
```

---

## 3. Konwencje nazewnictwa

### Pliki HTML

| Typ | Wzorzec | Przykład |
|-----|---------|----------|
| Strona główna | `page-home.html` | Landing z sekcjami |
| Podstrona | `page-[slug].html` | `page-kontakt.html`, `page-bio.html` |
| Artykuł | `article-[typ].html` | `article-blog.html`, `article-sukces.html` |
| Archiwum | `archive-[typ].html` lub `archiwe-[typ].html` | Lista wpisów |

### Klasy CSS – BEM

- **Blok:** `site-header`, `hero`, `team`, `offer-hero`
- **Element:** `site-header__logo`, `team__card`
- **Modyfikator:** `btn--primary`, `single-article--success`, `news--related`

Prefiks globalny dla layoutu: `site-` (header, footer, main).  
Sekcje na stronie głównej: krótka nazwa (`hero`, `intro`, `team`, `news`).

### Klasy JS (haki)

- Prefiks `js-`: `js-consultation-trigger`, `js-article-print`
- Stany UI (CSS + JS): `is-open`, `is-active`, `is-submenu-open`

### Assety

- Format: **WebP** dla zdjęć, **SVG** dla ikon i logo
- Nazwy: kebab-case, opisowe: `ico-layer_on.svg`, `bg-blog-archiwe.webp`
- Zawsze `width` i `height` w `<img>` (CLS)

---

## 4. Breakpointy (obowiązkowe)

Zdefiniowane w `_maximy.scss`:

| Token | Wartość | Zastosowanie |
|-------|---------|--------------|
| `$breakpoint-xs` | 576px | Małe telefony |
| `$breakpoint-sm` | 800px | Telefony poziomo |
| `$breakpoint-md` | **992px** | **Główna granica mobile/desktop** |
| `$breakpoint-lg` | 1200px | Laptop |
| `$breakpoint-xl` | 1400px | Duży desktop |

**Mixiny:**

```scss
@include up-to($breakpoint-md) { }   // max-width: 991px – mobile
@include from($breakpoint-md) { }    // min-width: 992px – desktop
@include mobile() { }               // max-width: 799px
```

Reguła: **nawigacja mobilna (burger, 2 warstwy menu) działa do 991px**.

---

## 5. Zmienne designu (`_variables.scss`)

Przy nowym projekcie **nadpisz kolory i fonty**, zachowując strukturę:

```scss
$font-family: 'Plus Jakarta Sans', sans-serif;      // tekst
$font-family-tertiary: 'Cinzel', serif;               // nagłówki

$primary-gold: #C1AA60;
$bg-dark: #0F1A2B;
$bg-white: #FFFFFF;
$text-primary: #1B1B1B;
$text-secondary: #5E5E5E;

$container-max: 1400px;
$container-padding: clamp(1.25rem, 4vw, 3.5rem);
```

---

## 6. Szablon strony HTML

Każda podstrona powinna mieć **spójny szkielet**:

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tytuł – Nazwa firmy</title>
  <link rel="stylesheet" href="css/style.css">
  <!-- Swiper tylko jeśli strona ma slider -->
</head>
<body class="page-[typ]">   <!-- opcjonalna klasa na body -->

  <!-- HEADER – identyczny na wszystkich stronach (skopiuj z page-home.html) -->
  <header class="site-header">...</header>

  <main class="site-main">
    <!-- Treść specyficzna dla strony -->
  </main>

  <!-- FOOTER – identyczny na wszystkich stronach -->
  <footer class="site-footer">...</footer>

  <!-- Skrypty na końcu body -->
  <script src="js/consultation-popup.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### Reguły HTML

1. **Header i footer** – kopiuj z `page-home.html`, aktualizuj tylko linki aktywne / ścieżki względne.
2. Sekcje w `<main>` owijaj w `<section class="[blok]" aria-label="...">`.
3. Kontener: `<div class="container">` lub `container` + modyfikator bloku (`hero__grid`).
4. Linki wewnętrzne: `page-home.html#sekcja` z podstron; `#sekcja` na stronie głównej.
5. CTA konsultacji: klasa `js-consultation-trigger` + `href="#"`.
6. Dostępność: `aria-label`, `aria-hidden="true"` na dekoracjach, `<time datetime="">`.

---

## 7. Header – desktop + mobile (2 warstwy)

### Desktop (≥992px)

- Poziome menu w `.site-header__menu`
- Submenu „Specjalizacje” po **hover** (`.site-header__submenu--desktop`)
- CTA + przełącznik języka widoczne w `.site-header__actions`

### Mobile (<992px)

**Warstwa 1 – menu główne** (po burgerze):

- Logo + zamknięcie (X)
- Linki: O nas, Specjalizacje (z ikoną `ico-layer_on.svg`), Zespół, Aktualności, Kontakt
- Stopka mobile: telefon, CTA, PL/EN

**Warstwa 2 – submenu Specjalizacje:**

- Pełnoekranowa nakładka granatowa (`body.site-header-submenu-open`)
- Ikona powrotu: `ico-layer_off.svg`
- Lista specjalizacji ze złotymi punktorami
- Submenu przenoszone do `document.body` w JS (patrz `main.js`)

**Klasy stanu:**

- `nav.is-open` – menu otwarte
- `nav.is-submenu-open` – warstwa 2
- `body.site-header-nav-open` – blokada scrolla
- `body.site-header-submenu-open` – widoczne submenu

---

## 8. Przyciski (`.btn`)

```html
<a href="#" class="btn btn--primary">
  Tekst CTA
  <span class="btn__arrow" aria-hidden="true">→</span>
</a>
```

Warianty: `btn--primary`, `btn--ghost`, `btn--sm`.  
Na mobile w stopce / hero: pełna szerokość przez modyfikator sekcji (np. `.site-footer__contact .btn { width: 100% }`).

---

## 9. Organizacja SCSS

### `style.scss` – tylko importy, w kolejności:

1. `_maximy`, `_variables`, `_global`
2. Layout: `_header`, `_footer`
3. Sekcje strony głównej (kolejność wizualna)
4. Typy stron: `_article`, `_blog`, `_bio`, `_contact`, `_offer`
5. Komponenty globalne: `_consultation-popup`

### Nowa sekcja – checklist

1. Utwórz `scss/_[nazwa].scss`
2. Dodaj `@import` w `style.scss`
3. Użyj zmiennych kolorów – **nie hardcoduj** hexów poza `_variables.scss`
4. Responsywność: `@include up-to($breakpoint-md)` dla mobile
5. Skompiluj SCSS do CSS

### Wzorce responsywne

- **Kolumny → stack:** `grid-template-columns: 1fr` poniżej breakpointu
- **Grafika nad tekstem na mobile:** `order: -1` na elemencie media lub `::before` z tłem
- **Pełna szerokość przycisków:** `width: 100%` w `@include up-to($breakpoint-md)`

---

## 10. JavaScript – podział plików

| Plik | Odpowiedzialność |
|------|------------------|
| `main.js` | Burger, mobile nav (2 warstwy), scroll do sekcji `#`, hero video |
| `slider.js` | Wszystkie instancje Swiper (team, news, testimonials, successes) |
| `consultation-popup.js` | Popup formularza – markup wstrzykiwany w DOM |
| `offer.js` | Logika specyficzna strony oferty (np. FAQ accordion) |
| `article-print.js` | `window.print()` + style `@media print` |

Zasady:

- `DOMContentLoaded` lub IIFE na końcu `<body>`
- Brak jQuery
- Delegacja zdarzeń na `nav` zamiast wielu listenerów
- `matchMedia('(max-width: 991px)')` spójnie z CSS

---

## 11. Typy stron w projekcie

| Strona | Plik | Klasa `body` | Partial SCSS |
|--------|------|--------------|--------------|
| Główna | `page-home.html` | brak / domyślna | `_hero`, `_intro`, `_team`, … |
| Oferta | `page-ofert.html` | `page-offer` | `_offer.scss` |
| Kontakt | `page-kontakt.html` | `page-contact` | `_contact.scss` |
| Bio | `page-bio.html` | `page-bio` | `_bio.scss` |
| Archiwum blog | `archive-blog.html` | `page-blog` | `_blog.scss` |
| Artykuł blog | `article-blog.html` | – | `_article.scss` |
| Archiwum sukcesów | `archiwe-sukcesy.html` | – | `_successes-archive.scss` |
| Artykuł sukces | `article-sukces.html` | `page-successes` | `_article.scss` |

Przy nowym projekcie: zdefiniuj analogiczną tabelę na początku pracy.

---

## 12. Slidery (Swiper)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<!-- ... -->
<div class="swiper team__swiper">
  <div class="swiper-wrapper">...</div>
</div>
<button class="team__nav team__nav--prev">‹</button>
```

Inicjalizacja w `slider.js` – **osobna instancja na sekcję**, selektor po klasie bloku.

---

## 13. Artykuły – druk / PDF

- Obszar druku: `.single-article__printable` (tytuł, treść, opcjonalnie zdjęcie)
- Przycisk: `<button class="share-widget__print js-article-print">`
- Style: `@media print` w `_article.scss` – ukryj header, footer, sidebar, powiązane

---

## 14. Klikalne karty

Wzorzec: cała karta jako link `<a class="[blok]__card" href="...">`  
Styl: `display: block`, `color: inherit`, `text-decoration: none`, hover + `focus-visible`.

Przykłady: `team__card`, `specializations__card`, `offer-specialist__card`.

---

## 15. Dostępność i SEO (minimum)

- Jeden `<h1>` na stronę
- `lang="pl"` na `<html>`
- Obrazki: sensowny `alt`
- Przyciski icon-only: `aria-label`
- Submenu: `aria-haspopup`, `aria-expanded`, `aria-hidden` na warstwach mobile
- `[id]` na sekcjach + `scroll-margin-top` pod sticky header

---

## 16. Workflow agenta – nowy projekt krok po kroku

### Faza A – szkielet

1. Skopiuj strukturę katalogów z tego repo.
2. Ustaw `_variables.scss` (kolory, fonty klienta).
3. Zbuduj `_global.scss`, `_header.scss`, `_footer.scss`.
4. Stwórz `page-home.html` z headerem, placeholder sekcjami, footerem.
5. Podłącz `main.js`, skompiluj SCSS.

### Faza B – strona główna

1. Sekcja po sekcji: HTML + partial SCSS.
2. Po każdej sekcji: kompilacja SCSS, test mobile (≤991px) i desktop.
3. Slidery na końcu sekcji – `slider.js`.

### Faza C – podstrony

1. Duplikuj header/footer z home.
2. `<main>` tylko z treścią specyficzną.
3. Klasa `body` jeśli strona wymaga innego tła / resetu (`page-offer::before { display: none }`).

### Faza D – QA przed oddaniem

- [ ] Wszystkie strony mają ten sam header/footer
- [ ] Mobile nav: burger → menu → Specjalizacje → powrót
- [ ] Linki `#sekcja` zamykają menu i scrollują
- [ ] Brak poziomego overflow na mobile
- [ ] SCSS skompilowany – `css/style.css` aktualny
- [ ] Obrazki w WebP, logo w SVG
- [ ] Brak zbędnych plików / duplikatów CSS

---

## 17. Czego unikać

- Nie mieszaj Bootstrapa / Tailwinda z tym systemem BEM.
- Nie dodawaj inline `style=""` (wyjątek: tymczasowe prototypy – usuń przed commitem).
- Nie twórz osobnego CSS per strona – wszystko przez `style.scss`.
- Nie hardcoduj breakpointów – używaj `$breakpoint-*` i mixinów.
- Nie commituj tylko SCSS bez skompilowanego CSS (jeśli repo tak działa).
- Nie rozbijaj headera na różne wersje HTML – **jeden wzorzec, kopiowany**.

---

## 18. Kompilacja SCSS

```bash
npx sass scss/style.scss css/style.css
# opcjonalnie mapa źródeł:
npx sass scss/style.scss css/style.css --no-source-map
```

Po każdej większej zmianie w `scss/` – **zawsze** przekompiluj.

---

## 19. Referencja – pliki wzorcowe w tym repo

| Co skopiować / wzorować | Plik |
|------------------------|------|
| Pełny header + mobile nav | `page-home.html` (linie header) |
| Stopka | `page-home.html` (footer) |
| Sekcja hero wideo | `page-home.html` + `_hero.scss` |
| Strona oferty + FAQ | `page-ofert.html` + `_offer.scss` |
| Artykuł z sidebar | `article-blog.html` + `_article.scss` |
| Archiwum z filtrami | `archive-blog.html` + `_blog.scss` |
| Nawigacja JS | `js/main.js` |
| Popup konsultacji | `js/consultation-popup.js` + `_consultation-popup.scss` |

---

## 20. Prompt startowy dla agenta (skopiuj do nowego chatu)

```
Tworzysz statyczny projekt WWW wg wytyczne.md z repo [NAZWA].
Stack: HTML + SCSS (BEM) + vanilla JS + Swiper CDN.
Breakpoint mobile/desktop: 992px.
Skopiuj strukturę katalogów, header/footer z page-home.html.
Kolory i fonty z makety klienta → _variables.scss.
Każda sekcja = partial SCSS + import w style.scss.
Po zmianach SCSS: npx sass scss/style.scss css/style.css.
Mobile nav: 2 warstwy (menu + submenu Specjalizacje).
Nie dodawaj frameworków CSS/JS bez zgody.
```

---

*Dokument oparty na projekcie Oleander Legal (Lion Studio, 2026). Aktualizuj przy zmianach architektury.*
