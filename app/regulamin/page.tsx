import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/siteConfig";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin korzystania z bezpłatnego serwisu WeldHub.",
};

export default function RegulaminPage() {
  return (
    <LegalMain title="Regulamin serwisu WeldHub" lead={`Obowiązuje od ${LEGAL_EFFECTIVE_DATE}.`}>
      <LegalSection title="1. Informacje podstawowe">
        <p>
          WeldHub jest bezpłatnym serwisem internetowym dostępnym pod adresem whub.pl,
          który ułatwia kontakt pomiędzy osobami poszukującymi usług spawalniczych lub
          ślusarskich a wykonawcami takich usług.
        </p>
        <p>
          Serwis jest prowadzony jako niekomercyjny projekt testowy. Kontakt z operatorem
          jest możliwy pod adresem <EmailLink />. WeldHub nie pobiera obecnie opłat ani
          prowizji od użytkowników.
        </p>
        <p>
          Regulamin określa zasady korzystania z Serwisu oraz świadczenia usług drogą
          elektroniczną. Rozpoczęcie korzystania z funkcji wymagających Konta oznacza
          zawarcie nieodpłatnej umowy o świadczenie usług elektronicznych.
        </p>
      </LegalSection>

      <LegalSection title="2. Definicje">
        <ul>
          <li><strong>Serwis</strong> – platforma internetowa WeldHub dostępna w domenie whub.pl.</li>
          <li><strong>Operator</strong> – osoba fizyczna prowadząca niekomercyjny projekt WeldHub.</li>
          <li><strong>Użytkownik</strong> – osoba korzystająca z Serwisu.</li>
          <li><strong>Klient</strong> – Użytkownik publikujący Zlecenie lub wysyłający prywatne zapytanie.</li>
          <li><strong>Wykonawca</strong> – Użytkownik prezentujący Firmę albo składający Ofertę.</li>
          <li><strong>Firma</strong> – publiczny profil działalności lub usług Wykonawcy.</li>
          <li><strong>Zlecenie</strong> – opis zapotrzebowania opublikowany przez Klienta.</li>
          <li><strong>Oferta</strong> – propozycja realizacji Zlecenia złożona przez Wykonawcę.</li>
          <li><strong>Konto</strong> – indywidualna część Serwisu przypisana do adresu e-mail Użytkownika.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Zakres działania Serwisu">
        <p>WeldHub umożliwia w szczególności:</p>
        <ul>
          <li>zakładanie i obsługę Konta;</li>
          <li>tworzenie oraz prezentowanie profili Firm;</li>
          <li>publikowanie Zleceń i prywatnych zapytań do Firm;</li>
          <li>składanie, porównywanie i wybieranie Ofert;</li>
          <li>udostępnianie Klientowi prywatnego linku do obsługi Zlecenia;</li>
          <li>zgłaszanie treści mogących naruszać prawo lub Regulamin.</li>
        </ul>
        <p>
          Serwis jedynie udostępnia narzędzia do nawiązania kontaktu. Operator nie jest
          stroną umowy dotyczącej wykonania prac, nie pośredniczy w płatnościach i nie
          pobiera prowizji.
        </p>
      </LegalSection>

      <LegalSection title="4. Wymagania techniczne i charakter testowy">
        <p>
          Do korzystania z Serwisu potrzebne są urządzenie z dostępem do Internetu,
          aktualna przeglądarka internetowa oraz – dla funkcji Konta – aktywny adres e-mail.
        </p>
        <p>
          WeldHub znajduje się w fazie testowej. Funkcje mogą być rozwijane, czasowo
          wyłączane albo zmieniane. Operator dokłada starań, aby Serwis działał bezpiecznie
          i stabilnie, ale nie gwarantuje nieprzerwanej dostępności.
        </p>
      </LegalSection>

      <LegalSection title="5. Konto użytkownika">
        <ul>
          <li>Konto może utworzyć osoba pełnoletnia posiadająca pełną zdolność do czynności prawnych.</li>
          <li>Użytkownik podaje prawdziwy adres e-mail i chroni swoje hasło przed dostępem osób trzecich.</li>
          <li>Konto nie może być wykorzystywane do podszywania się pod inną osobę lub podmiot.</li>
          <li>Użytkownik odpowiada za działania wykonane z użyciem swojego Konta, chyba że nastąpiły bez jego winy.</li>
          <li>Podejrzenie nieuprawnionego dostępu należy zgłosić na adres <EmailLink />.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Profile Firm i Wykonawcy">
        <p>
          Wykonawca odpowiada za prawdziwość oraz aktualność danych Firmy, opisów usług,
          danych kontaktowych, zdjęć i pozostałych materiałów. Może publikować wyłącznie
          materiały, do których ma odpowiednie prawa.
        </p>
        <p>
          Publikacja profilu Firmy wymaga akceptacji Operatora. Istotna zmiana profilu może
          spowodować jego ponowne skierowanie do moderacji. Akceptacja profilu nie oznacza
          sprawdzenia kwalifikacji, zezwoleń, ubezpieczenia ani jakości usług Wykonawcy.
        </p>
        <p>
          Wykonawca sam odpowiada za posiadanie uprawnień, kwalifikacji, zezwoleń oraz
          ubezpieczeń wymaganych dla oferowanych prac.
        </p>
      </LegalSection>

      <LegalSection title="7. Zlecenia, zapytania i Oferty">
        <p>
          Klient powinien opisać rzeczywiste zapotrzebowanie zgodnie ze stanem faktycznym,
          bez publikowania danych lub materiałów, których nie ma prawa udostępniać.
        </p>
        <p>
          Oferta pochodzi bezpośrednio od Wykonawcy. Jej warunki, cena, termin, gwarancja,
          zakres prac oraz sposób rozliczenia powinny zostać uzgodnione pomiędzy Klientem
          i Wykonawcą poza Serwisem albo za pomocą udostępnionych funkcji kontaktowych.
        </p>
        <p>
          Wybór Oferty w Serwisie nie zastępuje ustalenia wszystkich warunków realizacji.
          Strony powinny samodzielnie zweryfikować swoją tożsamość, kwalifikacje i warunki
          współpracy, a przy większych pracach zawrzeć odpowiednią umowę.
        </p>
      </LegalSection>

      <LegalSection title="8. Zasady publikowania treści">
        <p>Zabronione jest publikowanie treści, które:</p>
        <ul>
          <li>są niezgodne z prawem, wprowadzające w błąd albo naruszają prawa osób trzecich;</li>
          <li>zawierają groźby, mowę nienawiści, treści obraźliwe, pornograficzne lub przemocowe;</li>
          <li>naruszają prywatność, tajemnicę przedsiębiorstwa lub prawa autorskie;</li>
          <li>promują usługi zakazane, niebezpieczne albo wykonywane bez wymaganych uprawnień;</li>
          <li>są spamem, próbą oszustwa, złośliwym oprogramowaniem lub próbą obejścia zabezpieczeń;</li>
          <li>zawierają zbędne dane osobowe osób trzecich.</li>
        </ul>
        <p>
          Użytkownik udziela Operatorowi niewyłącznej, nieodpłatnej licencji na techniczne
          przechowywanie, wyświetlanie i przetwarzanie opublikowanych materiałów wyłącznie
          w zakresie potrzebnym do działania, moderacji i promocji danego profilu w Serwisie.
        </p>
      </LegalSection>

      <LegalSection title="9. Moderacja i bezpieczeństwo">
        <p>
          Operator może weryfikować zgłoszenia, ukrywać lub usuwać treści, odrzucać profile,
          ograniczać funkcje Konta albo blokować Konto, jeśli jest to potrzebne dla ochrony
          użytkowników, bezpieczeństwa Serwisu, wykonania Regulaminu lub obowiązującego prawa.
        </p>
        <p>
          Przed podjęciem trwałej decyzji Operator może poprosić Użytkownika o wyjaśnienia
          lub poprawienie treści. W pilnych przypadkach, w szczególności przy podejrzeniu
          oszustwa albo zagrożeniu bezpieczeństwa, działanie może nastąpić niezwłocznie.
        </p>
      </LegalSection>

      <LegalSection title="10. Odpowiedzialność">
        <p>
          Operator odpowiada za prawidłowe udostępnienie funkcji Serwisu w zakresie
          wynikającym z bezwzględnie obowiązujących przepisów. Nie odpowiada za treść Ofert,
          jakość, terminowość, bezpieczeństwo ani rezultat usług wykonywanych przez
          Wykonawców oraz za rozliczenia pomiędzy użytkownikami.
        </p>
        <p>
          Użytkownik korzysta z informacji w Serwisie z uwzględnieniem własnej oceny ryzyka.
          Operator nie potwierdza automatycznie tożsamości, sytuacji prawnej, uprawnień ani
          wypłacalności użytkowników.
        </p>
        <p>
          Postanowienia Regulaminu nie wyłączają odpowiedzialności, której nie można
          ograniczyć na podstawie obowiązującego prawa, ani praw przysługujących konsumentom.
        </p>
      </LegalSection>

      <LegalSection title="11. Zakończenie korzystania i usunięcie Konta">
        <p>
          Użytkownik może w każdej chwili zrezygnować z Serwisu i zażądać usunięcia Konta,
          wysyłając wiadomość z adresu przypisanego do Konta na <EmailLink />.
        </p>
        <p>
          Usunięcie Konta nie zawsze oznacza natychmiastowe usunięcie wszystkich danych.
          Część informacji może być przechowywana przez okres wymagany prawem, potrzebny do
          rozpatrzenia zgłoszeń, zapewnienia bezpieczeństwa lub obrony przed roszczeniami.
          Szczegóły opisuje <Link href="/polityka-prywatnosci">Polityka prywatności</Link>.
        </p>
      </LegalSection>

      <LegalSection title="12. Reklamacje i kontakt">
        <p>
          Reklamacje dotyczące działania Serwisu można wysyłać na <EmailLink />. Zgłoszenie
          powinno zawierać adres e-mail Konta, opis problemu i – jeżeli to możliwe – numer
          Zlecenia lub adres strony, której dotyczy.
        </p>
        <p>
          Operator odpowie bez zbędnej zwłoki, nie później niż w ciągu 14 dni. Reklamacje
          dotyczące samego wykonania usługi należy kierować bezpośrednio do drugiej strony
          uzgodnień, ponieważ Operator nie jest stroną tej umowy.
        </p>
      </LegalSection>

      <LegalSection title="13. Dane osobowe">
        <p>
          Zasady przetwarzania danych osobowych, wykorzystywania dostawców technicznych oraz
          realizacji praw użytkowników określa <Link href="/polityka-prywatnosci">Polityka prywatności</Link>.
        </p>
      </LegalSection>

      <LegalSection title="14. Zmiany Regulaminu">
        <p>
          Regulamin może zostać zmieniony z powodu rozwoju Serwisu, zmian prawa,
          bezpieczeństwa lub sposobu świadczenia usług. O istotnych zmianach zarejestrowani
          użytkownicy zostaną poinformowani w Serwisie lub wiadomością e-mail z odpowiednim
          wyprzedzeniem, jeżeli będzie to wymagane.
        </p>
      </LegalSection>

      <LegalSection title="15. Postanowienia końcowe">
        <p>
          Do Regulaminu stosuje się prawo polskie. Nie narusza to ochrony przyznanej
          konsumentowi przez przepisy, których nie można wyłączyć w drodze umowy. Spory będą
          rozstrzygane przez właściwy sąd zgodnie z obowiązującymi przepisami.
        </p>
      </LegalSection>
    </LegalMain>
  );
}

function LegalMain({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-10 text-white lg:py-14">
      <article className="mx-auto max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">WeldHub · dokumenty prawne</div>
        <h1 className="mt-3 text-3xl font-bold lg:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-gray-500">{lead}</p>
        <div className="mt-8 space-y-5">{children}</div>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
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
