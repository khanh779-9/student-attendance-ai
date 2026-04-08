import { NavLink } from "react-router-dom";
import Button from "./ui/Button";

const NAV_ITEMS = [
  { to: "/", label: "Trang chủ" },
  { to: "/newclass", label: "Quản lý lớp" },
  { to: "/sessions", label: "Buổi học" },
  { to: "/markattendence", label: "Điểm danh" },
  { to: "/register", label: "Đăng ký khuôn mặt" },
  { to: "/settings", label: "Thiết lập" },
];

export default function Navbar({ lecturer, onLogout }) {
  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 border-r border-slate-200 shadow-lg md:shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-10 flex flex-col h-auto md:h-screen sticky top-0 p-4 lg:p-5">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Hệ Thống Nhận Diện
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>Điểm Danh</span>
        </h1>
      </div>

      <div className="mt-6 mb-4 xl:mt-8 grid gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 relative overflow-hidden">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Giáo Viên
        </span>
        <strong className="text-base font-semibold text-slate-900 truncate">
          {lecturer || "Khách"}
        </strong>
      </div>

      <nav className="flex-1 grid gap-2 content-start overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "block no-underline rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <Button
          variant="secondary"
          size="lg"
          className="w-full rounded-xl justify-center"
          onClick={onLogout}
          type="button"
        >
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
