const STATUS_CLASSES = {
  PRESENT: "bg-emerald-100 text-emerald-800",
  ABSENT: "bg-rose-100 text-rose-800",
  LATE: "bg-amber-100 text-amber-800",
  EXCUSED: "bg-sky-100 text-sky-800",
  neutral: "bg-slate-100 text-slate-700",
};

export default function StatusPill({ value, className = "" }) {
  const tone = STATUS_CLASSES[value] || STATUS_CLASSES.neutral;
  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone, className].join(" ")}>
      {value || "-"}
    </span>
  );
}
