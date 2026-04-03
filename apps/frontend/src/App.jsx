import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  checkinFaceFile,
  createClass,
  createSession,
  createStudent,
  endSession,
  enrollFaceFile,
  getAttendanceSessionHistory,
  getAttendanceSessionHistoryCsvUrl,
  getAttendanceSessionStats,
  getClassFaceDiagnostic,
  listClasses,
  listSessions,
  listStudents,
  login,
  startSession,
  updateClass,
  updateStudent,
} from "./api";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MarkAttendencePage from "./pages/MarkAttendencePage";
import NewClassPage from "./pages/NewClassPage";
import RegisterPage from "./pages/RegisterPage";
import SessionsPage from "./pages/SessionsPage";
import SettingsPage from "./pages/SettingsPage";

const TABS = [
  { key: "classes", label: "Tạo lớp học" },
  { key: "students", label: "Sinh viên" },
  { key: "enroll", label: "Đăng ký dữ liệu khuôn mặt" },
  { key: "attendance", label: "Điểm danh thời gian thực" },
  { key: "history", label: "Lịch sử và xuất file" },
  { key: "settings", label: "Thiết lập" },
];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [lecturer, setLecturer] = useState(localStorage.getItem("lecturer") || "");
  const [activeTab, setActiveTab] = useState("attendance");
  const [msgv, setMsgv] = useState("GV001");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [enrollMssv, setEnrollMssv] = useState("SV001");
  const [enrollFile, setEnrollFile] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState("");

  const [classRows, setClassRows] = useState([]);
  const [classMessage, setClassMessage] = useState("");
  const [maLop, setMaLop] = useState("");
  const [tenLop, setTenLop] = useState("");
  const [nienKhoa, setNienKhoa] = useState("");
  const [hocKy, setHocKy] = useState("");

  const [studentRows, setStudentRows] = useState([]);
  const [studentMessage, setStudentMessage] = useState("");
  const [studentMssv, setStudentMssv] = useState("");
  const [studentHoTen, setStudentHoTen] = useState("");
  const [studentLop, setStudentLop] = useState("");
  const [studentFilterLop, setStudentFilterLop] = useState("");

  const [editingClassMaLop, setEditingClassMaLop] = useState(null);
  const [editingStudentMssv, setEditingStudentMssv] = useState(null);

  const [sessionRows, setSessionRows] = useState([]);
  const [sessionMessage, setSessionMessage] = useState("");
  const [sessionMaLop, setSessionMaLop] = useState("");
  const [sessionTieuDe, setSessionTieuDe] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionFilterLop, setSessionFilterLop] = useState("");

  const [historyRows, setHistoryRows] = useState([]);
  const [historyMessage, setHistoryMessage] = useState("");

  const [diagnosticData, setDiagnosticData] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const [buoiHocId, setBuoiHocId] = useState("1");
  const [threshold, setThreshold] = useState("0.04223");
  const [manualFile, setManualFile] = useState(null);
  const [manualMessage, setManualMessage] = useState("");

  const [streaming, setStreaming] = useState(false);
  const [rtIntervalMs, setRtIntervalMs] = useState("1200");
  const [rtMessage, setRtMessage] = useState("");
  const [lastIdentity, setLastIdentity] = useState("Chưa nhận diện");
  const [lastDistance, setLastDistance] = useState(null);
  const [checking, setChecking] = useState(false);
  const [stats, setStats] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const checkingRef = useRef(false);

  const isLoggedIn = Boolean(token);
  const activeTabLabel = TABS.find((tab) => tab.key === activeTab)?.label || "";

  function normalizeFaceError(message) {
    const msg = String(message || "").toLowerCase();
    if (msg.includes("nhiều khuôn mặt")) {
      return "Ảnh có nhiều khuôn mặt. Vui lòng dùng ảnh chỉ có 1 người.";
    }
    if (msg.includes("không phát hiện khuôn mặt")) {
      return "Không phát hiện khuôn mặt. Vui lòng dùng ảnh rõ mặt hơn.";
    }
    return message;
  }

  async function detectFaceCountFromBlob(blob) {
    if (!blob || typeof window.FaceDetector === "undefined") {
      return null;
    }

    let imageBitmap = null;
    try {
      imageBitmap = await createImageBitmap(blob);
      const detector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 5,
      });
      const faces = await detector.detect(imageBitmap);
      return Array.isArray(faces) ? faces.length : 0;
    } catch {
      return null;
    } finally {
      if (imageBitmap && typeof imageBitmap.close === "function") {
        imageBitmap.close();
      }
    }
  }

  async function validateSingleFaceInput(blob) {
    const count = await detectFaceCountFromBlob(blob);
    if (count === 0) {
      throw new Error("Không phát hiện khuôn mặt trong ảnh.");
    }
    if (count > 1) {
      throw new Error("Phát hiện nhiều khuôn mặt trong ảnh. Vui lòng chỉ để 1 khuôn mặt.");
    }
  }

  useEffect(() => {
    return () => {
      stopRealtime();
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadClasses();
    loadStudents();
    loadSessions();
  }, [isLoggedIn]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthMessage("Đang đăng nhập...");
    try {
      const data = await login(msgv, password);
      setToken(data.access_token);
      setLecturer(data.ho_ten);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("lecturer", data.ho_ten);
      setAuthMessage(`Xin chao ${data.ho_ten}`);
      setPassword("");
    } catch (error) {
      setAuthMessage(`Đăng nhập thất bại: ${error.message}`);
    }
  }

  function handleLogout() {
    stopRealtime();
    setToken("");
    setLecturer("");
    localStorage.removeItem("token");
    localStorage.removeItem("lecturer");
    setAuthMessage("Đã đăng xuất");
    setClassRows([]);
    setStudentRows([]);
    setSessionRows([]);
    setHistoryRows([]);
    setStats(null);
  }

  async function loadClasses() {
    try {
      const data = await listClasses(token);
      setClassRows(data);
    } catch (error) {
      setClassMessage(`Không tải được danh sách lớp: ${error.message}`);
    }
  }

  async function loadStudents() {
    try {
      const data = await listStudents(token, studentFilterLop);
      setStudentRows(data);
    } catch (error) {
      setStudentMessage(`Không tải được danh sách sinh viên: ${error.message}`);
    }
  }

  async function loadSessions() {
    try {
      const data = await listSessions(token, sessionFilterLop);
      setSessionRows(data);
    } catch (error) {
      setSessionMessage(`Không tải được danh sách buổi học: ${error.message}`);
    }
  }

  async function loadAttendanceStats() {
    if (!buoiHocId || !token) {
      return;
    }
    try {
      const data = await getAttendanceSessionStats({ token, buoiHocId });
      setStats(data);
    } catch (_error) {
      setStats(null);
    }
  }

  async function handleCreateClass(e) {
    e.preventDefault();
    setClassMessage("Đang tạo lớp...");
    try {
      await createClass({ token, maLop, tenLop, nienKhoa, hocKy });
      setClassMessage("Tạo lớp học thành công");
      setMaLop("");
      setTenLop("");
      setNienKhoa("");
      setHocKy("");
      await loadClasses();
    } catch (error) {
      setClassMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleCreateStudent(e) {
    e.preventDefault();
    setStudentMessage("Đang thêm sinh viên...");
    try {
      await createStudent({
        token,
        mssv: studentMssv,
        hoTenSv: studentHoTen,
        lop: studentLop,
      });
      setStudentMessage("Thêm sinh viên thành công");
      setStudentMssv("");
      setStudentHoTen("");
      setStudentLop("");
      await loadStudents();
    } catch (error) {
      setStudentMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleFilterStudents(e) {
    e.preventDefault();
    await loadStudents();
  }

  async function handleEditClass(e) {
    e.preventDefault();
    setClassMessage("Đang cập nhật lớp...");
    try {
      await updateClass({
        token,
        maLop: editingClassMaLop,
        tenLop,
        nienKhoa,
        hocKy,
      });
      setClassMessage("Cập nhật lớp thành công");
      setEditingClassMaLop(null);
      setTenLop("");
      setNienKhoa("");
      setHocKy("");
      await loadClasses();
    } catch (error) {
      setClassMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleEditStudent(e) {
    e.preventDefault();
    setStudentMessage("Đang cập nhật sinh viên...");
    try {
      await updateStudent({
        token,
        mssv: editingStudentMssv,
        hoTenSv: studentHoTen,
        lop: studentLop,
      });
      setStudentMessage("Cập nhật sinh viên thành công");
      setEditingStudentMssv(null);
      setStudentHoTen("");
      setStudentLop("");
      await loadStudents();
    } catch (error) {
      setStudentMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleCreateSession(e) {
    e.preventDefault();
    setSessionMessage("Đang tạo buổi học...");
    try {
      // Convert datetime-local format to ISO format
      // Input: "2026-04-02T08:00" -> Output: "2026-04-02T08:00:00"
      const toISOString = (datetimeLocalValue) => {
        if (!datetimeLocalValue) return null;
        // datetime-local can have both "T" and space as separator
        const normalized = datetimeLocalValue.replace(' ', 'T');
        return normalized + ':00'; // add seconds
      };

      const created = await createSession({
        token,
        maLop: sessionMaLop,
        tieuDe: sessionTieuDe,
        scheduledStart: toISOString(sessionStart),
        scheduledEnd: toISOString(sessionEnd),
      });
      const newId = created.buoi_hoc_id;
      setSessionMessage(`Tạo buổi học thành công, ID: ${newId}`);
      setBuoiHocId(String(newId));
      setSessionTieuDe("");
      setSessionStart("");
      setSessionEnd("");
      await loadSessions();
      await loadAttendanceStats();
    } catch (error) {
      setSessionMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleStartSession(buoiHocId) {
    try {
      setSessionMessage("Đang bắt đầu buổi học...");
      const result = await startSession({
        token,
        buoiHocId,
      });
      setSessionMessage(`Bắt đầu buổi học thành công, Status: ${result.Status}`);
      await loadSessions();
    } catch (error) {
      setSessionMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleEndSession(buoiHocId) {
    try {
      setSessionMessage("Đang kết thúc buổi học...");
      const result = await endSession({
        token,
        buoiHocId,
      });
      setSessionMessage(`Kết thúc buổi học thành công, Status: ${result.Status}`);
      await loadSessions();
    } catch (error) {
      setSessionMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleFilterSessions(e) {
    e.preventDefault();
    await loadSessions();
  }

  async function handleLoadHistory() {
    if (!buoiHocId) {
      setHistoryMessage("Vui lòng nhập BuoiHocID");
      return;
    }
    setHistoryMessage("Đang tải lịch sử...");
    try {
      const data = await getAttendanceSessionHistory({ token, buoiHocId });
      setHistoryRows(data);
      setHistoryMessage(`Tải thành công ${data.length} dòng`);
    } catch (error) {
      setHistoryMessage(`Thất bại: ${error.message}`);
    }
  }

  async function handleExportHistoryCsv() {
    if (!buoiHocId) {
      setHistoryMessage("Vui lòng nhập BuoiHocID");
      return;
    }
    try {
      const url = getAttendanceSessionHistoryCsvUrl(buoiHocId);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Không tải được CSV");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `attendance_session_${buoiHocId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      setHistoryMessage("Đã xuất CSV");
    } catch (error) {
      setHistoryMessage(`Xuất CSV thất bại: ${error.message}`);
    }
  }

  async function handleEnroll(e) {
    e.preventDefault();
    if (!enrollFile) {
      setEnrollMessage("Vui lòng chọn ảnh khuôn mặt để đăng ký");
      return;
    }
    setEnrollMessage("Đang đăng ký khuôn mặt...");
    try {
      const data = await enrollFaceFile({
        token,
        mssv: enrollMssv,
        registeredByMsgv: msgv,
        file: enrollFile,
      });
      setEnrollMessage(`Thành công. FaceDataID: ${data.face_data_id}`);
      setEnrollFile(null);
    } catch (error) {
      setEnrollMessage(`Thất bại: ${error.message}`);
    }
  }

  async function loadAttendanceRecords() {
    if (!buoiHocId) return;
    try {
      const data = await getAttendanceSessionHistory({ token, buoiHocId });
      setHistoryRows(data);
    } catch (error) {
      console.error("Failed to load attendance records", error);
    }
  }

  async function checkClassFaceStatus(maLop) {
    if (!maLop) {
      setDiagnosticData(null);
      return;
    }
    try {
      setShowDiagnostic(true);
      const data = await getClassFaceDiagnostic({ token, maLop });
      setDiagnosticData(data);
    } catch (error) {
      setDiagnosticData({ error: error.message });
    }
  }

  async function handleManualCheckin(e) {
    e.preventDefault();
    if (!manualFile) {
      setManualMessage("Vui lòng chọn ảnh check-in");
      return;
    }
    setManualMessage("Đang nhận diện...");
    try {
      await validateSingleFaceInput(manualFile);
      const data = await checkinFaceFile({
        token,
        buoiHocId,
        file: manualFile,
        threshold,
      });
      setManualMessage(
        data.accepted
          ? data.message || `PRESENT: ${data.mssv} (score: ${Number(data.confidence_score).toFixed(4)})`
          : `Không đạt ngưỡng (score: ${Number(data.confidence_score ?? 0).toFixed(4)})`
      );
      await loadAttendanceStats();
      await loadAttendanceRecords();
    } catch (error) {
      setManualMessage(`Thất bại: ${normalizeFaceError(error.message)}`);
    }
  }

  async function startRealtime() {
    if (!isLoggedIn) {
      setRtMessage("Cần đăng nhập trước khi bắt realtime");
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }

      setStreaming(true);
      setRtMessage("Đang realtime nhận diện...");
      await loadAttendanceStats();

      const interval = Math.max(700, Number(rtIntervalMs) || 1200);
      timerRef.current = window.setInterval(async () => {
        await detectFromCurrentFrame();
      }, interval);
    } catch (error) {
      setRtMessage(`Không mở được camera: ${error.message}`);
      stopRealtime();
    }
  }

  function stopRealtime() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }

  async function detectFromCurrentFrame() {
    if (!videoRef.current || !canvasRef.current || checkingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    setChecking(true);
    checkingRef.current = true;
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Không tạo được frame");

      await validateSingleFaceInput(blob);

      const file = new File([blob], `frame_${Date.now()}.jpg`, { type: "image/jpeg" });
      const data = await checkinFaceFile({
        token,
        buoiHocId,
        file,
        threshold,
      });

      if (data.accepted) {
        setLastIdentity(data.mssv || "Unknown");
      } else {
        setLastIdentity("Không xác định");
      }
      setLastDistance(data.confidence_score ?? null);
      setRtMessage(
        data.accepted
          ? data.message || `Nhận diện được: ${data.mssv} | score: ${Number(data.confidence_score).toFixed(4)}`
          : `Frame không đạt ngưỡng | score: ${Number(data.confidence_score ?? 0).toFixed(4)}`
      );
      await loadAttendanceStats();
    } catch (error) {
      setRtMessage(`Realtime lỗi: ${normalizeFaceError(error.message)}`);
    } finally {
      setChecking(false);
      checkingRef.current = false;
    }
  }

  const sharedProps = {
    token,
    lecturer,
    msgv,
    setMsgv,
    password,
    setPassword,
    authMessage,
    isLoggedIn,
    handleLogin,
    handleLogout,
    classRows,
    classMessage,
    loadClasses,
    handleCreateClass,
    maLop,
    setMaLop,
    tenLop,
    setTenLop,
    nienKhoa,
    setNienKhoa,
    hocKy,
    setHocKy,
    studentRows,
    studentMessage,
    loadStudents,
    handleCreateStudent,
    studentMssv,
    setStudentMssv,
    studentHoTen,
    setStudentHoTen,
    studentLop,
    setStudentLop,
    studentFilterLop,
    setStudentFilterLop,
    handleFilterStudents,
    editingClassMaLop,
    setEditingClassMaLop,
    handleEditClass,
    editingStudentMssv,
    setEditingStudentMssv,
    handleEditStudent,
    enrollMssv,
    setEnrollMssv,
    enrollFile,
    setEnrollFile,
    handleEnroll,
    enrollMessage,
    sessionRows,
    sessionMessage,
    loadSessions,
    handleCreateSession,
    sessionMaLop,
    setSessionMaLop,
    sessionTieuDe,
    setSessionTieuDe,
    sessionStart,
    setSessionStart,
    sessionEnd,
    setSessionEnd,
    sessionFilterLop,
    setSessionFilterLop,
    handleFilterSessions,
    buoiHocId,
    setBuoiHocId,
    threshold,
    setThreshold,
    manualFile,
    setManualFile,
    manualMessage,
    handleManualCheckin,
    streaming,
    rtIntervalMs,
    setRtIntervalMs,
    rtMessage,
    lastIdentity,
    lastDistance,
    checking,
    stats,
    videoRef,
    canvasRef,
    startRealtime,
    stopRealtime,
    detectFromCurrentFrame,
    loadAttendanceStats,
    loadAttendanceRecords,
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
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              apiBase={API_BASE}
              token={token}
              msgv={msgv}
              setMsgv={setMsgv}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
              authMessage={authMessage}
              isLoggedIn={isLoggedIn}
            />
          }
        />
        <Route
          path="*"
          element={
            isLoggedIn ? (
              <Routes>
                <Route
                  path="/"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Current classes"
                      subtitle="Current courses will be showed here"
                    >
                      <HomePage
                        classRows={classRows}
                        loadClasses={loadClasses}
                        classMessage={classMessage}
                        isLoggedIn={isLoggedIn}
                      />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/newclass"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Create a new class"
                      subtitle="Set up a class and manage its student list"
                    >
                      <NewClassPage {...sharedProps} />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Sessions"
                      subtitle="Create sessions, browse them, and export attendance history"
                    >
                      <SessionsPage {...sharedProps} />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/markattendence"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Mark Attendence"
                      subtitle="Realtime webcam attendance with manual file fallback"
                    >
                      <MarkAttendencePage {...sharedProps} />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Settings"
                      subtitle="Configure system parameters and preferences"
                    >
                      <SettingsPage
                        isLoggedIn={isLoggedIn}
                        threshold={threshold}
                        setThreshold={setThreshold}
                        rtIntervalMs={rtIntervalMs}
                        setRtIntervalMs={setRtIntervalMs}
                      />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <DashboardLayout
                      lecturer={lecturer || msgv}
                      onLogout={handleLogout}
                      title="Register"
                      subtitle="Enroll a face image for ArcFace matching"
                    >
                      <RegisterPage {...sharedProps} />
                    </DashboardLayout>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
