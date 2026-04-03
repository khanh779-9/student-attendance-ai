import Button from "./ui/Button";

export default function Header({ title, subtitle, actionLabel, onAction }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Không gian làm việc</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs sm:text-sm">
          <div className="rounded-lg bg-white px-3 py-2 text-center">
            <small className="block text-[11px] text-slate-500">Trạng thái</small>
            <strong className="text-slate-800">Hoạt động</strong>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center">
            <small className="block text-[11px] text-slate-500">Giao diện</small>
            <strong className="text-slate-800">Sáng</strong>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center">
            <small className="block text-[11px] text-slate-500">Chế độ</small>
            <strong className="text-slate-800">Định tuyến</strong>
          </div>
        </div>
      </div>

      {actionLabel ? (
        <div className="mt-4">
          <Button
            onClick={onAction}
            variant="primary"
            size="lg"
            className="rounded-xl"
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
