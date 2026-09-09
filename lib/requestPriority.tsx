export function isUrgentRequest(type?: string | null) {
  return type === "asap";
}

export function RequestPriorityMeta({
  type,
}: {
  type?: string | null;
}) {
  if (!isUrgentRequest(type)) return null;

  return (
    <>
      <span>•</span>
      <span className="text-orange-300">
        Pilne
      </span>
    </>
  );
}
