type Props = {
  title: string;
  code: string;
  selected: boolean;
  onClick: () => void;
};

export default function MethodCard({
  title,
  code,
  selected,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-2xl border p-4 text-left transition

        ${
          selected
            ? "border-orange-500 bg-orange-500/10"
            : "border-slate-800 bg-[#0d1218] hover:border-orange-500"
        }
      `}
    >
      <div className="font-semibold text-white">
        {title}
      </div>

      <div className="mt-1 text-sm text-gray-400">
        {code}
      </div>
    </button>
  );
}