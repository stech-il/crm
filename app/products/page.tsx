import Sidebar from "../../components/Sidebar";
import ProductsList from "../../components/ProductsList";

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 mr-56">
        <ProductsList />
      </main>
      <Sidebar />
    </div>
  );
}
