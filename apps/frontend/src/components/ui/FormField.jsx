export default function FormField({ label, hint, className = "", children }) {
  const fieldStyles = "block w-full rounded-lg border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200";

  return (
    <div className={`block ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {hint && <span className="block mt-1 text-xs font-normal text-slate-500">{hint}</span>}
      </label>
      <div className={`[&_input]:${fieldStyles.split(" ").join(" [&_input]:")} [&_select]:${fieldStyles.split(" ").join(" [&_select]:")}`}>
        {children}
      </div>
    </div>
  );
}
