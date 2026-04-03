export default function TableShell({ children, className = "" }) {
  return (
    <div className={["mt-3 overflow-auto rounded-xl border border-slate-200", className].join(" ")}>
      {children}
    </div>
  );
}
