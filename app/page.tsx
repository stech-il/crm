import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <Dashboard />
      </main>
      <Sidebar />
    </div>
  );
}
