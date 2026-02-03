import Sidebar from "../../../components/Sidebar";
import CertificationDetail from "../../../components/CertificationDetail";

export default function CertificationDetailPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CertificationDetail />
      </main>
      <Sidebar />
    </div>
  );
}
