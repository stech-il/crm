import Sidebar from "../../components/Sidebar";
import TasksList from "../../components/TasksList";

export default function TasksPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <TasksList />
      </main>
      <Sidebar />
    </div>
  );
}
