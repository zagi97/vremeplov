# Vremeplov.hr - Test Checklist pred launch

Datum testiranja: _______________
Tester: _______________

---

## 1. PERFORMANCE TESTIRANJE

### PageSpeed Insights (https://pagespeed.web.dev/)

Testiraj: `https://vremeplov.hr`

| Metrika | Mobile | Desktop | Cilj |
|---------|--------|---------|------|
| Performance Score | ___ | ___ | >70 |
| LCP (Largest Contentful Paint) | ___s | ___s | <2.5s |
| FID (First Input Delay) | ___ms | ___ms | <100ms |
| CLS (Cumulative Layout Shift) | ___ | ___ | <0.1 |
| FCP (First Contentful Paint) | ___s | ___s | <1.8s |
| TTFB (Time to First Byte) | ___ms | ___ms | <800ms |

**Zabilježi probleme koje PageSpeed prijavi:**
- [ ] _______________________________________________
- [ ] _______________________________________________
- [ ] _______________________________________________

---

## 2. AUTENTIFIKACIJA

### 2.1 Google Login - Novi korisnik
- [ ] Otvori https://vremeplov.hr u incognito modu
- [ ] Klikni "Prijava" / "Login"
- [ ] Odaberi Google račun koji NIKAD nije korišten na stranici
- [ ] Provjeri: Kreira li se profil automatski?
- [ ] Provjeri: Preusmjerava li na homepage nakon logina?
- [ ] Provjeri: Vidi li se ime/avatar u headeru?

### 2.2 Google Login - Postojeći korisnik
- [ ] Odjavi se
- [ ] Prijavi se ponovo s istim računom
- [ ] Provjeri: Jesu li sačuvani podaci profila?
- [ ] Provjeri: Vide li se prethodne fotografije u profilu?

### 2.3 Logout
- [ ] Klikni na logout
- [ ] Provjeri: Preusmjerava li na homepage?
- [ ] Provjeri: Nestaje li avatar iz headera?
- [ ] Provjeri: Možeš li pristupiti /profile bez logina? (treba redirect)

### 2.4 Admin Login
- [ ] Idi na /admin
- [ ] Provjeri: Traži li login?
- [ ] Ulogiraj se s admin credentials
- [ ] Provjeri: Vidiš li admin dashboard?

### 2.5 Zaštita ruta
- [ ] Kao neprijavljen korisnik, pokušaj pristupiti /upload
- [ ] Očekivano: Redirect na login ili poruka
- [ ] Kao običan user, pokušaj pristupiti /admin
- [ ] Očekivano: Zabranjen pristup

---

## 3. UPLOAD FOTOGRAFIJA

### 3.1 Uspješan upload
- [ ] Prijavi se kao običan korisnik
- [ ] Idi na Upload stranicu
- [ ] Odaberi fotografiju (JPEG, <10MB)
- [ ] Unesi godinu (npr. 1985)
- [ ] Unesi lokaciju (autocomplete radi?)
- [ ] Unesi opis
- [ ] Klikni Upload
- [ ] Provjeri: Pokazuje li loading indikator?
- [ ] Provjeri: Pokazuje li success poruku?
- [ ] Provjeri: Fotografija se pojavljuje u "Pending" u admin panelu?

### 3.2 Validacija - Prevelika datoteka
- [ ] Pokušaj uploadati datoteku >10MB
- [ ] Očekivano: Error poruka prije uploada

### 3.3 Validacija - Krivi format
- [ ] Pokušaj uploadati .pdf ili .txt
- [ ] Očekivano: Error poruka

### 3.4 Validacija - Prazna polja
- [ ] Pokušaj uploadati bez godine
- [ ] Očekivano: Validacijska greška
- [ ] Pokušaj uploadati bez lokacije
- [ ] Očekivano: Validacijska greška

### 3.5 Lokacija picker
- [ ] Koristi autocomplete za lokaciju
- [ ] Provjeri: Prikazuje li se mapa?
- [ ] Provjeri: Možeš li ručno pomaknuti pin?

---

## 4. ADMIN MODERACIJA

### 4.1 Pregled pending fotografija
- [ ] Ulogiraj se kao admin
- [ ] Idi na Admin dashboard
- [ ] Provjeri: Vidiš li pending fotografije?
- [ ] Provjeri: Vidiš li detalje (user, datum, lokacija)?

### 4.2 Approve fotografije
- [ ] Odaberi pending fotografiju
- [ ] Klikni Approve
- [ ] Provjeri: Fotografija se miče iz pending?
- [ ] Provjeri: Fotografija se pojavljuje na mapi/galleriji?
- [ ] Provjeri: Korisnik dobiva email notifikaciju?

### 4.3 Reject fotografije
- [ ] Odaberi pending fotografiju
- [ ] Klikni Reject
- [ ] Unesi razlog odbijanja
- [ ] Provjeri: Fotografija se miče iz pending?
- [ ] Provjeri: Korisnik dobiva email s razlogom?

### 4.4 Moderacija komentara
- [ ] Idi na Comments tab
- [ ] Provjeri: Vidiš li sve komentare?
- [ ] Provjeri: Možeš li obrisati komentar?

### 4.5 Moderacija tagova
- [ ] Idi na Tags tab
- [ ] Provjeri: Vidiš li pending tagove?
- [ ] Provjeri: Možeš li approve/reject tag?

---

## 5. KOMENTARI

### 5.1 Dodavanje komentara
- [ ] Otvori approved fotografiju
- [ ] Napiši komentar
- [ ] Klikni Post
- [ ] Provjeri: Komentar se pojavljuje odmah?

### 5.2 Brisanje vlastitog komentara
- [ ] Pronađi svoj komentar
- [ ] Klikni Delete
- [ ] Provjeri: Komentar je obrisan?

### 5.3 Rate limiting
- [ ] Pokušaj dodati 6 komentara u minuti
- [ ] Očekivano: 6. komentar je blokiran s porukom

### 5.4 Neprijavljeni korisnik
- [ ] Odjavi se
- [ ] Pokušaj komentirati
- [ ] Očekivano: Prompt za prijavu

---

## 6. SEARCH I FILTRIRANJE

### 6.1 Pretraga po lokaciji
- [ ] Koristi search bar
- [ ] Unesi ime grada (npr. "Zagreb")
- [ ] Provjeri: Autocomplete radi?
- [ ] Provjeri: Rezultati su relevantni?

### 6.2 Filter po godini
- [ ] Postavi raspon godina (npr. 1900-1950)
- [ ] Provjeri: Prikazuju se samo fotografije iz tog razdoblja?

### 6.3 Filter po tipu
- [ ] Odaberi tip (npr. "Arhitektura")
- [ ] Provjeri: Rezultati su filtrirani?

### 6.4 Sortiranje
- [ ] Sortiraj po "Najnovije"
- [ ] Provjeri: Redoslijed je ispravan?
- [ ] Sortiraj po "Najpopularnije"
- [ ] Provjeri: Redoslijed je ispravan?

### 6.5 Prazni rezultati
- [ ] Postavi filtere koji daju 0 rezultata
- [ ] Provjeri: Prikazuje li se empty state poruka?

---

## 7. KORISNIČKI PROFIL

### 7.1 Vlastiti profil
- [ ] Idi na svoj profil
- [ ] Provjeri: Vidiš li svoje podatke?
- [ ] Provjeri: Vidiš li svoje fotografije?
- [ ] Provjeri: Statistike su točne?

### 7.2 Edit profila
- [ ] Klikni Edit
- [ ] Promijeni bio
- [ ] Spremi
- [ ] Provjeri: Promjene su sačuvane?

### 7.3 Tuđi profil
- [ ] Posjeti profil drugog korisnika
- [ ] Provjeri: Vidiš li njihove javne podatke?
- [ ] Provjeri: NE vidiš privatne podatke?

### 7.4 Leaderboard
- [ ] Idi na Community Leaderboard
- [ ] Provjeri: Prikazuju li se korisnici?
- [ ] Provjeri: Sortiranje radi (po fotkama, lajkovima)?
- [ ] Provjeri: Filtriranje po periodu radi?

---

## 8. MAPA

### 8.1 Prikaz mape
- [ ] Idi na Map stranicu
- [ ] Provjeri: Mapa se učitava?
- [ ] Provjeri: Markeri su vidljivi?

### 8.2 Clustering
- [ ] Zoom out na cijelu Hrvatsku
- [ ] Provjeri: Markeri se grupiraju (cluster)?

### 8.3 Marker klik
- [ ] Klikni na marker
- [ ] Provjeri: Otvara li se popup/preview?
- [ ] Provjeri: Možeš li otvoriti punu fotografiju?

---

## 9. PWA FUNKCIONALNOST

### 9.1 Install prompt
- [ ] Otvori stranicu na mobitelu (Chrome)
- [ ] Provjeri: Pojavljuje li se "Add to Home Screen"?
- [ ] Instaliraj aplikaciju
- [ ] Provjeri: Ikona je na home screenu?

### 9.2 Offline mode
- [ ] Otvori aplikaciju
- [ ] Učitaj nekoliko stranica (homepage, mapa, par fotki)
- [ ] Isključi internet (airplane mode)
- [ ] Provjeri: Vidiš li cached sadržaj?
- [ ] Provjeri: Prikazuje li se offline indicator?

### 9.3 Service Worker update
- [ ] Provjeri u DevTools > Application > Service Workers
- [ ] Provjeri: SW je registered?

---

## 10. RESPONSIVE DIZAJN

### 10.1 Mobile (iPhone SE - 375px)
- [ ] Homepage izgleda OK?
- [ ] Navigacija radi (hamburger menu)?
- [ ] Upload forma je upotrebljiva?
- [ ] Fotografije se prikazuju ispravno?
- [ ] Komentari su čitljivi?

### 10.2 Tablet (iPad - 768px)
- [ ] Layout se prilagođava?
- [ ] Grid fotografija izgleda OK?

### 10.3 Desktop (1920px)
- [ ] Koristi li se cijela širina?
- [ ] Nema horizontal scrolla?

### 10.4 Ultra-wide (2560px+)
- [ ] Sadržaj nije previše rastegnut?

---

## 11. CROSS-BROWSER

| Stranica | Chrome | Firefox | Safari | Edge |
|----------|--------|---------|--------|------|
| Homepage | [ ] | [ ] | [ ] | [ ] |
| Upload | [ ] | [ ] | [ ] | [ ] |
| Map | [ ] | [ ] | [ ] | [ ] |
| Profile | [ ] | [ ] | [ ] | [ ] |
| Admin | [ ] | [ ] | [ ] | [ ] |

---

## 12. DARK/LIGHT MODE

### 12.1 Toggle
- [ ] Klikni na theme toggle
- [ ] Provjeri: Mijenja li se tema?
- [ ] Provjeri: Sprema li se preference?

### 12.2 Konzistentnost
- [ ] Provjeri homepage u dark mode
- [ ] Provjeri upload formu u dark mode
- [ ] Provjeri admin panel u dark mode
- [ ] Provjeri profile stranicu u dark mode
- [ ] Sve čitljivo? Nema "bijelog teksta na bijeloj pozadini"?

---

## 13. VIŠEJEZIČNOST (HR/EN)

### 13.1 Toggle jezika
- [ ] Promijeni jezik na English
- [ ] Provjeri: Svi tekstovi su prevedeni?
- [ ] Promijeni nazad na Hrvatski
- [ ] Provjeri: Sprema li se preference?

### 13.2 Provjeri stranice
- [ ] Homepage - svi tekstovi prevedeni?
- [ ] Upload forma - labele prevedene?
- [ ] Error poruke - prevedene?
- [ ] Footer - linkovi prevedeni?
- [ ] Admin panel - prevedeno?

---

## 14. ERROR HANDLING

### 14.1 Network error
- [ ] Isključi internet
- [ ] Pokušaj uploadati fotku
- [ ] Provjeri: Prikazuje li se error toast?

### 14.2 404 stranica
- [ ] Idi na nepostojeći URL (npr. /asdfasdf)
- [ ] Provjeri: Prikazuje li se 404 stranica?
- [ ] Provjeri: Ima li link nazad na home?

### 14.3 Invalid photo ID
- [ ] Idi na /photo/nepostojeci-id
- [ ] Provjeri: Prikazuje li se error ili 404?

---

## 15. LEGAL & GDPR

### 15.1 Cookie consent
- [ ] Otvori stranicu u incognito
- [ ] Provjeri: Pojavljuje li se cookie banner?
- [ ] Klikni "Odbij"
- [ ] Provjeri u DevTools: Nema analytics cookies?
- [ ] Refreshaj i klikni "Prihvati"
- [ ] Provjeri: Analytics cookies postoje?

### 15.2 Legal stranice
- [ ] /privacy - učitava se?
- [ ] /terms - učitava se?
- [ ] /faq - učitava se?
- [ ] /contact - učitava se?

---

## 16. NOTIFICATIONS

### 16.1 Notification hub
- [ ] Prijavi se
- [ ] Provjeri: Vidiš li notification ikonu?
- [ ] Klikni na nju
- [ ] Provjeri: Prikazuju li se notifikacije?

### 16.2 Nova notifikacija
- [ ] Neka netko lajka tvoju fotku
- [ ] Provjeri: Dobivaš li notifikaciju?
- [ ] Neka netko komentira tvoju fotku
- [ ] Provjeri: Dobivaš li notifikaciju?

---

## 17. FOLLOW SISTEM

### 17.1 Follow korisnika
- [ ] Idi na tuđi profil
- [ ] Klikni Follow
- [ ] Provjeri: Broj followera se povećao?

### 17.2 Unfollow
- [ ] Klikni Unfollow
- [ ] Provjeri: Broj se smanjio?

---

## 18. LIKE SISTEM

### 18.1 Like fotografije
- [ ] Otvori fotografiju
- [ ] Klikni Like
- [ ] Provjeri: Broj lajkova se povećao?
- [ ] Provjeri: Ikona je promijenjena (filled)?

### 18.2 Unlike
- [ ] Klikni ponovo
- [ ] Provjeri: Broj se smanjio?

---

## 19. SECURITY CHECKS

### 19.1 Firebase Security Rules
- [ ] Kao neprijavljen user, pokušaj pristupiti /admin API-ju kroz DevTools
- [ ] Očekivano: Permission denied

### 19.2 Upload bez prijave
- [ ] Odjavi se
- [ ] Pokušaj direktno poslati upload request
- [ ] Očekivano: Odbijeno

---

## 20. ACCESSIBILITY (OSNOVNO)

### 20.1 Keyboard navigacija
- [ ] Koristi samo TAB za navigaciju
- [ ] Možeš li doći do svih linkova?
- [ ] Možeš li submitati forme?

### 20.2 Focus states
- [ ] Vidiš li focus outline na elementima?

### 20.3 Alt text
- [ ] Inspektiraj slike
- [ ] Imaju li alt atribute?

---

## SAŽETAK PRONAĐENIH PROBLEMA

| # | Problem | Ozbiljnost (Critical/High/Medium/Low) | Stranica |
|---|---------|---------------------------------------|----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |

---

## NAPOMENE

_Zapiši bilo što važno što primjetiš tijekom testiranja:_

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

**Checklist completed:** [ ] DA / [ ] NE
**Ready for launch:** [ ] DA / [ ] NE / [ ] TREBA POPRAVKE
