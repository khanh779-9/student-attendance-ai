const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || data.error || "Request failed");
  }
  return data;
}

export async function login(msgv, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgv, password }),
  });
}

export async function enrollFaceFile({ token, mssv, registeredByMsgv, file }) {
  const form = new FormData();
  form.append("mssv", mssv);
  if (registeredByMsgv) {
    form.append("registered_by_msgv", registeredByMsgv);
  }
  form.append("file", file);

  return request("/api/face/enroll-file", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export async function checkinFaceFile({ token, buoiHocId, file, threshold }) {
  const form = new FormData();
  form.append("buoi_hoc_id", String(buoiHocId));
  if (threshold !== "") {
    form.append("threshold", String(threshold));
  }
  form.append("file", file);

  return request("/api/attendance/checkin-file", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export async function listClasses(token) {
  return request("/api/classes", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createClass({ token, maLop, tenLop, nienKhoa, hocKy }) {
  return request("/api/classes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ma_lop: maLop,
      ten_lop: tenLop,
      nien_khoa: nienKhoa || null,
      hoc_ky: hocKy || null,
    }),
  });
}

export async function listStudents(token, maLop = "") {
  const q = maLop ? `?ma_lop=${encodeURIComponent(maLop)}` : "";
  return request(`/api/students${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createStudent({ token, mssv, hoTenSv, lop }) {
  return request("/api/students", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mssv,
      ho_ten_sv: hoTenSv,
      lop,
    }),
  });
}

export async function updateClass({ token, maLop, tenLop, nienKhoa, hocKy }) {
  return request(`/api/classes/${encodeURIComponent(maLop)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ten_lop: tenLop,
      nien_khoa: nienKhoa || null,
      hoc_ky: hocKy || null,
    }),
  });
}

export async function updateStudent({ token, mssv, hoTenSv, lop }) {
  return request(`/api/students/${encodeURIComponent(mssv)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ho_ten_sv: hoTenSv,
      lop,
    }),
  });
}

export async function getAttendanceSessionStats({ token, buoiHocId }) {
  return request(`/api/attendance/session/${encodeURIComponent(buoiHocId)}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listSessions(token, maLop = "") {
  const q = maLop ? `?ma_lop=${encodeURIComponent(maLop)}` : "";
  return request(`/api/sessions${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSession({ token, maLop, tieuDe, scheduledStart, scheduledEnd }) {
  return request("/api/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ma_lop: maLop,
      tieu_de: tieuDe || null,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
    }),
  });
}

export async function startSession({ token, buoiHocId }) {
  return request(`/api/sessions/${encodeURIComponent(buoiHocId)}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function endSession({ token, buoiHocId }) {
  return request(`/api/sessions/${encodeURIComponent(buoiHocId)}/end`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAttendanceSessionHistory({ token, buoiHocId }) {
  return request(`/api/attendance/session/${encodeURIComponent(buoiHocId)}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAttendanceSessionHistoryCsvUrl(buoiHocId) {
  return `${API_BASE}/api/attendance/session/${encodeURIComponent(buoiHocId)}/history.csv`;
}

export async function getClassFaceDiagnostic({ token, maLop }) {
  return request(`/api/face/class-diagnostic/${encodeURIComponent(maLop)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { API_BASE };
