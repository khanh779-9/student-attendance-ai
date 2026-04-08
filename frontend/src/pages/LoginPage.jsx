import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

export default function LoginPage({
  msgv,
  setMsgv,
  password,
  setPassword,
  handleLogin,
  authMessage,
  isLoggedIn,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4">
      <section className="grid w-full max-w-5xl gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="grid content-center gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Hệ thống nhận diện
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Điểm danh khuôn mặt
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Hệ thống điểm danh tự động bằng công nghệ nhận diện khuôn mặt. Đơn
            giản, nhanh chóng và chính xác.
          </p>
        </div>

        <form
          className="grid content-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={handleLogin}
        >
          <FormField label="Mã giáo viên">
            <input
              value={msgv}
              onChange={(e) => setMsgv(e.target.value)}
              placeholder="VD: GV001"
            />
          </FormField>
          <FormField label="Mật khẩu">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </FormField>
          <Button type="submit" size="lg" className="mt-1">
            Đăng nhập
          </Button>
        </form>

        <p className="text-sm text-slate-500">
          {authMessage || "Đăng nhập để truy cập hệ thống"}
        </p>
      </section>
    </div>
  );
}
