import Sidebar from "../../../components/Sidebar";
import CustomerDetail from "../../../components/CustomerDetail";

export default function CustomerDetailPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CustomerDetail />
      </main>
      <Sidebar />
    </div>
  );
}
