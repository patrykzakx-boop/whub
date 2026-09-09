export default function RegulaminPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-10 text-white lg:py-14">
      <section className="mx-auto max-w-4xl">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          WeldHub
        </div>

        <h1 className="text-3xl font-bold text-white lg:text-5xl">
          Regulamin
        </h1>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-[#0d1218] p-6 text-sm leading-7 text-gray-300 lg:p-8">
          <p>
            Regulamin serwisu WeldHub zostanie uzupełniony przed publicznym
            uruchomieniem platformy.
          </p>

          <p className="mt-4 text-gray-500">
            W sprawach związanych z działaniem serwisu skontaktuj się pod
            adresem{" "}
            <a
              href="mailto:kontakt@weldhub.pl"
              className="text-gray-300 underline underline-offset-4 transition hover:text-white"
            >
              kontakt@weldhub.pl
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
