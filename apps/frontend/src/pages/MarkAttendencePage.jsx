import Button from "../components/ui/Button";
import StatusPill from "../components/ui/StatusPill";
import TableShell from "../components/ui/TableShell";

export default function MarkAttendencePage({
  isLoggedIn,
  buoiHocId,
  startRealtime,
  stopRealtime,
  streaming,
  detectFromCurrentFrame,
  rtMessage,
  lastIdentity,
  lastDistance,
  stats,
  videoRef,
  canvasRef,
  manualFile,
  setManualFile,
  handleManualCheckin,
  manualMessage,
  loadAttendanceStats,
  loadAttendanceRecords,
  historyRows,
}) {
  function getResultTone(message) {
    const msg = String(message || "").toLowerCase();
    if (!msg.trim()) return "neutral";
    if (msg.includes("dang ")) return "pending";
    if (
      msg.includes("thất bại") ||
      msg.includes("lỗi") ||
      msg.includes("không đạt") ||
      msg.includes("không phát hiện") ||
      msg.includes("nhiều khuôn mặt")
    ) {
      return "error";
    }
    if (
      msg.includes("present") ||
      msg.includes("thành công") ||
      msg.includes("nhận diện được")
    ) {
      return "success";
    }
    return "neutral";
  }

  const rtTone = getResultTone(rtMessage);
  const manualTone = getResultTone(manualMessage);

  const resultToneClass = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    error: "border-rose-300 bg-rose-50 text-rose-800",
    pending: "border-amber-300 bg-amber-50 text-amber-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Điểm danh</h2>
        </div>
        <Button
          onClick={loadAttendanceStats}
          disabled={!isLoggedIn}
          size="lg"
        >
          Tải thống kê
        </Button>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid content-start gap-4">
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            <label className="grid gap-2">
              ID buổi học
              <input
                type="text"
                value={buoiHocId}
                disabled
                placeholder="Chưa chọn"
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600"
              />
            </label>
          </div>

          <div className="grid gap-2">
            {!streaming ? (
              <Button
                onClick={startRealtime}
                disabled={!isLoggedIn}
              >
                Bắt đầu camera
              </Button>
            ) : (
              <Button type="button" onClick={stopRealtime} variant="danger">
                Dừng camera
              </Button>
            )}
            <Button
              type="button"
              onClick={detectFromCurrentFrame}
              disabled={!isLoggedIn || !streaming}
              variant="secondary"
            >
              Quét khung hiện tại
            </Button>
          </div>

          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Danh tính gần nhất:
            <strong className="mt-1 block text-slate-900">{lastIdentity || "—"}</strong>
            {lastDistance !== null && (
              <span className="block text-xs text-slate-500">Score: {Number(lastDistance).toFixed(4)}</span>
            )}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 mb-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-slate-500">Tổng SV</small>
              <strong className="mt-1 block text-3xl font-bold text-slate-900">{stats?.total_students ?? 0}</strong>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-emerald-700">Có mặt</small>
              <strong className="mt-1 block text-3xl font-bold text-emerald-800">{stats?.present_count ?? 0}</strong>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-amber-700">Muộn</small>
              <strong className="mt-1 block text-3xl font-bold text-amber-800">{stats?.late_count ?? 0}</strong>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-rose-700">Vắng</small>
              <strong className="mt-1 block text-3xl font-bold text-rose-800">{stats?.absent_count ?? 0}</strong>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-indigo-700">Được phép</small>
              <strong className="mt-1 block text-3xl font-bold text-indigo-800">{stats?.excused_count ?? 0}</strong>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <small className="text-sm font-medium text-blue-700">Nhận diện OK</small>
              <strong className="mt-1 block text-3xl font-bold text-blue-800">{stats?.recognized_count ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${resultToneClass[rtTone]}`}>
            {rtMessage || "Chưa có kết quả realtime."}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
            <div className="relative">
              <video ref={videoRef} playsInline muted className="video-mirror block h-[420px] w-full object-cover" />
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-slate-950/10" />
                <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-emerald-400/95 bg-emerald-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)] sm:h-72 sm:w-72 md:h-80 md:w-80">
                  <div className="absolute left-1/2 top-1/2 h-px w-20 -translate-x-1/2 -translate-y-1/2 bg-emerald-300/90" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-px -translate-x-1/2 -translate-y-1/2 bg-emerald-300/90" />
                  <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-sm text-center">
                    Đưa mặt vào khung này
                  </div>
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden-canvas select-none" />
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-800">Check-in bằng ảnh</h3>
            <form
              className="grid gap-3 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-medium [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2"
              onSubmit={handleManualCheckin}
            >
              <label>
                Ảnh check-in
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                />
              </label>
              <Button type="submit" disabled={!isLoggedIn}>
                Check-in từ tệp
              </Button>
            </form>
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              Lưu ý: Ảnh chỉ nên có 1 khuôn mặt rõ ràng.
            </p>
            <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${resultToneClass[manualTone]}`}>
              {manualMessage || "Chưa có kết quả check-in."}
            </div>
          </div>
        </div>
      </div>

      <hr className="my-5 border-slate-200" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Danh sách điểm danh</h3>
        </div>
        <Button
          type="button"
          onClick={loadAttendanceRecords}
          disabled={!isLoggedIn || !buoiHocId}
          variant="secondary"
        >
          Làm mới
        </Button>
      </div>

      <TableShell>
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-100 text-left text-sm text-slate-600">
            <tr>
              <th className="px-3 py-3">MSSV</th>
              <th className="px-3 py-3">Họ tên</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3">Giờ check-in</th>
              <th className="px-3 py-3">Độ tin cậy</th>
            </tr>
          </thead>
          <tbody>
            {historyRows && historyRows.length > 0 ? (
              historyRows.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-200 text-sm text-slate-700">
                  <td className="px-3 py-3">{row.mssv}</td>
                  <td className="px-3 py-3">{row.ho_ten_sv}</td>
                  <td className="px-3 py-3">
                    <StatusPill value={row.attendance_status} />
                  </td>
                  <td className="px-3 py-3">
                    {row.check_in_time
                      ? new Date(row.check_in_time).toLocaleTimeString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-3 py-3">
                    {row.confidence_score
                      ? Number(row.confidence_score).toFixed(4)
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </section>
  );
}
