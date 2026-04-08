export default function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-200 text-slate-800 transition hover:bg-slate-300"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-medium [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_input]:text-slate-700 [&_input]:outline-none focus-within:[&_input]:border-slate-500 [&_button]:rounded-lg [&_button]:bg-slate-900 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-white [&_button]:transition hover:[&_button]:bg-slate-800 disabled:[&_button]:cursor-not-allowed disabled:[&_button]:opacity-50">
          {children}
        </div>
      </div>
    </div>
  );
}
