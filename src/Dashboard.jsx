import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";
import Chart from "react-apexcharts";


console.log("Dashboard render triggered");


// Tarih filtreleri
const isThisWeek = (date) => {
  const now = new Date();
  const firstDay = new Date(now);
  firstDay.setDate(now.getDate() - now.getDay());
  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);
  return date >= firstDay && date <= lastDay;
};

const isThisMonth = (date) => {
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const isThisYear = (date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
};

function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");

  const loadData = async () => {
    const catSnap = await getDocs(collection(db, "categories"));
    const cats = catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const transSnap = await getDocs(collection(db, "transactions"));
    const trans = transSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    }));

    setCategories(cats);
    setTransactions(trans);
  };

  useEffect(() => {
    loadData();
  }, []);

  const applyFilter = (list) => {
    if (filter === "all") return list;
    if (filter === "week") return list.filter((t) => isThisWeek(t.date));
    if (filter === "month") return list.filter((t) => isThisMonth(t.date));
    if (filter === "year") return list.filter((t) => isThisYear(t.date));
    return list;
  };

  const filtered = applyFilter(transactions);

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = categories.map((cat) => {
    const catTrans = filtered.filter((t) => t.categoryId === cat.id);

    const income = catTrans
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = catTrans
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      id: cat.id,
      name: cat.name,
      income,
      expense,
    };
  });

  const deleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`"${categoryName}" kategorisini ve bu kategoriye ait TÜM işlemleri silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      // Önce bu kategoriye ait tüm işlemleri sil
      const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);
      for (const trans of categoryTransactions) {
        await deleteDoc(doc(db, "transactions", trans.id));
      }

      // Sonra kategoriyi sil
      await deleteDoc(doc(db, "categories", categoryId));

      // Verileri yeniden yükle
      loadData();
      alert("Kategori ve ilgili işlemler başarıyla silindi!");
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Silme işlemi başarısız: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-8">

      {/* Başlık */}
      <h1 className="text-3xl font-bold text-gray-100">Gelir Gider Paneli</h1>

      {/* Filtre */}
      <div>
        <select
          className="p-2 rounded-md bg-gray-800 text-white border border-gray-700"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tümü</option>
          <option value="week">Bu Hafta</option>
          <option value="month">Bu Ay</option>
          <option value="year">Bu Yıl</option>
        </select>
      </div>

      {/* 3'lü Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Gelir */}
        <div className="bg-green-600 bg-opacity-20 border border-green-700 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-green-400">Toplam Gelir</h2>
          <p className="text-3xl font-bold text-green-300">{totalIncome} ₺</p>
        </div>

        {/* Gider */}
        <div className="bg-red-600 bg-opacity-20 border border-red-700 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-red-400">Toplam Gider</h2>
          <p className="text-3xl font-bold text-red-300">{totalExpense} ₺</p>
        </div>

        {/* Net */}
        <div className="bg-blue-600 bg-opacity-20 border border-blue-700 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-blue-400">Net Bakiye</h2>
          <p className="text-3xl font-bold text-blue-300">
            {totalIncome - totalExpense} ₺
          </p>
        </div>
      </div>

      {/* Özet Tablo */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow overflow-auto">
        <h3 className="text-xl font-bold text-gray-200 mb-4">Özet Tablo</h3>

        <table className="w-full border-collapse text-gray-300">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-600 p-2">Kategori</th>
              <th className="border border-gray-600 p-2">Gelir</th>
              <th className="border border-gray-600 p-2">Gider</th>
              <th className="border border-gray-600 p-2">İşlemler</th>
            </tr>
          </thead>

          <tbody>
            <tr className="bg-green-900 bg-opacity-40 font-semibold">
              <td className="border border-gray-700 p-2">GENEL TOPLAM</td>
              <td className="border border-gray-700 p-2">{totalIncome}</td>
              <td className="border border-gray-700 p-2">{totalExpense}</td>
              <td className="border border-gray-700 p-2"></td>
            </tr>

            {categoryTotals.map((c) => (
              <tr key={c.name} className="hover:bg-gray-700">
                <td className="border border-gray-700 p-2">{c.name}</td>
                <td className="border border-gray-700 p-2">{c.income}</td>
                <td className="border border-gray-700 p-2">{c.expense}</td>
                <td className="border border-gray-700 p-3">
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => navigate(`/category/${c.id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <span className="text-base">📊</span>
                      <span>Detay</span>
                    </button>
                    <button
                      onClick={() => deleteCategory(c.id, c.name)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <span className="text-base">🗑️</span>
                      <span>Sil</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            <tr className="bg-blue-900 bg-opacity-40 font-semibold">
              <td className="border border-gray-700 p-2">NET BAKİYE</td>
              <td colSpan="3" className="border border-gray-700 p-2 text-center">
                {totalIncome - totalExpense}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow">
          <h3 className="text-lg font-bold text-gray-200 mb-2">Gelir / Gider</h3>
          <Chart
            type="pie"
            width="100%"
            series={[totalIncome, totalExpense]}
            options={{ labels: ["Gelir", "Gider"] }}
          />
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow">
          <h3 className="text-lg font-bold text-gray-200 mb-2">Kategori Giderleri</h3>
          <Chart
            type="bar"
            height={300}
            series={[{ name: "Gider", data: categoryTotals.map(c => c.expense) }]}
            options={{
              xaxis: { categories: categoryTotals.map(c => c.name) },
              colors: ["#ef4444"],
            }}
          />
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-200 mb-2">Kategori Gelirleri</h3>
          <Chart
            type="bar"
            height={300}
            series={[{ name: "Gelir", data: categoryTotals.map(c => c.income) }]}
            options={{
              xaxis: { categories: categoryTotals.map(c => c.name) },
              colors: ["#22c55e"],
            }}
          />
        </div>

      </div>
    </div>
  );

}

export default Dashboard;
