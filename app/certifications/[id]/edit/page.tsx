import Sidebar from "../../../../components/Sidebar";
import CertificationForm from "../../../../components/CertificationForm";

export default function EditCertificationPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CertificationForm />
      </main>
      <Sidebar />
    </div>
  );
}
