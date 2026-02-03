import Sidebar from "../../components/Sidebar";
import DealsList from "../../components/DealsList";

export default function DealsPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <DealsList />
      </main>
      <Sidebar />
    </div>
  );
}
