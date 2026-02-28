# KOMPLETNA ANALIZA VREMEPLOV.HR APLIKACIJE

**Datum:** 2026-02-28
**Analizirao:** Claude AI
**Verzija aplikacije:** 1.0.0

---

## SADRŽAJ
1. [Struktura koda i arhitektura](#1-struktura-koda-i-arhitektura)
2. [React Best Practices](#2-react-best-practices)
3. [TypeScript](#3-typescript)
4. [Sigurnost](#4-sigurnost)
5. [Performanse](#5-performanse)
6. [Pristupačnost (A11Y)](#6-pristupačnost-a11y)
7. [SEO](#7-seo)
8. [Error Handling](#8-error-handling)
9. [Testiranje](#9-testiranje)
10. [Prijedlozi za nove funkcionalnosti](#10-prijedlozi-za-nove-funkcionalnosti)
11. [SAŽETAK - Top 10 prioriteta](#sažetak---top-10-prioritetnih-poboljšanja)

---

## 1. STRUKTURA KODA I ARHITEKTURA

### ✅ Što je dobro napravljeno

- **Organizacija foldera** je logična i skalabilna: `components/`, `pages/`, `services/`, `hooks/`, `contexts/`, `utils/`, `types/`, `constants/`, `locales/` - svaki folder ima jasnu odgovornost
- **Razdvajanje servisa** je odlično: `services/photo/` (5 datoteka), `services/user/` (8 datoteka), `services/story/` - granularna podjela po domeni
- **Custom hookovi** su dobro izdvojeni: `usePhotoDetails`, `useFileUpload`, `useRateLimit`, `useDebounce`, `usePhotoFilters` - logika je odvojena od prezentacije
- **Admin komponente** su dobro grupirane u `admin/cards/` i `admin/tabs/` - čista separacija admin funkcionalnosti
- **Konteksti** su pravilno razdvojeni: `AuthContext`, `LanguageContext`, `ThemeContext` - svaki ima jednu odgovornost
- **UI komponente** koriste shadcn/ui (Radix) što osigurava konzistentnost i pristupačnost
- **Barrel exports** (`index.ts`) u `PhotoDetails/`, `PhotoUpload/`, `UserProfile/` za čist import
- **Vite path aliasi** (`@/`) za čiste importove umjesto relativnih putanja

### ⚠️ Što treba poboljšati

- **PhotoUpload.tsx (673 linija)** - prevelika komponenta, miješa logiku uploada, adrese, tagiranja i forme. Iako su neki dijelovi već izdvojeni (AddressAutocomplete, ManualLocationPicker, LocationConfirmation), sama glavna komponenta je još uvijek masivna
- **MapView.tsx (578 linija)** - kombinira dohvat podataka, filtriranje, klasteriranje, renderanje mape i grid prikaz fotografija u jednoj komponenti
- **PhotoComments.tsx (433 linija)** - miješa formu za komentare, listu komentara, rate limiting i notifikacije
- **Location.tsx (843 linija)** - stranica radi previše: filtriranje, upload modal, story modal, tab navigacija, paginacija
- **Duplicirani formatDate pattern** - identična `formatDate(timestamp: any)` funkcija postoji u `Stories.tsx`, `StoryDetails.tsx`, `LatestStories.tsx`, `StoryModerationTab.tsx`
- **Dvostruki Toaster** u `App.tsx` (linija 1-2) - importira i `Toaster` i `Sonner` iz istog paketa
- **Nekonzistentno imenovanje** - mix camelCase i PascalCase za neke utility funkcije; `Index.tsx` vs `NotFound.tsx` za stranice
- **firebase-admin u frontend dependencies** - `firebase-admin` (server-side SDK) je u package.json kao dependency frontenda, iako se koristi samo u scripts/

### 🔧 Konkretne preporuke

1. Razbiti `PhotoUpload.tsx` na: `PhotoUploadForm` (orchestrator), `PhotoUploadImageSection`, `PhotoUploadMetadata`, `PhotoUploadSubmitHandler` (hook)
2. Razbiti `MapView.tsx` na: `MapViewContainer` (state), `MapLeafletRenderer`, `MapPhotoGrid`, `MapStatistics`
3. Razbiti `PhotoComments.tsx` na: `CommentForm`, `CommentList`, `CommentItem`
4. Izdvojiti `formatDate` u `utils/dateUtils.ts` kao centraliziranu funkciju s proper Timestamp tipom
5. Ukloniti dupli Toaster - koristiti samo jedan
6. Premjestiti `firebase-admin` u devDependencies ili u `functions/package.json`
7. Razmotriti uvođenje feature-based strukture za veće cjeline (`features/photos/`, `features/stories/`)

### 📊 Prioritet: **SREDNJI**

---

## 2. REACT BEST PRACTICES

### ✅ Što je dobro napravljeno

- **Lazy loading ruta** - sve stranice koriste `React.lazy()` s `Suspense` fallbackom (App.tsx linije 14-30)
- **QueryClient konfiguracija** je optimizirana: `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false` - smanjuje nepotrebne Firestore upite
- **ErrorBoundary** na root razini s podrškom za chunk error detekciju i auto-reload
- **useLayoutEffect** za mjerenje header visine (PageHeader.tsx) - ispravan izbor za DOM mjerenja
- **useCallback** za toggle funkcije (PageHeader.tsx)
- **IntersectionObserver** u LazyImage za lazy loading slika s proper cleanup
- **Cleanup funkcije u useEffect** su konzistentne - event listeneri se pravilno uklanjaju (PageHeader, OfflineIndicator, PhotoUpload, NotificationBell)
- **URL.revokeObjectURL** se ispravno poziva pri unmount (PhotoUpload, useFileUpload)
- **Firestore unsubscribe** u NotificationBell se pravilno čisti putem useRef
- **React.memo** na PhotoGrid komponenti za sprečavanje nepotrebnih re-rendera
- **Optimistic updates** za like funkcionalnost s rollback mehanizmom (usePhotoDetails)

### ⚠️ Što treba poboljšati

- **Props drilling** u PageHeader - prosljeđuje funkcionalnosti kroz 6+ child komponenti (SearchBar, NotificationBell, UserProfile, LanguageSelector, ThemeToggle, AuthButton)
- **PhotoUpload ima 12+ useState poziva** - kompleksna forma bi trebala koristiti `useReducer`
- **Location.tsx ima 15+ useState poziva** - previše stanja u jednoj komponenti
- **useEffect bez AbortController-a** - async operacije u useEffect (Location.tsx, usePhotoDetails) nemaju mehanizam za prekidanje pri unmount
- **React.memo nedostaje** na većini child komponenti koje primaju callback propse - `NotificationCenter`, `LanguageSelector`, `ThemeToggle`
- **useMemo nedostaje** za skupe kalkulacije - `Location.tsx` filtriranje fotografija moglo bi koristiti useMemo
- **Dupliciran rendering nav linkova** - PageHeader renderira desktop i mobile navigaciju s dupliciranim link definicijama
- **State koji duplicira props** - PhotoGrid kopira `photos` prop u lokalni state `photosState`, trebao bi koristiti prop direktno

### 🔧 Konkretne preporuke

1. Zamijeniti višestruke `useState` u PhotoUpload i Location s `useReducer` za upravljanje složenim stanjem forme
2. Dodati `AbortController` u useEffect pozive koji rade fetch operacije:
   - `usePhotoDetails` - loadPhotoData
   - `Location.tsx` - loadPhotos, loadStories
3. Dodati `React.memo` na child komponente koje primaju stabilne propse: `NotificationCenter`, `LanguageSelector`, `ThemeToggle`
4. Izdvojiti nav link definicije u konstantu i koristiti jednu petlju za desktop i mobile
5. U PhotoGrid, koristiti prop `photos` direktno umjesto kopiranja u lokalni state
6. Razmotriti context za PageHeader toolbar items umjesto props drillinga

### 📊 Prioritet: **SREDNJI**

---

## 3. TYPESCRIPT

### ✅ Što je dobro napravljeno

- **Strict mode omogućen** u tsconfig.json s `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Centralizirani tipovi** u `src/types/` - `firebase.ts`, `user.types.ts`, `json.d.ts`, `service-worker.d.ts`
- **Type guards** za error handling: `isFirebaseError()`, `getErrorMessage()`, `getErrorCode()` u `types/firebase.ts`
- **Domain interfaces** su kompletni: `Photo` (15+ property-ja), `Comment`, `TaggedPerson`, `Story`, `UserDocument`, `UserLike`
- **Generički tipovi**: `WithId<T>`, `TypedDocumentSnapshot<T>`, `FirebaseTimestamp`
- **User tier sustav** s enumima i konstantama za tier-based ograničenja
- **Notification tipovi** koriste literal union types za 28+ vrsta notifikacija
- **Service sloj** ima 92%+ pokrivenost explicit return tipova
- **Path aliasi** konfigurirani u tsconfig i vite.config za `@/`

### ⚠️ Što treba poboljšati

- **14 `any` tipova** u produkcijskom kodu:
  - `formatDate(timestamp: any)` ponavlja se u 4 datoteke - treba `Timestamp | null`
  - `t: any` za translation funkciju u 4 datoteke - treba definirati `TranslationFn` tip
  - `photoData: any` u PhotoUpload.tsx:305 - treba definirati proper interface
  - `icon: any` u filters.ts i userProfileHelpers.ts - treba `React.ReactNode` ili `LucideIcon`
- **10 `as any` type assertion-a**:
  - `(window as any).__likesModalDebug` u LikesModal.tsx (3x) - debug kod koji ne bi trebao biti u produkciji
  - `(error as any)?.code` u PhotoUpload.tsx - treba type guard
  - `null as any` u imageOptimization.ts - treba `null as unknown`
  - `(L.Icon.Default.prototype as any)._getIconUrl` - Leaflet workaround, ali treba komentar
- **Catch blokovi s `error: any`** umjesto `error: unknown` na 4 mjesta
- **Nedostaje zajednički tip** za komponentne propse koji dijele sličnu strukturu (photo card props, filter props)

### 🔧 Konkretne preporuke

1. Kreirati `TranslationFn` tip: `type TranslationFn = (key: string, params?: Record<string, string | number>) => string` i zamijeniti sve `t: any`
2. Kreirati `TimestampFormatter` tip i centralizirati `formatDate` u `dateUtils.ts`
3. Zamijeniti `photoData: any` u PhotoUpload.tsx s proper `Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>` interfaceom
4. Zamijeniti `icon: any` s `React.ComponentType<{ className?: string }>` ili importirati `LucideIcon` tip
5. Ukloniti `(window as any).__likesModalDebug` - to je debug kod koji ne pripada produkciji
6. Zamijeniti sve `catch (error: any)` s `catch (error: unknown)` i koristiti type guard

### 📊 Prioritet: **NIZAK** (TypeScript je generalno dobro implementiran)

---

## 4. SIGURNOST

### ✅ Što je dobro napravljeno

- **Firebase konfiguracija** koristi environment varijable (`import.meta.env.VITE_*`) - nema hardkodiranih ključeva
- **Firestore Security Rules** su detaljno napisane (352 linije) s helper funkcijama `isAdmin()`, `isAuthenticated()`, `isOwner()`
- **Zaštita admin polja** - korisnici ne mogu mijenjati `isAdmin`, `isBanned`, `uid` na svojim dokumentima
- **Like/view validacija** u pravilima - likes se mogu mijenjati samo za +1/-1
- **Storage rules** s ograničenjima: samo JPEG/PNG/WebP (bez GIF), max 10MB, filename regex za sprečavanje path traversal-a
- **HSTS header** s max-age od 1 godine
- **X-Frame-Options: DENY** - zaštita od clickjacking-a
- **X-Content-Type-Options: nosniff** - sprečava MIME sniffing
- **CSP upgrade-insecure-requests** u index.html
- **Input validacija** na svim formama: maxLength ograničenja, server-side validacija veličine teksta u Firestore pravilima
- **Nema `dangerouslySetInnerHTML`** nigdje u kodu
- **Filename sanitizacija** pri uploadu s regex validacijom
- **Rate limiting** implementiran na komentare (20/min, 100/sat, 500/dan), tagove (10/sat, 20/dan) i uploadove
- **CORS konfiguracija** ograničava origin na `vremeplov.hr` i `localhost:5173`
- **Admin session** koristi `browserSessionPersistence` - ne perzistira nakon zatvaranja preglednika
- **.gitignore** ispravno isključuje `.env`, `serviceAccountKey.json` i sve osjetljive datoteke
- **Deny-all pravilo** na kraju Firestore rules za sve nedefinirane kolekcije

### ⚠️ Što treba poboljšati

- **userLikes kolekcija ima javni pristup čitanju** (`allow get, list: if true`) - svatko može vidjeti tko je što lajkao, što je problem privatnosti. Isto vrijedi za `storyLikes`
- **Nedostaje kompletna CSP politika** - samo `upgrade-insecure-requests`, nema `script-src`, `style-src`, `img-src` direktiva
- **Client-side rate limiting** (localStorage) se lako zaobilazi - korisnik može obrisati localStorage ili koristiti Incognito mod. Pravo rate limiting treba biti na server-side (Cloud Functions)
- **Admin email hardkodiran** kao fallback: `VITE_ADMIN_EMAIL || 'vremeplov.app@gmail.com'` u authService.ts - admin email je vidljiv u build outputu
- **Legacy `isAdmin()` metoda** (email-based check) još postoji uz Firestore-based check - mogući vektor napada ako se koristi umjesto Firestore provjere
- **Query limit 100** na više kolekcija - korisnik može ponovljeno slati upite do 100 dokumenata i prikupiti sve podatke
- **firebase.json** koristi `firestore.rules` i za Firestore I za Storage - trebali bi biti razdvojeni
- **CSRF zaštita** u `securityMiddleware.ts` koristi `btoa(Date.now() + Math.random())` - to nije kriptografski siguran token
- **Security middleware `useSecurityCheck`** definira se kao hook ali koristi `new Promise(async (resolve) => ...)` anti-pattern

### 🔧 Konkretne preporuke

1. Ograničiti pristup `userLikes` i `storyLikes` kolekcijama - čitanje samo za vlasnike ili autentificirane korisnike
2. Dodati kompletnu CSP politiku u firebase.json headere: `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' firebasestorage.googleapis.com`
3. Implementirati server-side rate limiting kroz Cloud Functions umjesto client-side localStorage
4. Ukloniti hardkodirani fallback admin email i legacy `isAdmin()` metodu - koristiti isključivo Firestore provjeru
5. Razdvojiti `storage.rules` u zasebnu datoteku umjesto dijeljenja s `firestore.rules`
6. Zamijeniti `btoa()` CSRF token s `crypto.getRandomValues()` za kriptografski siguran token
7. Popraviti `useSecurityCheck` - ukloniti `new Promise(async ...)` anti-pattern

### 📊 Prioritet: **VISOK** (posebno javni pristup likes kolekciji i nedostatak server-side rate limitinga)

---

## 5. PERFORMANSE

### ✅ Što je dobro napravljeno

- **Route-based code splitting** - sve stranice koriste `React.lazy()` (App.tsx linije 14-30)
- **Component-level lazy loading** - Index.tsx lazy-loada FeatureCard, SampleGallery, LatestStories, Footer
- **Vite manual chunks** za granularno splitanje: React, Firebase (4 chunka), UI biblioteke, mape, routing
- **Terser minifikacija** s 2-pass kompresijom, uklanjanjem console.log u produkciji
- **LazyImage komponenta** s IntersectionObserver, responsive images (`<picture>` s WebP/JPEG), priority loading za above-fold
- **Image compression** na klijentu prije uploada: resize na 2400px max, WebP format, kvaliteta 0.85-0.90
- **Generiranje višestrukih veličina** slika: 800w, 1200w, 1600w u WebP i JPEG
- **Firestore caching** - 5min cache na foto upite s automatskim cleanupom svakih 10min
- **React Query** s 5min staleTime i 30min gcTime - smanjuje nepotrebne refetcheve
- **Preconnect hintovi** za Firebase, Google APIs i OpenStreetMap tile servere
- **Service Worker** s cache strategijama: network-first za navigaciju, cache-first za statičke resurse
- **Firebase chunk splitting** (app, firestore, auth, storage zasebno) - loadaju se samo kad trebaju
- **Deferred Firebase inicijalizacija** putem `requestIdleCallback` - ne blokira prvi render
- **Paginacija** u photo service-u s cursor-based pristupom (`startAfter()`)
- **Paralelni upload** svih varijanti slike (`Promise.all`) - 3x brže od sekvencijalnog

### ⚠️ Što treba poboljšati

- **MapView učitava sve fotografije odjednom** (`photoService.getAllApprovedPhotos()`) do 500 - za veći broj fotografija to će biti problem
- **Leaflet biblioteka** (200KB+) se učitava za MapView čak i kad korisnik ne koristi mapu - trebala bi biti lazy loaded
- **Nema virtualnog scrollanja** na dugim listama fotografija - renderaju se svi elementi odjednom
- **Preconnect hintova previše** (16) u index.html - browser ignorira hint-ove iznad 6-8, što smanjuje efektivnost
- **`dotenv` u frontend dependencies** - nepotreban jer Vite ima built-in .env podršku
- **`next-themes` u dependencies** - ali koristi se custom ThemeContext, `next-themes` je vjerovatno neiskorišten
- **Service Worker VERSION** hardkodiran - Vite plugin ga zamjenjuje ali sam SW ima `const VERSION = '2.0.0'` koji se može zaboraviti ažurirati
- **Chunk size warning limit** postavljen na 1000KB - previsoko, trebalo bi biti default 500KB za brže učitavanje
- **Nema kompresije teksta** - nedostaje gzip/brotli konfiguracija (Firebase Hosting automatski radi kompresiju, ali vrijedi provjeriti)
- **Nema preload za kritične resurse** - font ili critical CSS bi mogli imati `<link rel="preload">`

### 🔧 Konkretne preporuke

1. Implementirati paginaciju za MapView umjesto učitavanja svih fotografija - ili koristiti geohash-based upite za učitavanje samo vidljive regije
2. Lazy-loadati Leaflet samo kad korisnik otvori `/map` stranicu (već je route lazy, ali leaflet se importa statički u MapView)
3. Dodati virtualni scroll (react-window ili @tanstack/virtual) za dugačke liste fotografija na Location stranici
4. Smanjiti preconnect hintove na 6-8 kritičnih (Firebase, Storage, Auth) - ukloniti OSM tile preconnecte jer nisu kritični za prvi render
5. Ukloniti `dotenv` i `next-themes` iz dependencies - nepotrebne u projektu
6. Smanjiti chunk size warning limit na 500KB da se identificiraju preveliki chunkovi
7. Dodati `<link rel="preload">` za kritični font ako se koristi custom font

### 📊 Prioritet: **SREDNJI** (aplikacija je već dobro optimizirana, ali MapView i virtualni scroll su važni za skalabilnost)

---

## 6. PRISTUPAČNOST (A11Y)

### ✅ Što je dobro napravljeno

- **Alt tekstovi na slikama** - LazyImage zahtijeva `alt` prop, PhotoGrid koristi `photo.description` kao alt
- **ARIA atributi u SearchBar** - `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `role="listbox"`, `role="option"`, `aria-selected`
- **ARIA labeli na navigaciji** - `aria-label="Natrag"`, `aria-label` na nav linkovima, `aria-label` na hamburger meniju
- **Keyboard navigacija** - Escape zatvara mobile menu i search dropdown, Enter submitta formu
- **Form labeli** - sve forme imaju `<label>` elemente s proper asocijacijom
- **Minimalna touch target veličina** - `min-h-[44px] min-w-[44px]` na interaktivnim elementima u PhotoGrid (WCAG 2.1 Level AA)
- **Dark mode podrška** s proper kontrastom - svi tekst elementi imaju `dark:` varijante
- **Semantički HTML** - `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` elementi
- **Loading stanja** - jasni indikatori učitavanja s tekstualnim opisom
- **Screen reader skriveni naslovi** - `sr-only` klasa na DialogTitle za modalne dijaloge
- **HTML lang atribut** postavljen na `hr`
- **Ikone skrivene od screen readera** - `aria-hidden="true"` na dekorativnim ikonama

### ⚠️ Što treba poboljšati

- **Focus visible stilovi uklonjeni** na SearchBar inputu: `focus-visible:ring-0 focus-visible:ring-offset-0` - keyboard korisnici ne mogu vidjeti fokus
- **Skip to main content link** ne postoji - keyboard korisnici moraju prolaziti kroz cijelu navigaciju
- **Nema aria-live regija** za dinamičke promjene sadržaja (učitavanje fotografija, toast notifikacije)
- **Karta (MapView)** nema keyboard navigaciju - Leaflet markeri nisu dostupni tipkovnicom
- **Photo grid** nema `role="list"` i `role="listitem"` - screen readeri ne prepoznaju strukturu
- **Nedostaje alt na nekim slikama** - avatar slike i dekorativne slike u admin panelu
- **Kontrast boja** - `text-gray-400` na `bg-white` ne zadovoljava WCAG AA standarde (4.5:1 ratio)
- **Heading hijerarhija** - neke stranice preskaču razine (h1 → h3 bez h2)

### 🔧 Konkretne preporuke

1. Dodati vidljivi focus indikator na SearchBar input - zamijeniti `focus-visible:ring-0` s `focus-visible:ring-2 focus-visible:ring-blue-500`
2. Dodati "Skip to main content" link na vrh svake stranice
3. Dodati `aria-live="polite"` regiju za dinamičke promjene sadržaja (učitavanje, greške)
4. Dodati `role="list"` na photo grid container i `role="listitem"` na svaku fotografiju
5. Provjeriti i popraviti kontrast - koristiti minimalno `text-gray-600` umjesto `text-gray-400` na bijeloj pozadini
6. Osigurati pravilnu heading hijerarhiju na svim stranicama (h1 → h2 → h3, bez preskakanja)
7. Dodati alt tekst na avatar slike: `alt={user.displayName || 'Korisnički avatar'}`

### 📊 Prioritet: **SREDNJI** (osnove su pokrivene, ali focus visibility i skip link su važni za pristupačnost)

---

## 7. SEO

### ✅ Što je dobro napravljeno

- **Meta tagovi** - kompletni u index.html: title, description, keywords, author, robots
- **Open Graph tagovi** - og:title, og:description, og:type, og:url, og:image s dimenzijama, og:locale, og:site_name
- **Twitter Card tagovi** - summary_large_image, title, description, image
- **Structured Data (JSON-LD)** - WebApplication schema s name, description, url, applicationCategory
- **SEO komponenta** (`SEO.tsx`) za dinamičke meta tagove po stranici s canonical URL-om
- **Sitemap.xml** - 8 ruta s prioritetima i change frequency
- **Robots.txt** - dopušta sve botove s referencom na sitemap
- **Canonical URL** - dinamički postavljen po stranici
- **Article-specific OG tagovi** za photo stranice (author, publishedTime)
- **PWA manifest** - kompletni podaci za instalaciju
- **Favicon varijante** - ico, png 16x16, png 32x32, png 180x180 (iOS), png 192x192, png 512x512

### ⚠️ Što treba poboljšati

- **SPA bez SSR/prerendering-a** - Google može indeksirati SPA ali s kašnjenjem i nepouzdanošću. Kritični sadržaj (fotografije, lokacije) se renderira samo na klijentu
- **Sitemap je statički** - sadrži samo 8 osnovnih ruta, nema dinamičkih ruta za lokacije (`/location/Zagreb`), fotografije (`/photo/123`) ili profile
- **og:image je generički** (`icon-512.png`) - photo stranice bi trebale imati thumbnail fotografije kao og:image
- **Nema hreflang tagova** - aplikacija podržava hr i en ali nema `<link rel="alternate" hreflang="...">` za Google
- **Heading hijerarhija** nije uvijek pravilna - neke stranice nemaju h1 ili preskaču razine
- **Nema breadcrumb strukturiranih podataka** za lokacijske stranice
- **URL struktura** - `/location/Zagreb` je dobra ali `/photo/abc123` s Firebase ID-em nije SEO-friendly
- **Nema meta description** za dinamičke stranice korisničkih profila

### 🔧 Konkretne preporuke

1. Razmotriti prerendering (npr. `vite-plugin-prerender` ili `react-snap`) za ključne stranice (/, /about, /map, popularne lokacije) - dramatično bi poboljšalo indeksiranje
2. Generirati dinamički sitemap s Cloud Function koji uključuje sve lokacije i odobrane fotografije
3. Koristiti thumbnail fotografije kao og:image na photo detail stranicama
4. Dodati hreflang tagove za hr i en varijante
5. Dodati BreadcrumbList strukturirane podatke za lokacijske stranice: Početna > Lokacija > Grad
6. Razmotriti slug-based URL-ove umjesto Firebase ID-ova: `/photo/zagreb-trg-1960` umjesto `/photo/abc123`
7. Dodati ImageObject strukturirane podatke za fotografije s datumom, lokacijom i autorom

### 📊 Prioritet: **SREDNJI-VISOK** (SEO osnove su odlične, ali nedostatak SSR/prerendering-a i dinamičkog sitemapa ograničava vidljivost)

---

## 8. ERROR HANDLING

### ✅ Što je dobro napravljeno

- **ErrorBoundary** na root razini s 3 varijante UI-a: full page error, inline error, chunk error s auto-reloadom
- **Chunk error detekcija** - sofisticiran pattern matching za Vite dynamic import greške s auto-reloadom i zaštitom od infinite loop-a
- **Global error handleri** u main.tsx - `window.addEventListener('error')` i `window.addEventListener('unhandledrejection')` za chunk errore
- **Toast notifikacije** (Sonner) za sve korisničke greške - konzistentni i lokalizirani
- **Type-safe error handling** s type guardima: `isFirebaseError()`, `getErrorMessage()`, `getErrorCode()`
- **Graceful degradation** u servisima - ne-kritične operacije (aktivnost, notifikacije) failaju tiho bez prekidanja glavne operacije
- **Firestore permission denied** handling s korisničkom porukom i navigacijom na početnu
- **Auth error filtriranje** - `popup-closed-by-user` i `cancelled-popup-request` se ignoriraju (ne prikazuju error)
- **Loading stanja** su konzistentno implementirana na svim stranicama i komponentama
- **Offline detekcija** - `OfflineIndicator` komponenta prati online/offline status
- **Optimistic update s rollback** za like funkcionalnost - vraća originalno stanje pri grešci

### ⚠️ Što treba poboljšati

- **Nema centraliziranog error logginga** - greške se logiraju samo u console.error koji se uklanja u produkciji (terser `drop_console: true`). Stvarne produkcijske greške se gube
- **Nema error tracking servisa** (Sentry, LogRocket, Bugsnag) - ne postoji način za praćenje grešaka u produkciji
- **Async operacije bez AbortController-a** - ako korisnik navigira sa stranice dok se podaci učitavaju, setState se može pozvati na unmounted komponenti
- **Console.error u catch blokovima** se uklanja u produkciji - greške su nevidljive
- **Nema retry logike** za mrežne greške - ako Firestore upit faila, korisnik mora ručno refreshati
- **Error details vidljivi korisnicima** - ErrorBoundary prikazuje stack trace u detaljima, što je sigurnosni rizik u produkciji
- **Nema structured logging-a** - sve greške koriste `console.error` bez konteksta, timestamp-a ili korerelacijskog ID-a
- **Nema fallback za karte** - ako Leaflet faila, nema graceful fallback

### 🔧 Konkretne preporuke

1. Integrirati Sentry (besplatan tier) za error tracking u produkciji - kritično za praćenje stvarnih grešaka
2. Implementirati retry logiku za mrežne greške s eksponencijalnim backoff-om (React Query već ima retry: 1, ali specifični servisi nemaju)
3. Sakriti stack trace u produkciji u ErrorBoundary - prikazati samo u development modu
4. Dodati AbortController u sve useEffect pozive koji rade async operacije
5. Kreirati centralizirani error logger koji radi i u produkciji (Sentry ili custom endpoint)
6. Dodati ErrorBoundary na razini pojedinih sekcija (mapa, komentari, foto grid) za granularnije hvatanje grešaka

### 📊 Prioritet: **VISOK** (nedostatak error tracking-a u produkciji je kritičan)

---

## 9. TESTIRANJE

### ✅ Što je dobro napravljeno

- **TEST_CHECKLIST.md** postoji - pokazuje svjesnost o potrebi testiranja
- **Utility funkcije** su dobro izolirane i testabilne (dateUtils, photoFilters, imageCompression, locationUtils, photoUploadValidation)
- **Custom hookovi** su izdvojeni iz komponenti što ih čini testabilnima
- **Service sloj** je u singleton pattern-u s jasnim API-em koji se lako mockira

### ⚠️ Što treba poboljšati

- **NEMA NIJEDNOG TESTA** - 0 test datoteka u cijelom projektu
- **Test skripta** u package.json: `"test": "echo \"Error: no test specified\" && exit 1"` - bukvalno nema testnog frameworka
- **Nema testnog frameworka** - ni Jest, ni Vitest, ni React Testing Library, ni Cypress
- **Nema mocking infrastrukture** za Firebase servise
- **0% test coverage** na 173 izvorne datoteke

### 🔧 Konkretne preporuke

1. Postaviti **Vitest** (kompatibilan s Vite) + **React Testing Library** + **@testing-library/user-event**
2. Prioritetne datoteke za testiranje:
   - **Unit testovi**: `utils/dateUtils.ts`, `utils/photoFilters.ts`, `utils/photoUploadValidation.ts`, `utils/locationUtils.ts`, `utils/imageCompression.ts`
   - **Hook testovi**: `hooks/useRateLimit.ts`, `hooks/usePhotoFilters.ts`, `hooks/useFileUpload.ts`, `hooks/useDebounce.ts`
   - **Service testovi** (s Firebase mockovima): `services/authService.ts`, `services/photo/photoService.ts`, `services/photo/likeService.ts`
   - **Komponenta testovi**: `ErrorBoundary.tsx`, `LazyImage.tsx`, `SearchBar.tsx`, `PhotoGrid.tsx`
3. Postaviti **Playwright** ili **Cypress** za E2E testove kritičnih korisničkih tokova:
   - Prijava s Google-om
   - Upload fotografije
   - Pretraživanje lokacija
   - Lajkanje fotografije
   - Ostavljanje komentara
4. Dodati test coverage reporting i postaviti minimalni prag (npr. 60%)
5. Dodati test skriptu u package.json i CI/CD pipeline

### 📊 Prioritet: **VISOK** (potpuni nedostatak testova je veliki rizik za održivost projekta)

---

## 10. PRIJEDLOZI ZA NOVE FUNKCIONALNOSTI

### Funkcionalnosti za korisničko iskustvo

1. **"Tada i sada" usporedba** - split-screen prikaz stare fotografije i suvremene fotografije iste lokacije. Korisnici bi mogli uploadati modernu sliku za usporedbu. Ovo bi bio viralni sadržaj za društvene mreže
2. **Interaktivna vremenska crta** - klizač po godinama na lokacijskoj stranici koji dinamički filtrira fotografije i pokazuje kako se mjesto mijenjalo kroz desetljeća
3. **Kolekcije/Albumi** - korisnici mogu kreirati tematske kolekcije fotografija (npr. "Zagrebački tramvaji kroz povijest", "Dubrovačke zidine")
4. **Komentari na specifični dio fotografije** - mogućnost ostavljanja komentara vezanih za određeni dio slike (poput Figma komentara)
5. **Kolorizacija fotografija** - AI-based kolorizacija crno-bijelih fotografija putem integracije s Palette.fm ili sličnim API-em

### Funkcionalnosti za engagement

6. **Izazovi/Challenges** - mjesečni izazovi poput "Pronađi najstariju fotografiju svog grada" ili "Fotografiraj isto mjesto danas" - s nagradama i leaderboard-om
7. **Digitalna šetnja** - povezivanje fotografija na karti u šetačku rutu kroz povijesne lokacije grada, s navigacijom od točke do točke
8. **Dijeljenje na društvene mreže** - gumb za dijeljenje s automatski generiranom slikom (og:image) koja uključuje staru fotografiju, lokaciju i godinu
9. **Weekly digest email** - tjedni email s najzanimljivijim fotografijama iz korisnikovih praćenih lokacija
10. **Gamifikacija** - proširiti badge sustav s quest-ovima: "Uploadaj fotografiju iz svake županije", "Dobij 100 lajkova na jednu fotografiju"

### Tehničke funkcionalnosti

11. **Error monitoring** - integracija Sentry-ja za praćenje produkcijskih grešaka (prioritetno)
12. **Analytics dashboard** - Firebase Analytics ili Plausible za praćenje korisničkog ponašanja, najpopularnijih lokacija, vremenskih trendova
13. **CDN za slike** - koristiti Cloudinary ili imgix za on-the-fly transformacije slika umjesto generiranja varijanti pri uploadu
14. **Full-text search** - integracija Algolia ili Meilisearch za brzo pretraživanje fotografija po opisu, lokaciji, autoru
15. **Push notifikacije** - Web Push API za obavijesti o novim fotografijama na praćenim lokacijama
16. **Automated backups** - scheduled Cloud Function za backup Firestore podataka
17. **Rate limiting na Cloud Functions** - premjestiti rate limiting logiku na server-side za pouzdaniju zaštitu
18. **Image moderation AI** - Google Cloud Vision API za automatsku detekciju neprikladnog sadržaja prije admin odobravanja

### 📊 Prioritet po kategorijama:
- **Visok**: Error monitoring (Sentry), Analytics, Server-side rate limiting
- **Srednji**: "Tada i sada", vremenska crta, dijeljenje na mreže, push notifikacije
- **Nizak**: Kolorizacija, digitalna šetnja, kolekcije, CDN

---

## SAŽETAK - Top 10 prioritetnih poboljšanja

| # | Poboljšanje | Kategorija | Prioritet | Utjecaj |
|---|------------|-----------|----------|---------|
| **1** | **Postaviti testni framework (Vitest) i napisati testove za utility funkcije i servise** | Testiranje | VISOK | Sprečava regresije, omogućava siguran refactoring |
| **2** | **Integrirati Sentry za error tracking u produkciji** | Error Handling | VISOK | Trenutno su produkcijske greške nevidljive (console.error se uklanja) |
| **3** | **Ograničiti javni pristup userLikes/storyLikes kolekcijama** | Sigurnost | VISOK | Zaštita privatnosti korisnika - trenutno svatko vidi tko je što lajkao |
| **4** | **Razbiti prevelike komponente (PhotoUpload 673L, MapView 578L, Location 843L)** | Arhitektura | SREDNJI | Poboljšava održivost, čitljivost i testabilnost |
| **5** | **Implementirati server-side rate limiting (Cloud Functions)** | Sigurnost | SREDNJI-VISOK | Client-side rate limiting se zaobilazi brisanjem localStorage |
| **6** | **Dodati prerendering za ključne stranice** | SEO | SREDNJI-VISOK | Dramatično poboljšava indeksiranje od strane pretraživača |
| **7** | **Centralizirati formatDate i zamijeniti `any` tipove** | TypeScript | SREDNJI | Eliminira code duplication i poboljšava type safety |
| **8** | **Dodati focus visible stilove i skip-to-content link** | Pristupačnost | SREDNJI | Osigurava pristupačnost za keyboard korisnike |
| **9** | **Implementirati paginaciju za MapView i virtualni scroll** | Performanse | SREDNJI | Kritično za skalabilnost s rastućim brojem fotografija |
| **10** | **Generirati dinamički sitemap s Cloud Function** | SEO | SREDNJI | Uključuje sve lokacije i fotografije za bolje indeksiranje |

---

### Ukupna ocjena projekta

| Kategorija | Ocjena | Komentar |
|-----------|--------|---------|
| Struktura i arhitektura | 7.5/10 | Dobra osnova, ali prevelike komponente |
| React Best Practices | 8/10 | Odličan lazy loading i cleanup, ali nedostaje React.memo |
| TypeScript | 8.5/10 | Strict mode, centralizirani tipovi, minor `any` problemi |
| Sigurnost | 7/10 | Solidne Firestore rules, ali javni likes i client-side rate limiting |
| Performanse | 8.5/10 | Odlična optimizacija, code splitting, image optimization |
| Pristupačnost | 7/10 | ARIA atributi postoje, ali nedostaje focus i skip link |
| SEO | 8/10 | Kompletni meta tagovi, ali nedostaje SSR i dinamički sitemap |
| Error Handling | 6.5/10 | Dobar ErrorBoundary, ali nema error tracking u produkciji |
| Testiranje | 1/10 | Potpuni nedostatak testova |
| **UKUPNO** | **7.2/10** | **Solidna aplikacija s dobrom arhitekturom, ali kritični nedostaci u testiranju i error trackingu** |

---

*Ova analiza je generirana na temelju pregleda 173+ izvornih datoteka projekta Vremeplov.hr.*
