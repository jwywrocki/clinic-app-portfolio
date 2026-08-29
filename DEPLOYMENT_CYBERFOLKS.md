# Wdrozenie na Cyber_Folks (Node.js + Next.js)

Ten projekt dziala jako Next.js 15 i wymaga stalego procesu Node.js.
Instrukcja ponizej jest dopasowana do panelu DirectAdmin (Aplikacje Node.js).

## 1. Wymagania

- Dostep do panelu glownego konta hostingu (subkonto bez osobnego panelu nie wystarczy).
- Dostep SSH (mocno zalecany).
- Wersja Node.js zgodna z Next 15 (najlepiej 20+).
- Osobna domena/subdomena i osobny katalog aplikacji.

## 2. Konfiguracja aplikacji w panelu

W panelu: Pozostale ustawienia -> Aplikacje Node.js -> Create Application.

Ustaw:
- Node.js version: dostepna wersja 20/22/24.
- Adds value for NODE_ENV variable: `production`.
- Application root: katalog projektu z `package.json`.
- Application URL: domena/subdomena aplikacji.
- Application startup file: `app.js`.

Po utworzeniu aplikacji panel przygotuje srodowisko i wpisy `.htaccess`.

## 3. Wgranie projektu

Wgraj pliki projektu do katalogu `Application root`.

Wymagane sa m.in.:
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- katalogi `app`, `components`, `hooks`, `lib`, `public`
- plik startupowy `app.js`

## 4. Instalacja i build

Po zalogowaniu do wirtualnego srodowiska Node.js przez SSH uruchom (jesli build na serwerze przechodzi):

```bash
npm ci
npm run build
```

Nastepnie uruchom/restartuj aplikacje z panelu (lub odpowiednia opcja restartu procesu).

Jezeli build na serwerze nie przechodzi (brak RAM / Turbopack crash), buduj lokalnie i wgrywaj tylko wynik:

```bash
# lokalnie
npm ci
npm run build:hosting

# wysylka builda
rsync -az --delete -e "ssh -p 222" .next/ enterkom@gozlopuszno.pl:/home/enterkom/domains/gozlopuszno.pl/public_html/.next/

# restart (na serwerze)
ssh -p 222 enterkom@gozlopuszno.pl "cd /home/enterkom/domains/gozlopuszno.pl/public_html && touch tmp/restart.txt"
```

Jesli zmieniasz tylko `.env.local`, nie trzeba robic builda, wystarczy restart.

### Kolejne aktualizacje (rekomendowane)

Przy kazdej aktualizacji aplikacji wykonaj lokalnie:

```bash
git pull
npm ci
npm run build:hosting
```

Nastepnie wyslij build i zrestartuj aplikacje:

```bash
rsync -az --delete -e "ssh -p 222" .next/ enterkom@gozlopuszno.pl:/home/enterkom/domains/gozlopuszno.pl/public_html/.next/
ssh -p 222 enterkom@gozlopuszno.pl "cd /home/enterkom/domains/gozlopuszno.pl/public_html && touch tmp/restart.txt"
```

Jesli zmieniles zaleznosci, wykonaj na serwerze `npm ci --omit=dev`.

## 5. Zmienne srodowiskowe

Ustaw zmienne produkcyjne (na podstawie `.env.example`).
Minimum:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://www.gozlopuszno.pl
AUTH_URL=http://www.gozlopuszno.pl
AUTH_SECRET=...
BCRYPT_SECRET_KEY=...
SCHEDULER_SECRET_KEY=...

# Jedna strategia bazy danych:
DB_CONNECTION=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# lub DB_CONNECTION=postgres + DATABASE_URL
# lub DB_CONNECTION=mysql + MYSQL_URL

# MySQL (socket na Cyber_Folks) - odkomentuj wybrane linie:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_SOCKET=/var/lib/mysql/mysql.sock
# DB_DATABASE=enterkom_goz_node
# DB_USERNAME=enterkom_goz_node
# DB_PASSWORD=twoje_haslo
```

Wazne:
- Nie ustawiaj recznie stalego `PORT` w panelu, jesli hosting nadaje go automatycznie.
- Aplikacja korzysta z `process.env.PORT` dostarczonego przez hosting.
- Dla MySQL na Cyber_Folks preferuj socket (`DB_SOCKET`) zamiast `DB_HOST`/`DB_PORT`.

## 6. Weryfikacja po wdrozeniu

Po pierwszym starcie sprawdz:
- czy strona glowna sie laduje,
- czy dziala logowanie admina,
- czy dzialaja endpointy API,
- czy aplikacja ma prawa zapisu (np. backupy/logi),
- czy polaczenie z baza i SMTP dziala poprawnie.

## 7. Uwagi operacyjne (istotne)

- Projekt ma wbudowany scheduler (`node-cron`).
- Na hostingu wspoldzielonym scheduler zalezy od stalej pracy procesu Node.js.
- Przy mniejszych limitach hostingu rozważ:
  - rzadsze backupy,
  - backup po stronie bazy/hostingu,
  - monitoring zuzycia RAM/CPU.

## 8. Szybka checklista dla administratora hostingu

- Potwierdzenie wersji Node.js 20+.
- Potwierdzenie stalego procesu Node.js (Passenger).
- Potwierdzenie limitow RAM/CPU dla aplikacji SSR.
- Potwierdzenie SSH.
- Potwierdzenie wyjscia sieciowego do bazy i SMTP.
- Potwierdzenie praw zapisu do katalogu aplikacji.
