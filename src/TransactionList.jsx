import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function TransactionList() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    categoryId: "",
    type: "expense"
  });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedType, setSelectedType] = useState("all");


  const loadData = async () => {
    const catSnap = await getDocs(collection(db, "categories"));
    const cats = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const transSnap = await getDocs(collection(db, "transactions"));
    const trans = transSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      date: d.data().date.toDate(),
    }));

    setCategories(cats);
    setTransactions(trans.sort((a, b) => b.date - a.date));
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteTransaction = async (id) => {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "transactions", id));
      loadData();
    } catch (error) {
      alert("Silme işlemi başarısız: " + error.message);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      amount: t.amount,
      description: t.description,
      categoryId: t.categoryId,
      type: t.type
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      amount: "",
      description: "",
      categoryId: "",
      type: "expense"
    });
  };

  const saveEdit = async (id) => {
    if (!editForm.amount || !editForm.description || !editForm.categoryId) {
      alert("Lütfen tüm alanları doldurun!");
      return;
    }

    try {
      await updateDoc(doc(db, "transactions", id), {
        amount: Number(editForm.amount),
        description: editForm.description,
        categoryId: editForm.categoryId,
        type: editForm.type
      });

      setEditingId(null);
      loadData();
    } catch (error) {
      alert("Güncelleme başarısız: " + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const month = t.date.getMonth();
      const year = t.date.getFullYear();

      if (selectedMonth !== "all" && month !== parseInt(selectedMonth)) return false;
      if (selectedYear !== "all" && year !== parseInt(selectedYear)) return false;
      if (selectedType !== "all" && t.type !== selectedType) return false;

      return true;
    });
  };

  const getAvailableYears = () => {
    const years = [...new Set(transactions.map(t => t.date.getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  const downloadPDF = () => {
    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
      alert("İndirilecek işlem bulunmuyor!");
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFont("helvetica");

      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Islem Listesi Raporu", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const monthNames = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
        "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];
      const filterText = selectedMonth === "all" && selectedYear === "all"
        ? "Tum Islemler"
        : `Filtre: ${selectedMonth !== "all" ? monthNames[parseInt(selectedMonth)] : "Tum Aylar"} ${selectedYear !== "all" ? selectedYear : ""}`;
      doc.text(filterText, 14, 28);
      doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 34);

      const tableData = filteredTransactions.map(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return [
          formatCurrency(t.amount).replace('₺', 'TL'),
          cat?.name || "-",
          t.donor || "-",
          t.description,
          new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(t.date)
        ];
      });

      const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

      autoTable(doc, {
        startY: 40,
        head: [['Tutar', 'Kategori', 'Bagisci', 'Aciklama', 'Tarih']],
        body: tableData,
        foot: [[`Toplam: ${formatCurrency(total).replace('₺', 'TL')}`, '', '', '', '']],
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: 'bold'
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      const monthName = selectedMonth !== "all" ? monthNames[parseInt(selectedMonth)] : "tum";
      const yearName = selectedYear !== "all" ? selectedYear : "yillar";
      const fileName = `islem-listesi-${monthName}-${yearName}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      alert("PDF oluşturulurken bir hata oluştu: " + error.message);
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const availableYears = getAvailableYears();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">İşlem Listesi</h1>
          <p className="text-slate-600">Tüm gelir ve gider işlemlerinizi görüntüleyin ve yönetin</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Toplam İşlem</p>
            <p className="text-2xl font-bold text-slate-800">{transactions.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Toplam Gelir</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Toplam Gider</p>
            <p className="text-2xl font-bold text-rose-600">
              {formatCurrency(transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Henüz işlem yok</h3>
              <p className="text-slate-600">İlk işleminizi ekleyerek başlayın!</p>
            </div>
          ) : (
            transactions.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const isEditing = editingId === t.id;

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-300"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Tutar</label>
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Tutar girin"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                          <select
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            <option value="">Kategori Seçin</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Açıklama girin"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => saveEdit(t.id)}
                          className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                        >
                          ✓ Kaydet
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                        >
                          ✕ İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-3xl font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatCurrency(t.amount)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.type === "income"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}>
                            {t.type === "income" ? "Gelir" : "Gider"}
                          </span>
                        </div>

                        <p className="text-slate-800 font-medium mb-1">{t.description}</p>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {cat?.name || "Kategori Yok"}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            {formatDate(t.date)}
                          </span>
                        </div>

                        {t.donor && (
                          <p className="text-sm text-indigo-700 mt-2 font-semibold">
                            Bağışçı: {t.donor}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(t)}
                          className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="px-5 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          🗑️ Sil
                        </button>
                        <button
                          onClick={() => navigate(`/receipt/${t.id}`)}
                          className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          📄 Makbuz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">İşlem Listesi (Filtrelenmiş)</h2>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 text-sm font-semibold shadow-md hover:shadow-lg hover:border-blue-500 transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgb(239 246 255), rgb(238 242 255))',
                  color: '#0f172a'
                }}
              >
                <option value="all" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Tüm Aylar</option>
                <option value="0" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Ocak</option>
                <option value="1" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Şubat</option>
                <option value="2" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Mart</option>
                <option value="3" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Nisan</option>
                <option value="4" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Mayıs</option>
                <option value="5" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Haziran</option>
                <option value="6" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Temmuz</option>
                <option value="7" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Ağustos</option>
                <option value="8" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Eylül</option>
                <option value="9" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Ekim</option>
                <option value="10" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Kasım</option>
                <option value="11" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Aralık</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2.5 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 text-sm font-semibold shadow-md hover:shadow-lg hover:border-blue-500 transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgb(239 246 255), rgb(238 242 255))',
                  color: '#0f172a'
                }}
              >
                <option value="all" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Tüm Yıllar</option>
                {availableYears.map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>{year}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 text-sm font-semibold shadow-md hover:shadow-lg hover:border-blue-500 transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgb(239 246 255), rgb(238 242 255))',
                  color: '#0f172a'
                }}
              >
                <option value="all" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Tüm İşlemler</option>
                <option value="income" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Sadece Gelir</option>
                <option value="expense" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px' }}>Sadece Gider</option>
              </select>

              <button
                onClick={downloadPDF}
                disabled={filteredTransactions.length === 0}
                className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
              >
                📄 PDF İndir
              </button>
            </div>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-900">
                <span className="font-semibold">Toplam {filteredTransactions.length} işlem:</span>
                <span className="ml-2 text-lg font-bold text-indigo-700">
                  {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </p>
            </div>
          )}

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-slate-600">Seçilen kriterlere uygun işlem bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 border border-slate-300 text-left font-semibold text-slate-700">Tutar</th>
                    <th className="p-3 border border-slate-300 text-left font-semibold text-slate-700">Kategori</th>
                    <th className="p-3 border border-slate-300 text-left font-semibold text-slate-700">Bağışçı</th>
                    <th className="p-3 border border-slate-300 text-left font-semibold text-slate-700">Açıklama</th>
                    <th className="p-3 border border-slate-300 text-left font-semibold text-slate-700">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-300 p-3 font-semibold text-emerald-600">
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="border border-slate-300 p-3 text-slate-700">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                            {cat?.name || "-"}
                          </span>
                        </td>
                        <td className="border border-slate-300 p-3 text-slate-700">
                          {t.donor || "-"}
                        </td>
                        <td className="border border-slate-300 p-3 text-slate-700">
                          {t.description}
                        </td>
                        <td className="border border-slate-300 p-3 text-slate-600 text-sm">
                          {formatDate(t.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionList;