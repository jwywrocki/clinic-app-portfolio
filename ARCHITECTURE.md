# Clinic App - Architektura

## Cel dokumentu

Ten plik opisuje obecną architekturę projektu, wskazuje kluczowe warstwy i pokazuje realne przepływy danych (render, API, admin, auth, scheduler). Dokument jest zgodny z aktualną strukturą kodu i refaktoryzacją opartą o Clean Architecture.

## Stos technologiczny

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Zod (walidacja danych wejściowych)
- Auth.js (NextAuth v5) z Credentials
- Obsługa wielu backendów DB: Supabase, PostgreSQL, MySQL

## Zasady architektury

- Clear Separation of Concerns
- Clean Architecture (Domain + Repositories + Services + API/UI)
- Result Pattern (brak wyjątków w logice domenowej)
- Thin API layer (mapowanie błędów, walidacja, przekazanie do usług)
- Jest i/lub TypeScript type-check jako strażnik jakości

## Warstwy i odpowiedzialności

### 1) Domain (`/lib/domain`)
Rdzeń domenowy bez zależności infrastrukturalnych.

- Encje i bazowe typy (`entities.ts`)
- Błędy domenowe (`errors.ts`)
- `Result<T>` do obsługi błędów bez wyjątków

### 2) Schemas (`/lib/schemas`)
Jedno źródło prawdy dla walidacji danych wejściowych.

- Zod schemas dla Create/Update
- Typy `Create*Input`/`Update*Input` generowane przez `z.infer`

### 3) Repositories (`/lib/repositories`)
Abstrakcja dostępu do danych.

- Interfejsy repozytoriów
- Implementacje bazowe i domenowe (np. `doctor`, `page`)

### 4) Services (`/lib/services`)
Logika biznesowa i use-case’y. Każda usługa:

- waliduje dane (schemas)
- wykonuje reguły biznesowe
- używa repozytoriów
- zwraca `Result<T>`

Fabryki usług są eksportowane z `@/services` (np. `createPagesService`).

### 5) API (`/app/api` + `/lib/api/helpers.ts`)
Warstwa HTTP z ujednoliconym formatem odpowiedzi.

- `handleApiRequest` mapuje błędy domenowe na HTTP
- Publiczne endpointy: `/api/public/*`
- Admin-only endpointy: `/api/admin/*`

### 6) Admin (`/app/admin`)
Panel wewnętrzny oparty o Server Actions.

- `(dashboard)` jako grupa routów
- `actions/` jako punkty mutacji (create/update/delete)
- `components/` jako UI admina

### 7) UI / Presentation (`/components` + `app/*`)
Komponenty prezentacji i układu.

- Sekcje home, layout, komponenty UI
- Strony publiczne w `app/*`

### 8) Database Layer (`/lib/db`)
Multi-provider backend.

- Auto-detekcja po `DB_CONNECTION`
- Implementacje: `supabase`, `postgres`, `mysql`

Obsługiwane wartości `DB_CONNECTION`:

| Wartość | Backend |
|---|---|
| `supabase` | Supabase JS client |
| `postgres` / `postgresql` / `pgsql` | `pg` driver |
| `mysql` / `mariadb` | `mysql2` driver |
| *(unset)* | auto-detekcja z env |

## Przepływy (Flow)

### 1) Render strony publicznej (SSR)

1. Żądanie trafia do `app/[route]/page.tsx`
2. Komponent serwerowy tworzy serwis przez `createXService()`
3. Serwis pobiera dane przez repozytorium
4. Repozytorium używa `DBClient` (provider zależny od env)
5. Wynik (`Result<T>`) wraca do komponentu
6. Strona renderuje UI

### 2) Zapytanie API

1. Żądanie trafia do `app/api/.../route.ts`
2. `handleApiRequest` opakowuje logikę
3. Serwis zwraca `Result<T>`
4. `Result` jest mapowany na JSON + HTTP status

### 3) Admin – mutacje przez Server Actions

1. Formularz w adminie wywołuje akcję (`app/admin/actions/*`)
2. Action tworzy serwis i wywołuje metodę
3. Serwis waliduje dane (`/lib/schemas`)
4. Repozytorium zapisuje dane
5. `revalidatePath()` odświeża strony zależne

### 4) Auth flow

1. Login w `/admin/login`
2. Auth.js weryfikuje dane i hash (bcrypt + pepper)
3. Sesja JWT (TTL 8h)
4. `middleware.ts` pilnuje dostępu do `/admin/*`

### 5) Scheduler / Cron

1. `lib/scheduler-init.ts` uruchamia scheduler przy starcie
2. `lib/scheduler.ts` rejestruje joby (backup, cleanup)
3. Częstotliwość i enable/disable w `site_settings`

## Struktura projektu

```
app/
  api/                       # Route handlers
    admin/                   # Admin-only
    auth/                    # Auth.js
    public/                  # Public endpoints
  admin/
    (dashboard)/             # Panel admina
    actions/                 # Server Actions
    components/              # UI admina
    login/                   # Login
  [pages]/                   # Strony publiczne
components/
  home/                      # Sekcje home
  layout/                    # Header/Footer
  ui/                        # UI lib
lib/
  api/                       # API helpers
  db/                        # Multi-DB layer
  domain/                    # Domain + Result
  repositories/              # Repo layer
  schemas/                   # Zod schemas
  services/                  # Business logic
  types/                     # Shared types
hooks/
public/
```

## Cross-cutting concerns

- Walidacja wejścia: Zod (`/lib/schemas`)
- Sanityzacja HTML: `lib/html-sanitizer.ts`
- Obsługa błędów: `Result<T>` i mapowanie na HTTP
- Revalidacja cache: `revalidatePath()` po mutacjach
- Security: rate limiting + auth guard w `middleware.ts`

## Deployment

### Zmienne środowiskowe

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://your-domain.pl
NODE_ENV=production

# Database — wybierz provider
DB_CONNECTION=supabase                    # lub postgres / mysql

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:6543/postgres

# MySQL
MYSQL_URL=mysql://user:pass@host:3306/db

# Auth
AUTH_SECRET=...
AUTH_URL=https://your-domain.pl
BCRYPT_SECRET_KEY=...

# Scheduler
SCHEDULER_SECRET_KEY=...
```

### Komendy build/test

```bash
npm run dev            # Dev server (port 4000)
npm run build          # Production build
npm run start          # Production server (port 4000)
npm run lint           # ESLint
npm run lint:fix       # ESLint z autofix
npm run type-check     # TS type-check (no emit)
npm run format         # Prettier
npm run test           # Jest
npm run test:coverage  # Jest + coverage
```
