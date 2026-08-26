# Austria Trip Planner Demo

To demo interaktywnej strony, która pomaga zaplanować podróż po Austrii na podstawie krótkiego quizu.

## Do czego służy

Użytkownik odpowiada na kilka pytań dotyczących:

- terminu podróży,
- miejsca startu,
- środka transportu,
- tempa zwiedzania,
- zainteresowań,
- budżetu.

Na tej podstawie strona przygotowuje przykładowy plan wyjazdu z podziałem na dni, orientacyjnymi czasami przejazdów i propozycjami miejsc do odwiedzenia.

## Jak działa demo

Projekt ma 3 główne ekrany:

1. ekran startowy,
2. quiz,
3. ekran wyniku z gotowym planem podróży.

Plan jest budowany na podstawie lokalnych danych zapisanych w `data/austria-places.json`. Wynik może zostać dodatkowo opisany bardziej narracyjnie przez AI.

## Dostęp do podglądu (StatiCrypt)

Publiczny podgląd jest chroniony przez [StatiCrypt](https://github.com/robinmoisson/staticrypt) (AES-256, odszyfrowanie w przeglądarce):

- link: https://michal-ci.github.io/austria-trip-planner/
- hasło: `austria2026`

Edycja treści odbywa się w `index.source.html`. Po zmianach uruchom:

```bash
npm run encrypt
```

To generuje zaszyfrowany `index.html` publikowany na GitHub Pages.

## Najważniejsze pliki

- `index.source.html` – czytelna, edytowalna wersja strony,
- `index.html` – wersja zaszyfrowana (podgląd online),
- `js/main.js` – logika quizu i wyniku,
- `js/route-planner.js` – układanie trasy,
- `data/austria-places.json` – baza miejsc,
- `css/style.css` / `scss/` – style.

## Status

To wersja demonstracyjna. StatiCrypt chroni HTML przed przypadkowym podglądem; pliki JS/CSS/JSON w repozytorium nadal są publiczne jak w każdym projekcie na GitHub Pages.
