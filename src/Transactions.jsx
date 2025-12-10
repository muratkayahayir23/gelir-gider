import { useState, useEffect } from "react";
import { db } from "./firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";

function Transactions() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const snap = await getDocs(collection(db, "categories"));
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const save = async () => {
    if (!amount || !category) return;

    await addDoc(collection(db, "transactions"), {
      amount: Number(amount),
      categoryId: category,
      date: new Date(),
      description: desc,
      type: categories.find((x) => x.id === category).type,
    });

    setAmount("");
    setCategory("");
    setDesc("");
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-200">Yeni İşlem Ekle</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <input
          className="p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          placeholder="Tutar"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Kategori seç</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>

        <input
          className="p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          placeholder="Açıklama"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <button
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition"
          onClick={save}
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}

export default Transactions;
