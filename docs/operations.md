# Operacje produkcyjne WeldHub

## Monitoring

- `GET /api/health` sprawdza aplikację i dostęp do bazy Supabase.
- GitHub Actions uruchamia kontrolę co 30 minut.
- Błędy serwera przechwycone przez Next.js są wysyłane przez Resend na
  `ERROR_ALERT_EMAIL` (maksymalnie jeden alert dla tej samej trasy i typu błędu
  na 15 minut w obrębie instancji).

Wymagane sekrety repozytorium GitHub dla monitoringu:

- `VERCEL_AUTOMATION_BYPASS_SECRET` — potrzebny, dopóki Vercel Authentication
  chroni produkcję;
- `RESEND_API_KEY`;
- `MONITOR_FROM_EMAIL`, np. `WeldHub <alerty@whub.pl>`;
- `MONITOR_ALERT_EMAIL`, obecnie `weldhub@fastmail.com`.

## Automatyczne kopie zapasowe

Codzienny workflow eksportuje:

- tabele dostępne przez API Supabase;
- użytkowników Supabase Auth;
- indeks i zawartość Supabase Storage;
- pełny dump SQL wykonywany klientem PostgreSQL 17 w odizolowanym kontenerze.

Archiwum jest szyfrowane AES-256 przed wysłaniem do GitHub Actions i
przechowywane przez 30 dni. W artefakcie nie ma niezaszyfrowanych danych.

Wymagane sekrety repozytorium GitHub:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `SUPABASE_DB_POOLER_URL_V2` — adres Session pooler Supabase na porcie 5432,
  zapewniający połączenie IPv4 dla runnerów GitHub;
- `BACKUP_ENCRYPTION_PASSWORD` — długie, unikalne hasło przechowywane również
  poza GitHubem (dla tego projektu: Pęk kluczy macOS, wpis
  `whub-github-backup-encryption`).

### Odtworzenie pobranego artefaktu

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in whub-backup-RUN_ID.tar.gz.enc \
  -out whub-backup.tar.gz \
  -pass env:BACKUP_ENCRYPTION_PASSWORD

tar -xzf whub-backup.tar.gz
```

Przynajmniej raz na kwartał należy wykonać próbne odszyfrowanie i odtworzenie
kopii do oddzielnego projektu testowego Supabase.
