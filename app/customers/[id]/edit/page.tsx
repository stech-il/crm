import Sidebar from "../../../../components/Sidebar";
import CustomerForm from "../../../../components/CustomerForm";

export default function EditCustomerPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <CustomerForm />
      </main>
      <Sidebar />
    </div>
  );
}
