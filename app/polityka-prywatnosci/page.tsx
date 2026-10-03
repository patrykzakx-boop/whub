import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/siteConfig";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Informacje o przetwarzaniu danych osobowych w serwisie WeldHub.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-10 text-white lg:py-14">
      <article className="mx-auto max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">WeldHub · dokumenty prawne</div>
        <h1 className="mt-3 text-3xl font-bold lg:text-5xl">Polityka prywatności</h1>
        <p className="mt-3 text-sm text-gray-500">Obowiązuje od {LEGAL_EFFECTIVE_DATE}.</p>

        <div className="mt-8 space-y-5">
          <PrivacySection title="1. Administrator danych">
            <p>
              Administratorem danych osobowych jest osoba fizyczna prowadząca bezpłatny,
              niekomercyjny projekt internetowy pod nazwą WeldHub. We wszystkich sprawach
              dotyczących prywatności można skontaktować się pod adresem <EmailLink />.
            </p>
          </PrivacySection>

          <PrivacySection title="2. Jakie dane przetwarzamy">
            <p>W zależności od sposobu korzystania z Serwisu możemy przetwarzać:</p>
            <ul>
              <li>dane Konta: adres e-mail, identyfikator użytkownika oraz informacje o logowaniu;</li>
              <li>dane Firmy: nazwa, opis, lokalizacja, adres, telefon, e-mail, strona internetowa, zakres usług i zdjęcia;</li>
              <li>dane Zleceń: tytuł, opis, kategoria, lokalizacja, zdjęcia i dane kontaktowe podane przez Klienta;</li>
              <li>dane Ofert i komunikacji związanej ze Zleceniem;</li>
              <li>treść zgłoszeń nadużyć, reklamacji i korespondencji z Operatorem;</li>
              <li>dane techniczne i bezpieczeństwa, takie jak adres IP, znaczniki czasu, informacje o przeglądarce i wyniki mechanizmów antyspamowych;</li>
              <li>historię moderacji, blokad oraz operacji wykonywanych na Koncie.</li>
            </ul>
            <p>Prosimy, aby w opisach i zdjęciach nie umieszczać danych osobowych, które nie są konieczne.</p>
          </PrivacySection>

          <PrivacySection title="3. Cele i podstawy prawne">
            <ul>
              <li><strong>Utworzenie Konta i świadczenie funkcji Serwisu</strong> – niezbędność do wykonania umowy (art. 6 ust. 1 lit. b RODO).</li>
              <li><strong>Obsługa Zleceń, Ofert, Firm i komunikacji</strong> – wykonanie umowy oraz działania na żądanie Użytkownika (art. 6 ust. 1 lit. b RODO).</li>
              <li><strong>Bezpieczeństwo, zapobieganie nadużyciom i moderacja</strong> – prawnie uzasadniony interes polegający na ochronie Serwisu i jego użytkowników (art. 6 ust. 1 lit. f RODO).</li>
              <li><strong>Obsługa reklamacji, zgłoszeń i roszczeń</strong> – wykonanie umowy, obowiązek prawny lub prawnie uzasadniony interes (art. 6 ust. 1 lit. b, c lub f RODO).</li>
              <li><strong>Wykonanie obowiązków wynikających z prawa</strong> – art. 6 ust. 1 lit. c RODO.</li>
            </ul>
            <p>WeldHub nie wykorzystuje danych do przesyłania reklam ani newslettera.</p>
          </PrivacySection>

          <PrivacySection title="4. Dane widoczne publicznie i udostępniane użytkownikom">
            <p>
              Zatwierdzone profile Firm, ich opisy, lokalizacja, dane kontaktowe i zdjęcia
              mogą być dostępne publicznie. Treść publicznych Zleceń jest widoczna w Serwisie,
              natomiast dostęp do danych kontaktowych i obsługi Ofert jest ograniczany zgodnie
              z funkcjami Serwisu.
            </p>
            <p>
              Dane zawarte w Ofercie są udostępniane Klientowi obsługującemu dane Zlecenie.
              Prywatny link Klienta należy chronić przed przekazaniem osobom nieuprawnionym.
            </p>
          </PrivacySection>

          <PrivacySection title="5. Dostawcy technologiczni i odbiorcy danych">
            <p>W działaniu Serwisu uczestniczą dostawcy świadczący usługi na rzecz WeldHub:</p>
            <ul>
              <li><strong>Supabase</strong> – uwierzytelnianie, baza danych i przechowywanie plików;</li>
              <li><strong>Vercel</strong> – hosting i dostarczanie aplikacji;</li>
              <li><strong>Resend</strong> – wysyłka wiadomości transakcyjnych;</li>
              <li><strong>Fastmail</strong> – obsługa skrzynki kontaktowej;</li>
              <li><strong>Cloudflare Turnstile</strong> – ochrona formularzy przed automatycznymi nadużyciami;</li>
              <li><strong>Google Maps Platform</strong> – wyszukiwanie i normalizacja lokalizacji.</li>
            </ul>
            <p>
              Dane mogą zostać udostępnione organom publicznym, jeśli wymagają tego przepisy,
              oraz innym podmiotom wyłącznie wtedy, gdy istnieje odpowiednia podstawa prawna.
            </p>
          </PrivacySection>

          <PrivacySection title="6. Przekazywanie danych poza EOG">
            <p>
              Niektórzy dostawcy technologiczni mogą przetwarzać dane poza Europejskim
              Obszarem Gospodarczym. W takich przypadkach przekazanie następuje na podstawie
              mechanizmów dopuszczonych przez RODO, stosowanych przez danego dostawcę, takich
              jak decyzja stwierdzająca odpowiedni poziom ochrony lub standardowe klauzule umowne.
            </p>
          </PrivacySection>

          <PrivacySection title="7. Okres przechowywania">
            <ul>
              <li>dane Konta są przechowywane przez okres korzystania z Serwisu;</li>
              <li>dane Firm, Zleceń i Ofert – przez okres ich aktywności, a następnie przez czas potrzebny do obsługi historii, zgłoszeń i bezpieczeństwa;</li>
              <li>dane dotyczące nadużyć i blokad – tak długo, jak jest to potrzebne do ochrony Serwisu i zapobiegania ponownym naruszeniom;</li>
              <li>korespondencja i dane związane z roszczeniami – przez okres niezbędny do ich obsługi i upływu właściwych terminów przedawnienia;</li>
              <li>dane techniczne – przez okres wynikający z ustawień bezpieczeństwa i zasad dostawców infrastruktury.</li>
            </ul>
            <p>Dane zostaną usunięte lub zanonimizowane wcześniej, jeżeli ustaną wszystkie podstawy ich dalszego przetwarzania.</p>
          </PrivacySection>

          <PrivacySection title="8. Prawa osób, których dane dotyczą">
            <p>Na zasadach określonych w RODO przysługuje Ci prawo do:</p>
            <ul>
              <li>dostępu do danych i uzyskania ich kopii;</li>
              <li>sprostowania nieprawidłowych danych;</li>
              <li>usunięcia danych lub ograniczenia ich przetwarzania;</li>
              <li>przenoszenia danych;</li>
              <li>wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie;</li>
              <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
            </ul>
            <p>Wniosek można przesłać na <EmailLink /> z adresu przypisanego do Konta. Przed realizacją możemy poprosić o potwierdzenie tożsamości.</p>
          </PrivacySection>

          <PrivacySection title="9. Usunięcie Konta i danych">
            <p>
              Żądanie usunięcia Konta można wysłać na <EmailLink />. Usuniemy lub
              zanonimizujemy dane, których nie musimy zachować ze względu na obowiązek
              prawny, bezpieczeństwo, rozpatrywanie zgłoszeń albo ustalenie, dochodzenie lub
              obronę przed roszczeniami.
            </p>
          </PrivacySection>

          <PrivacySection title="10. Pliki cookies i pamięć przeglądarki">
            <p>
              Serwis wykorzystuje wyłącznie rozwiązania niezbędne do logowania,
              bezpieczeństwa, utrzymania sesji i prawidłowego działania formularzy. Obecnie
              nie korzystamy z reklamowych ani marketingowych narzędzi śledzących.
            </p>
            <p>
              Jeżeli w przyszłości zostanie dodana analityka lub marketing wymagający zgody,
              użytkownik otrzyma odpowiednią informację i możliwość dokonania wyboru przed
              uruchomieniem takich technologii.
            </p>
          </PrivacySection>

          <PrivacySection title="11. Zautomatyzowane decyzje">
            <p>
              WeldHub nie podejmuje wobec użytkowników decyzji wywołujących skutki prawne
              wyłącznie w sposób zautomatyzowany. Mechanizmy techniczne mogą filtrować spam,
              ograniczać nadmierną liczbę żądań albo wspierać sortowanie treści, lecz decyzje
              moderacyjne mogą zostać zgłoszone do ponownej oceny przez kontakt z Operatorem.
            </p>
          </PrivacySection>

          <PrivacySection title="12. Bezpieczeństwo">
            <p>
              Stosujemy m.in. kontrolę dostępu, szyfrowane połączenia, ograniczanie liczby
              żądań, ochronę CAPTCHA, walidację plików i polityki dostępu do bazy danych.
              Żaden system nie gwarantuje jednak całkowitego wyeliminowania ryzyka.
            </p>
          </PrivacySection>

          <PrivacySection title="13. Zmiany Polityki prywatności">
            <p>
              Dokument może być aktualizowany w związku ze zmianami prawa, dostawców lub
              funkcji Serwisu. Data obowiązywania jest wskazana na początku strony. Istotne
              zmiany zostaną zakomunikowane w Serwisie lub wiadomością e-mail, jeżeli będzie
              to wymagane.
            </p>
            <p>Zasady korzystania z platformy opisuje również <Link href="/regulamin">Regulamin WeldHub</Link>.</p>
          </PrivacySection>
        </div>
      </article>
    </main>
  );
}

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0d1218] p-5 sm:p-7">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-gray-300 [&_a]:text-orange-300 [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-gray-100">
        {children}
      </div>
    </section>
  );
}

function EmailLink() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}
