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

## Najważniejsze pliki

- `index.html` – struktura strony,
- `js/main.js` – logika quizu i generowania wyniku,
- `js/route-planner.js` – układanie trasy,
- `data/austria-places.json` – baza miejsc, zdjęć i czasów przejazdów,
- `css/style.css` / `scss/` – style strony.

## Status

To wersja demonstracyjna przygotowana do prezentacji koncepcji działania planera podróży. Logika trasy i treści są oparte na lokalnych danych i mogą być dalej rozwijane w kolejnych etapach projektu.
