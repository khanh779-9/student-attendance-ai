import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import { useRef, useState } from "react";
import { enrollFaceFile } from "../api";

export default function RegisterPage({
  isLoggedIn,
  enrollMssv,
  setEnrollMssv,
  enrollMessage,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedBlobs, setCapturedBlobs] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Bắt đầu camera
  const startCamera = async () => {
    if (streaming) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
    } catch (err) {
      alert("Không mở được camera: " + err.message);
    }
  };

  // Tắt camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  // Chụp ảnh từ camera
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlobs((prev) => [...prev, blob]);
        setSelectedIdx((prev) => prev === null ? 0 : prev + 1);
      }
    }, "image/png");
  };

  // Chụp lại (xóa ảnh cuối cùng)
  const handleRetake = () => {
    setCapturedBlobs((prev) => prev.slice(0, -1));
    setSelectedIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
  };

  // Gửi tất cả ảnh lên BE qua api.js
  const handleSaveAll = async () => {
    if (!isLoggedIn || capturedBlobs.length === 0 || !enrollMssv) return;
    try {
      // Gửi từng ảnh qua enrollFaceFile (có thể tối ưu gửi song song nếu muốn)
      let successCount = 0;
      let failCount = 0;
      for (let i = 0; i < capturedBlobs.length; i++) {
        try {
          await enrollFaceFile({
            token: localStorage.getItem("token"),
            studentId: enrollMssv,
            file: new File([capturedBlobs[i]], `capture_${i + 1}.png`, { type: "image/png" })
          });
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
      alert(`Đã gửi ${successCount} ảnh thành công, ${failCount} ảnh lỗi.`);
    } catch (err) {
      alert("Lỗi gửi ảnh: " + err.message);
    }
  };

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

      {/* Đăng ký bằng camera */}
      <div className="mt-4 mb-6">
        <FormField label="Chụp khuôn mặt bằng camera">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Button type="button" onClick={startCamera} disabled={streaming} size="sm">
                Bật camera
              </Button>
              <Button type="button" onClick={stopCamera} disabled={!streaming} size="sm" variant="secondary">
                Tắt camera
              </Button>
              <Button type="button" onClick={handleCapture} disabled={!streaming} size="sm" variant="success">
                Chụp ảnh
              </Button>
              <Button type="button" onClick={handleRetake} disabled={capturedBlobs.length === 0} size="sm" variant="danger">
                Chụp lại
              </Button>
              <Button type="button" onClick={handleSaveAll} disabled={capturedBlobs.length === 0 || !enrollMssv || !isLoggedIn} size="sm" variant="primary">
                Lưu tất cả ({capturedBlobs.length})
              </Button>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-2 items-center">
              <div className="relative flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="rounded-xl border-4 border-blue-500 shadow-lg bg-black aspect-video w-[420px] h-[340px] object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  autoPlay
                  muted
                />
                {/* Overlay khung nhận diện */}
                {streaming && (
                  <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    <div className="rounded-full border-2 border-white/80 bg-black/10 w-60 h-60" style={{boxShadow:'0 0 0 4px #3b82f6, 0 2px 16px #0004'}}></div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              {capturedBlobs.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">Ảnh đã chụp ({capturedBlobs.length})</span>
                  <div className="flex gap-2 flex-wrap">
                    {capturedBlobs.map((blob, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(blob)}
                        alt={`Ảnh ${idx + 1}`}
                        className={`rounded-lg border-2 ${selectedIdx === idx ? 'border-emerald-400' : 'border-slate-300'} shadow cursor-pointer`}
                        style={{ width: 80, height: 60, objectFit: "cover" }}
                        onClick={() => setSelectedIdx(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormField>
      </div>

      {/* Đăng ký bằng upload ảnh cũ */}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <FormField label="Mã số sinh viên">
          <input
            value={enrollMssv}
            onChange={(e) => setEnrollMssv(e.target.value)}
            placeholder="VD: SV001"
          />
        </FormField>
        {/* Đăng ký bằng upload file hình ảnh */}
        <FormField label="Hoặc chọn file hình ảnh (có thể chọn nhiều)">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (!isLoggedIn || files.length === 0 || !enrollMssv) return;
              let successCount = 0;
              let failCount = 0;
              for (let i = 0; i < files.length; i++) {
                try {
                  await enrollFaceFile({
                    token: localStorage.getItem("token"),
                    studentId: enrollMssv,
                    file: files[i]
                  });
                  successCount++;
                } catch (err) {
                  failCount++;
                }
              }
              alert(`Đã gửi ${successCount} ảnh thành công, ${failCount} ảnh lỗi.`);
              e.target.value = null; // reset input
            }}
          />
        </FormField>
      </div>
      <p className="mt-3 text-sm text-slate-600">{enrollMessage}</p>
    </section>
  );
}
