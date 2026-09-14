import Image from "next/image";
import {
  getRequestCategoryImage,
  getRequestCategoryLabel,
} from "@/lib/requestCategories";

type RequestCategoryImageProps = {
  category?: string | null;
  title?: string | null;
  className?: string;
};

export default function RequestCategoryImage({
  category,
  title,
  className = "",
}: RequestCategoryImageProps) {
  const imageSrc = getRequestCategoryImage(category);
  const label = getRequestCategoryLabel(category);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#070b10] p-2 ${className}`}
    >
      <Image
        src={imageSrc}
        alt={category || title || label}
        width={64}
        height={64}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
