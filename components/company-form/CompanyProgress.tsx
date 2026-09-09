type Props = {
  currentStep: number;
};

export default function CompanyProgress({
  currentStep,
}: Props) {
  const totalSteps = 7;

  const progress = Math.round(
    (currentStep / totalSteps) * 100
  );

  return (
    <div className="lg:hidden">

      <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-5">

        <div className="mb-2 flex justify-between">

          <span className="text-gray-400">
            Profil firmy
          </span>

          <span className="text-white">
            {currentStep}/{totalSteps}
          </span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className="h-full bg-orange-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <div className="mt-3 text-sm text-gray-400">
          Ukończono {currentStep} z {totalSteps} kroków
        </div>

      </div>

    </div>
  );
}