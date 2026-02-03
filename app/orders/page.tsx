import Sidebar from "../../components/Sidebar";
import OrdersList from "../../components/OrdersList";

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <OrdersList />
      </main>
      <Sidebar />
    </div>
  );
}
