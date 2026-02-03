import AuthGuard from "../../components/AuthGuard";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <main className="flex-1 mr-56">{children}</main>
          <Sidebar />
        </div>
      </div>
    </AuthGuard>
  );
}
