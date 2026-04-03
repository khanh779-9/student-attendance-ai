import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

export default function HomePage({ classRows, loadClasses, classMessage, isLoggedIn }) {
  const navigate = useNavigate();

  return (
    <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Lớp học hiện tại</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Trang chủ</h2>
        </div>
        <Button
          onClick={() => loadClasses()}
          disabled={!isLoggedIn}
          size="lg"
          className="rounded-xl"
        >
          Tải lại danh sách
        </Button>
      </div>

      <p className="mt-4 text-sm text-slate-600">{classMessage || "Các lớp học của bạn sẽ hiển thị ở đây"}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {classRows.map((course) => (
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-md hover:shadow-lg transition-shadow" key={course.MaLop}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{course.TenLop}</h3>
                <p className="text-sm text-slate-500">{course.MaLop}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{course.HocKy || "Không rõ học kỳ"}</span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p><span className="font-medium text-slate-700">Niên khóa:</span> {course.NienKhoa || "-"}</p>
              <p><span className="font-medium text-slate-700">Giáo viên:</span> {course.CreatedByMSGV || "-"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => navigate("/sessions")}>Tạo buổi học</Button>
              <Button type="button" onClick={() => navigate("/newclass")} variant="secondary">Chi tiết lớp</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
