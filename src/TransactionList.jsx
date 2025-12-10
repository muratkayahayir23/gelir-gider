import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    categoryId: "",
    type: "expense"
  });

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

  // Silme
  const deleteTransaction = async (id) => {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "transactions", id));
      loadData();
    } catch (error) {
      alert("Silme işlemi başarısız: " + error.message);
    }
  };

  // Düzenleme modunu aç
  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      amount: t.amount,
      description: t.description,
      categoryId: t.categoryId,
      type: t.type
    });
  };

  // Düzenlemeyi iptal et
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      amount: "",
      description: "",
      categoryId: "",
      type: "expense"
    });
  };

  // Düzenlemeyi kaydet
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">İşlem Listesi</h1>
          <p className="text-slate-600">Tüm gelir ve gider işlemlerinizi görüntüleyin ve yönetin</p>
        </div>

        {/* Stats Bar */}
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

        {/* Transaction List */}
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
                    /* Düzenleme Modu */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Tutar</label>
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Tutar girin"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                          <select
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
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
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Açıklama girin"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">İşlem Tipi</label>
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="income"
                              checked={editForm.type === "income"}
                              onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="ml-2 text-slate-700">Gelir</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="expense"
                              checked={editForm.type === "expense"}
                              onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                            />
                            <span className="ml-2 text-slate-700">Gider</span>
                          </label>
                        </div>
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
                    /* Normal Görünüm */
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-3xl font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatCurrency(t.amount)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            t.type === "income" 
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
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionList;