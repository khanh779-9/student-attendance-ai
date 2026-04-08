import FormField from "../components/ui/FormField";

export default function SettingsPage({
  isLoggedIn,
  threshold,
  setThreshold,
  rtIntervalMs,
  setRtIntervalMs,
}) {
  return (
    <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tùy chỉnh hệ thống
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Thiết lập
          </h2>
        </div>
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-800">
        Cài đặt hệ thống
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        Điều chỉnh các tham số dưới đây để phù hợp với yêu cầu của bạn.
      </p>

      <form className="mt-4">
        <fieldset className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">
            Tham số nhận diện
          </legend>

          <FormField
            label="Độ chính xác yêu cầu"
            hint="Mức độ tin cậy tối thiểu để hệ thống chấp nhận khuôn mặt (hiện tại: 95,777%)"
          >
            <input
              type="number"
              step="0.00001"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              disabled={!isLoggedIn}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FormField>

          <FormField
            label="Tốc độ quét camera"
            hint="Thời gian giữa mỗi lần quét (ms). Giá trị nhỏ = quét nhanh hơn"
          >
            <input
              type="number"
              step="100"
              value={rtIntervalMs}
              onChange={(e) => setRtIntervalMs(e.target.value)}
              disabled={!isLoggedIn}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FormField>
        </fieldset>
      </form>
    </section>
  );
}
