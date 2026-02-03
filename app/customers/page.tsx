import Sidebar from "../../components/Sidebar";
import CustomersList from "../../components/CustomersList";

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CustomersList />
      </main>
      <Sidebar />
    </div>
  );
}
