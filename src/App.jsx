import Dashboard from "./Dashboard";
import Categories from "./Categories";
import Transactions from "./Transactions";
import TransactionList from "./TransactionList";

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        
        <h1 className="text-4xl font-bold mb-8 text-center">
          Gelir Gider Uygulaması
        </h1>

        <div className="space-y-10">
          <Dashboard />
          <Categories />
          <Transactions />
          <TransactionList />
        </div>

      </div>
    </div>
  );
}

export default App;
