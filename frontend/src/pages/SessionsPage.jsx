import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import StatusPill from "../components/ui/StatusPill";
import TableShell from "../components/ui/TableShell";

export default function SessionsPage({
  isLoggedIn,
  sessionMessage,
  handleCreateSession,
  sessionMaLop,
  setSessionMaLop,
  sessionStart,
  setSessionStart,
  sessionEnd,
  setSessionEnd,
  loadSessions,
  sessionRows,
  sessionFilterLop,
  setSessionFilterLop,
  handleFilterSessions,
  setBuoiHocId,
  historyRows,
  historyMessage,
  handleLoadHistory,
  handleExportHistoryCsv,
  handleStartSession,
  handleEndSession,
  checkClassFaceStatus,
  diagnosticData,
  showDiagnostic,
  setShowDiagnostic,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    const state = location.state || {};
    if (state.classId) {
      setSessionMaLop(state.classId);
    }
    if (state.openCreateModal) {
      setShowSessionModal(true);
    }
  }, [location.state, setSessionMaLop]);

  const handleCreateAndClose = async (e) => {
    e.preventDefault();
    await handleCreateSession(e);
    setShowSessionModal(false);
  };

  const handleStartAndCheckin = async (buoiHocId) => {
    await handleStartSession(buoiHocId);
    setBuoiHocId(String(buoiHocId));
    setTimeout(() => navigate("/markattendence"), 500);
  };

  const formatCheckinTime = (value) => {
    if (!value) return "-";
    const raw = String(value);
    const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);
    const iso = hasZone ? raw : `${raw}Z`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Buổi học
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Buổi học
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => loadSessions()}
              disabled={!isLoggedIn}
              variant="secondary"
            >
              Tải lại
            </Button>
            <Button
              onClick={() => setShowSessionModal(true)}
              disabled={!isLoggedIn}
            >
              + Tạo buổi học
            </Button>
          </div>
        </div>

        <form
          className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_200px] [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-medium [&_input]:rounded-lg [&_input]:border-slate-300 [&_input]:shadow-sm [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500 [&_input]:transition-colors"
          onSubmit={(e) => {
            e.preventDefault();
            handleFilterSessions();
          }}
        >
          <label>
            Lọc buổi học theo mã lớp
            <input
              value={sessionFilterLop}
              onChange={(e) => setSessionFilterLop(e.target.value)}
              placeholder="Nhập mã lớp (VD: CTK42) và nhấn Enter, hoặc để trống để xem tất cả..."
            />
          </label>
          <Button type="submit" disabled={!isLoggedIn}>
            Lọc / Tải lại
          </Button>
        </form>

        <TableShell>
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-left text-sm text-slate-600">
              <tr>
                <th className="px-3 py-3">ID buổi học</th>
                <th className="px-3 py-3">Mã lớp</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sessionRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-200 text-sm text-slate-700"
                >
                  <td className="px-3 py-3">{row.id}</td>
                  <td className="px-3 py-3">{row.classId}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status === "PENDING" && (
                        <Button
                          type="button"
                          onClick={() => handleStartAndCheckin(row.id)}
                          title="Bắt đầu buổi và chuyển sang điểm danh"
                          size="sm"
                        >
                          Bắt đầu & Điểm danh
                        </Button>
                      )}
                      {row.status === "OPEN" && (
                        <>
                          <Button
                            type="button"
                            onClick={() =>
                              navigate("/markattendence", {
                                state: { sessionId: row.id },
                              })
                            }
                            title="Chuyển sang điểm danh"
                            size="sm"
                          >
                            Điểm danh
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleEndSession(row.id)}
                            title="Kết thúc buổi học"
                            size="sm"
                            variant="danger"
                          >
                            Kết thúc
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        onClick={() => checkClassFaceStatus(row.classId)}
                        title="Kiểm tra trạng thái khuôn mặt sinh viên"
                        size="sm"
                        variant="secondary"
                      >
                        Check Faces
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setBuoiHocId(String(row.id));
                          handleLoadHistory();
                        }}
                        title="Xem lịch sử điểm danh"
                        size="sm"
                        variant="secondary"
                      >
                        Lịch sử
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <hr className="my-5 border-slate-200" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Lịch sử điểm danh
            </h3>
          </div>
          <div>
            <Button
              type="button"
              onClick={handleExportHistoryCsv}
              disabled={!isLoggedIn || historyRows.length === 0}
              variant="secondary"
            >
              Xuất CSV
            </Button>
          </div>
        </div>

        {historyMessage && (
          <p className="mt-3 text-sm text-slate-600">{historyMessage}</p>
        )}

        {historyRows.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <strong>Tóm tắt:</strong>{" "}
            {historyRows.filter((r) => r.attendanceStatus === "PRESENT").length}{" "}
            Có mặt |{" "}
            {historyRows.filter((r) => r.attendanceStatus === "ABSENT").length}{" "}
            Vắng |{" "}
            {historyRows.filter((r) => r.attendanceStatus === "LATE").length}{" "}
            Muộn
          </div>
        )}

        <TableShell>
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-left text-sm text-slate-600">
              <tr>
                <th className="px-3 py-3">Mã SV</th>
                <th className="px-3 py-3">Họ tên</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Thời gian check-in</th>
                <th className="px-3 py-3">Độ tin cậy</th>
                <th className="px-3 py-3">Phương thức</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length > 0 ? (
                historyRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-slate-200 text-sm text-slate-700"
                  >
                    <td className="px-3 py-3">{row.studentId}</td>
                    <td className="px-3 py-3">{row.studentName}</td>
                    <td className="px-3 py-3">
                      <StatusPill value={row.attendanceStatus} />
                    </td>
                    <td className="px-3 py-3">
                      {formatCheckinTime(row.checkinTime)}
                    </td>
                    <td className="px-3 py-3">
                      {row.confidenceScore
                        ? Number(row.confidenceScore).toFixed(4)
                        : "-"}
                    </td>
                    <td className="px-3 py-3">{row.checkinMethod || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-3 py-6 text-center text-sm text-slate-500"
                  >
                    Chưa có dữ liệu. Chọn buổi học ở trên để xem lịch sử
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
      </section>

      <Modal
        isOpen={showSessionModal}
        title="Tạo buổi học mới"
        onClose={() => setShowSessionModal(false)}
      >
        <form onSubmit={handleCreateAndClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              Mã lớp
              <input
                value={sessionMaLop}
                onChange={(e) => setSessionMaLop(e.target.value)}
                placeholder="VD: CTK42"
                required
              />
            </label>
            <label>
              Giờ bắt đầu
              <input
                type="datetime-local"
                value={sessionStart}
                onChange={(e) => setSessionStart(e.target.value)}
                required
              />
            </label>
            <label>
              Giờ kết thúc
              <input
                type="datetime-local"
                value={sessionEnd}
                onChange={(e) => setSessionEnd(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={!isLoggedIn}>
              Tạo phiên
            </button>
          </div>
          {sessionMessage && (
            <p className="text-sm text-slate-600">{sessionMessage}</p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={showDiagnostic}
        title="Kiểm tra trạng thái khuôn mặt"
        onClose={() => setShowDiagnostic(false)}
      >
        {diagnosticData && !diagnosticData.error ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <strong>Lớp: {diagnosticData.classId}</strong>
              <br />
              <span>
                {diagnosticData.studentsWithFaces}/
                {diagnosticData.totalStudents} sinh viên đã đăng kí khuôn mặt
              </span>
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-100 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-3 py-3">MSSV</th>
                    <th className="px-3 py-3">Họ tên</th>
                    <th className="px-3 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticData.students.map((student, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-slate-200 text-sm text-slate-700"
                    >
                      <td className="px-3 py-3">{student.studentId}</td>
                      <td className="px-3 py-3">{student.studentName}</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          value={
                            student.faceCount > 0
                              ? `${student.faceCount}`
                              : "Chưa"
                          }
                          className={
                            student.faceCount > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {diagnosticData.studentsWithoutFaces > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Cảnh báo:</strong> {diagnosticData.studentsWithoutFaces}{" "}
                sinh viên chưa đăng kí khuôn mặt. Vui lòng sử dụng tab "Đăng ký
                dữ liệu khuôn mặt" để hoàn tất.
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-rose-700">
            {diagnosticData?.error || "Đang tải..."}
          </p>
        )}
      </Modal>
    </>
  );
}
