import MethodCard from "../cards/MethodCard";
import { METHODS } from "../constants/methods";

type Props = {
  methods: string[];
  setMethods: (methods: string[]) => void;
};

export default function MethodsStep({
  methods,
  setMethods,
}: Props) {
  const toggleMethod = (id: string) => {
    if (methods.includes(id)) {
      setMethods(
        methods.filter(
          (method) => method !== id
        )
      );
    } else {
      setMethods([...methods, id]);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-2 text-2xl font-semibold text-white">
        Metody spawania
      </h2>

      <p className="mb-8 text-gray-400">
        Wybierz metody stosowane przez firmę.
      </p>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">

        {METHODS.map((method) => (
          <MethodCard
            key={method.id}
            title={method.title}
            code={method.code}
            selected={methods.includes(method.id)}
            onClick={() =>
              toggleMethod(method.id)
            }
          />
        ))}

      </div>

    </div>
  );
}