import Sidebar from "@/components/Sidebar";
import ContactsList from "@/components/ContactsList";

export default function ContactsPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <ContactsList />
      </main>
      <Sidebar />
    </div>
  );
}
