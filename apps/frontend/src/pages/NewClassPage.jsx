import Modal from "../components/Modal";
import { useState } from "react";
import Button from "../components/ui/Button";
import TableShell from "../components/ui/TableShell";

export default function NewClassPage({
  isLoggedIn,
  classMessage,
  handleCreateClass,
  maLop,
  setMaLop,
  tenLop,
  setTenLop,
  nienKhoa,
  setNienKhoa,
  hocKy,
  setHocKy,
  loadClasses,
  classRows,
  studentRows,
  studentMessage,
  handleCreateStudent,
  studentMssv,
  setStudentMssv,
  studentHoTen,
  setStudentHoTen,
  studentLop,
  setStudentLop,
  loadStudents,
  studentFilterLop,
  setStudentFilterLop,
  handleFilterStudents,
  editingClassMaLop,
  setEditingClassMaLop,
  handleEditClass,
  editingStudentMssv,
  setEditingStudentMssv,
  handleEditStudent,
}) {
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  const handleCreateAndClose = async (e) => {
    e.preventDefault();
    await handleCreateClass(e);
    setShowClassModal(false);
  };

  const handleAddStudentAndClose = async (e) => {
    e.preventDefault();
    await handleCreateStudent(e);
    setShowStudentModal(false);
  };

  const handleEditClassAndClose = async (e) => {
    e.preventDefault();
    await handleEditClass(e);
    setShowEditClassModal(false);
  };

  const handleEditStudentAndClose = async (e) => {
    e.preventDefault();
    await handleEditStudent(e);
    setShowEditStudentModal(false);
  };

  const openEditClassModal = (classRow) => {
    setMaLop("");
    setTenLop(classRow.TenLop);
    setNienKhoa(classRow.NienKhoa || "");
    setHocKy(classRow.HocKy || "");
    setEditingClassMaLop(classRow.MaLop);
    setShowEditClassModal(true);
  };

  const openEditStudentModal = (studentRow) => {
    setStudentMssv("");
    setStudentHoTen(studentRow.Ho_Ten_SV);
    setStudentLop(studentRow.Lop);
    setEditingStudentMssv(studentRow.MSSV);
    setShowEditStudentModal(true);
  };

  return (
    <>
      <section className="rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quản lý lớp</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Lớp học mới</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => loadClasses()}
              disabled={!isLoggedIn}
              variant="secondary"
            >
              Tải lại danh sách lớp
            </Button>
            <Button
              onClick={() => setShowClassModal(true)}
              disabled={!isLoggedIn}
            >
              + Thêm lớp mới
            </Button>
          </div>
        </div>

        <h3 className="mt-5 text-base font-semibold text-slate-800">Danh sách lớp học</h3>
        <TableShell>
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-left text-sm text-slate-600">
              <tr>
                <th className="px-3 py-3">Mã lớp</th>
                <th className="px-3 py-3">Tên lớp</th>
                <th className="px-3 py-3">Niên khóa</th>
                <th className="px-3 py-3">Học kỳ</th>
                <th className="px-3 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {classRows.map((row) => (
                <tr key={row.MaLop} className="border-t border-slate-200 text-sm text-slate-700">
                  <td className="px-3 py-3">{row.MaLop}</td>
                  <td className="px-3 py-3">{row.TenLop}</td>
                  <td className="px-3 py-3">{row.NienKhoa || "-"}</td>
                  <td className="px-3 py-3">{row.HocKy || "-"}</td>
                  <td className="px-3 py-3">
                    <Button type="button" onClick={() => openEditClassModal(row)} size="sm" variant="secondary">
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <hr className="my-5 border-slate-200" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Sinh viên</h3>
          </div>
          <Button
            onClick={() => setShowStudentModal(true)}
            disabled={!isLoggedIn}
          >
            + Thêm sinh viên
          </Button>
        </div>

        <form
          className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_200px] [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-medium [&_input]:rounded-lg [&_input]:border-slate-300 [&_input]:shadow-sm [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500 [&_input]:transition-colors"
          onSubmit={(e) => {
            e.preventDefault();
            handleFilterStudents();
          }}
        >
          <label>
            Tìm kiếm sinh viên
            <input
              value={studentFilterLop}
              onChange={(e) => setStudentFilterLop(e.target.value)}
              placeholder="Nhập mã lớp (VD: CTK42) và nhấn Enter, hoặc để trống để xem tất cả..."
            />
          </label>
          <Button
            type="submit"
            disabled={!isLoggedIn}
          >
            Lọc / Tải danh sách
          </Button>
        </form>

        <TableShell>
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-left text-sm text-slate-600">
              <tr>
                <th className="px-3 py-3">Mã SV</th>
                <th className="px-3 py-3">Họ tên</th>
                <th className="px-3 py-3">Lớp</th>
                <th className="px-3 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((row) => (
                <tr key={row.MSSV} className="border-t border-slate-200 text-sm text-slate-700">
                  <td className="px-3 py-3">{row.MSSV}</td>
                  <td className="px-3 py-3">{row.Ho_Ten_SV}</td>
                  <td className="px-3 py-3">{row.Lop}</td>
                  <td className="px-3 py-3">
                    <Button type="button" onClick={() => openEditStudentModal(row)} size="sm" variant="secondary">
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>

      <Modal isOpen={showClassModal} title="Tạo lớp học mới" onClose={() => setShowClassModal(false)}>
        <form onSubmit={handleCreateAndClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              Mã lớp
              <input value={maLop} onChange={(e) => setMaLop(e.target.value)} placeholder="VD: CTK42" required />
            </label>
            <label>
              Tên lớp
              <input value={tenLop} onChange={(e) => setTenLop(e.target.value)} placeholder="VD: Công nghệ thông tin" required />
            </label>
            <label>
              Niên khóa
              <input value={nienKhoa} onChange={(e) => setNienKhoa(e.target.value)} placeholder="VD: 2024" />
            </label>
            <label>
              Học kỳ
              <input value={hocKy} onChange={(e) => setHocKy(e.target.value)} placeholder="VD: I" />
            </label>
            <button type="submit" disabled={!isLoggedIn}>Tạo lớp</button>
          </div>
          {classMessage && <p className="text-sm text-slate-600">{classMessage}</p>}
        </form>
      </Modal>

      <Modal isOpen={showStudentModal} title="Thêm sinh viên" onClose={() => setShowStudentModal(false)}>
        <form onSubmit={handleAddStudentAndClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              Mã số sinh viên
              <input value={studentMssv} onChange={(e) => setStudentMssv(e.target.value)} placeholder="VD: SV001" required />
            </label>
            <label>
              Họ tên sinh viên
              <input value={studentHoTen} onChange={(e) => setStudentHoTen(e.target.value)} placeholder="VD: Nguyễn Văn A" required />
            </label>
            <label>
              Lớp
              <input value={studentLop} onChange={(e) => setStudentLop(e.target.value)} placeholder="VD: CTK42" required />
            </label>
            <button type="submit" disabled={!isLoggedIn}>Thêm sinh viên</button>
          </div>
          {studentMessage && <p className="text-sm text-slate-600">{studentMessage}</p>}
        </form>
      </Modal>

      <Modal isOpen={showEditClassModal} title="Chỉnh sửa lớp học" onClose={() => setShowEditClassModal(false)}>
        <form onSubmit={handleEditClassAndClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              Mã lớp (không thể sửa)
              <input value={editingClassMaLop || ""} disabled />
            </label>
            <label>
              Tên lớp
              <input value={tenLop} onChange={(e) => setTenLop(e.target.value)} required />
            </label>
            <label>
              Niên khóa
              <input value={nienKhoa} onChange={(e) => setNienKhoa(e.target.value)} />
            </label>
            <label>
              Học kỳ
              <input value={hocKy} onChange={(e) => setHocKy(e.target.value)} />
            </label>
            <button type="submit" disabled={!isLoggedIn}>Cập nhật lớp</button>
          </div>
          {classMessage && <p className="text-sm text-slate-600">{classMessage}</p>}
        </form>
      </Modal>

      <Modal isOpen={showEditStudentModal} title="Chỉnh sửa sinh viên" onClose={() => setShowEditStudentModal(false)}>
        <form onSubmit={handleEditStudentAndClose}>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              Mã số sinh viên (không thể sửa)
              <input value={editingStudentMssv || ""} disabled />
            </label>
            <label>
              Họ tên sinh viên
              <input value={studentHoTen} onChange={(e) => setStudentHoTen(e.target.value)} required />
            </label>
            <label>
              Lớp
              <input value={studentLop} onChange={(e) => setStudentLop(e.target.value)} required />
            </label>
            <button type="submit" disabled={!isLoggedIn}>Cập nhật sinh viên</button>
          </div>
          {studentMessage && <p className="text-sm text-slate-600">{studentMessage}</p>}
        </form>
      </Modal>
    </>
  );
}

