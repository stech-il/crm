import Sidebar from "../../components/Sidebar";
import CertificationsList from "../../components/CertificationsList";

export default function CertificationsPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CertificationsList />
      </main>
      <Sidebar />
    </div>
  );
}
