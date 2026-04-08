const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.detail || data.message || data.error || "Request failed",
    );
  }
  return data;
}

export async function login(msgv, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgv, password }),
  });
  return {
    accessToken: data.accessToken,
    teacherName: data.teacherName,
    teacherId: data.teacherId,
  };
}

export async function enrollFaceFile({ token, studentId, file }) {
  const form = new FormData();
  form.append("student_id", studentId);
  form.append("file", file);

  return request("/api/face/enroll-file", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export async function checkinFaceFile({ token, buoiHocId, file, threshold }) {
  const form = new FormData();
  form.append("session_id", String(buoiHocId));
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
      id: maLop,
      name: tenLop,
    }),
  });
}

export async function listStudents(token, maLop = "") {
  const q = maLop ? `?class_id=${encodeURIComponent(maLop)}` : "";
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
      id: mssv,
      name: hoTenSv,
      classId: lop,
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
      name: tenLop,
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
      name: hoTenSv,
      classId: lop,
    }),
  });
}

export async function getAttendanceSessionStats({ token, buoiHocId }) {
  return request(
    `/api/attendance/session/${encodeURIComponent(buoiHocId)}/stats`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function listSessions(token, maLop = "") {
  const q = maLop ? `?class_id=${encodeURIComponent(maLop)}` : "";
  return request(`/api/sessions${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSession({
  token,
  maLop,
  scheduledStart,
  scheduledEnd,
}) {
  return request("/api/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      classId: maLop,
      scheduledStart: scheduledStart || null,
      scheduledEnd: scheduledEnd || null,
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
  return request(
    `/api/attendance/session/${encodeURIComponent(buoiHocId)}/history`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
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
