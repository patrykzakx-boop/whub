type Props = {
  currentStep: number;
};

const steps = [
  "Dane firmy",
  "Usługi",
  "Materiały",
  "Metody spawania",
  "Kontakt",
  "Publikacja",
];

export default function CompanySidebar({
  currentStep,
}: Props) {
  const progress = Math.round(
    (currentStep / steps.length) * 100
  );

  return (
    <div className="sticky top-6">

      <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">

        <h2 className="mb-6 text-xl font-semibold text-white">
          Profil firmy
        </h2>

        <div className="mb-6">

          <div className="mb-2 flex justify-between text-sm">

            <span className="text-gray-400">
              Ukończono
            </span>

            <span className="text-white">
              {progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">

            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-2 text-xs text-gray-500">
            Krok {currentStep} z {steps.length}
          </div>

        </div>

        <div className="relative">

          {steps.map((step, index) => {
            const stepNumber = index + 1;

            const active =
              currentStep === stepNumber;

            const completed =
              currentStep > stepNumber;

            return (
              <div
                key={step}
                className="relative flex gap-4 pb-6"
              >
                {/* Linia */}
                {index !== steps.length - 1 && (
                  <div
                    className="
                      absolute
                      left-[15px]
                      top-8
                      h-full
                      w-px
                      bg-slate-700
                    "
                  />
                )}

                {/* Kółko */}
                <div
                  className={`
                    relative z-10
                    flex h-8 w-8 shrink-0 items-center justify-center
                    rounded-full text-sm font-semibold
                    ${
                      completed
                        ? "bg-green-600 text-white"
                        : active
                        ? "bg-orange-500 text-white"
                        : "bg-slate-800 text-gray-400"
                    }
                  `}
                >
                  {completed ? "✓" : stepNumber}
                </div>

                {/* Tekst */}
                <div className="pt-1">

                  <div
                    className={
                      active
                        ? "font-medium text-white"
                        : completed
                        ? "text-gray-300"
                        : "text-gray-500"
                    }
                  >
                    {step}
                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}