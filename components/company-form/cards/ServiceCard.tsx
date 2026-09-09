type Props = {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export default function ServiceCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-3xl border p-5 text-left transition
        ${
          selected
            ? "border-orange-500 bg-orange-500/10"
            : "border-slate-800 bg-[#0d1218] hover:border-orange-500"
        }
      `}
    >
      <div className="mb-4 text-3xl">
        {icon}
      </div>

      <h3 className="mb-2 font-semibold text-white">
        {title}
      </h3>

      <p className="text-sm text-gray-400">
        {description}
      </p>
    </button>
  );
}