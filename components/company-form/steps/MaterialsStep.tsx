import MaterialCard from "../cards/MaterialCard";
import { MATERIALS } from "../constants/materials";

type Props = {
  materials: string[];
  setMaterials: (materials: string[]) => void;
};

export default function MaterialsStep({
  materials,
  setMaterials,
}: Props) {
  const toggleMaterial = (id: string) => {
    if (materials.includes(id)) {
      setMaterials(
        materials.filter(
          (material) => material !== id
        )
      );
    } else {
      setMaterials([...materials, id]);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-2 text-2xl font-semibold text-white">
        Materiały
      </h2>

      <p className="mb-8 text-gray-400">
        Wybierz materiały, z którymi pracuje firma.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {MATERIALS.map((material) => (
          <MaterialCard
            key={material.id}
            icon={material.icon}
            title={material.title}
            description={material.description}
            selected={materials.includes(material.id)}
            onClick={() =>
              toggleMaterial(material.id)
            }
          />
        ))}

      </div>

    </div>
  );
}