import Navbar from "../components/Navbar";

export default function DashboardLayout({ lecturer, onLogout, title, subtitle, children, actionLabel, onAction }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Navbar lecturer={lecturer} onLogout={onLogout} />
      <main className="flex-1 w-full bg-slate-50 p-4 md:p-8 lg:p-10 grid content-start gap-6">
        {children}
      </main>
    </div>
  );
}
