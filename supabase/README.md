# Migracje Supabase

Rollout jest celowo podzielony na trzy fazy:

1. Uruchom `migrations/20260909090000_schema_hardening.sql`, a następnie
   `migrations/20260909090500_access_views.sql`. To faza kompatybilna ze starą
   i nową aplikacją.
2. Wdróż kod aplikacji z tej gałęzi i sprawdź publiczny marketplace, tworzenie
   zapytania oraz panel ofert.
3. Dopiero wtedy uruchom `migrations/20260909091000_rls.sql`, a po nim
   `verification/rls_audit.sql`.

Nie wykonuj wszystkich migracji jednym `db push` przed wdrożeniem kodu.
Restrykcyjna migracja RLS odcina stary kod od bazowej tabeli `requests`.

Po wdrożeniu uruchom `verification/rls_audit.sql`. Wynik powinien pokazać:

- `rls_enabled = true` dla wszystkich pięciu tabel aplikacji,
- brak uprawnień `anon` do tabel zawierających prywatne dane,
- wyłącznie bezpieczne kolumny w `public_request_listings`,
- polityki zapisu Storage ograniczone do właściwych bucketów i właścicieli firm.

## Ważne przed wdrożeniem

- `public_request_listings` oraz `my_offer_details` są celowo widokami
  `security-definer`. Bazowe tabele są odcięte odpowiednimi grantami, a widoki
  mają stałą projekcję bez sekretów. Nie dodawaj do nich `access_token`,
  `customer_id` ani niezamaskowanych danych kontaktowych.
- Migracja usuwa wcześniejsze polityki z pięciu tabel aplikacji oraz wszystkie
  polityki `storage.objects`. W aktualnym projekcie wszystkie cztery buckety
  należą do Whub; jeśli pojawi się bucket innej aplikacji, należy najpierw
  wydzielić jego polityki.
- Znany osierocony wpis `company_images` jest zachowany. Klucz obcy ma stan
  `NOT VALID`, ale chroni wszystkie nowe i zmieniane rekordy.
- Tworzenie zlecenia przechodzi przez `/api/requests`, więc role `anon` i
  `authenticated` nie otrzymują bezpośredniego `INSERT` do `requests`.
