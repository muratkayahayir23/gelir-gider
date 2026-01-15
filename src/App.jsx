import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Dashboard from "./Dashboard";
import Categories from "./Categories";
import Transactions from "./Transactions";
import TransactionList from "./TransactionList";
import Login from "./login";
import Receipt from "./Receipt";
import CategoryDetail from "./CategoryDetail";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  // 🔐 Giriş yoksa → Login
  if (!user) {
    return <Login />;
  }

  // 🚪 Logout fonksiyonu
  const logout = async () => {
    await signOut(auth);
  };

  // ✅ Giriş varsa → uygulama
  return (
    <Router basename="/gelir-gider">
      <Routes>
        {/* Ana sayfa */}
        <Route path="/" element={
          <div className="min-h-screen bg-gray-900 text-white relative">
            {/* Sağ üst logout */}
            <button
              onClick={logout}
              className="absolute top-4 right-6 text-sm text-red-400 hover:text-red-500 transition"
            >
              Çıkış Yap
            </button>

            <div className="max-w-4xl mx-auto p-6">
              {/* Başlık */}
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
        } />

        {/* Makbuz sayfası */}
        <Route path="/receipt/:id" element={<Receipt />} />

        {/* Kategori detay sayfası */}
        <Route path="/category/:id" element={<CategoryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
