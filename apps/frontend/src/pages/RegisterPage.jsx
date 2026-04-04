import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

export default function RegisterPage({
  isLoggedIn,
  enrollMssv,
  setEnrollMssv,
  enrollFile,
  setEnrollFile,
  handleEnroll,
  enrollMessage,
}) {
  return (
    <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Đăng ký
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Đăng ký khuôn mặt
          </h2>
        </div>
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-800">
        Đăng ký dữ liệu khuôn mặt sinh viên
      </h3>
      <form className="mt-3 grid gap-4 md:grid-cols-2" onSubmit={handleEnroll}>
        <FormField label="Mã số sinh viên">
          <input
            value={enrollMssv}
            onChange={(e) => setEnrollMssv(e.target.value)}
            placeholder="VD: SV001"
          />
        </FormField>
        <FormField label="Ảnh khuôn mặt">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setEnrollFile(e.target.files?.[0] || null)}
          />
        </FormField>
        <Button
          type="submit"
          disabled={!isLoggedIn}
          size="lg"
          className="h-fit self-end"
        >
          Đăng ký ArcFace
        </Button>
      </form>
      <p className="mt-3 text-sm text-slate-600">{enrollMessage}</p>
    </section>
  );
}
