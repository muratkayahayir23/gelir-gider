import { useState } from "react";
import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

function Categories() {
  const [name, setName] = useState("");

  const addCategory = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "categories"), {
      name: name.trim(),
    });

    setName("");
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-200">Kategoriler</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          placeholder="Kategori adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition"
          onClick={addCategory}
        >
          Ekle
        </button>
      </div>
    </div>
  );
}

export default Categories;
