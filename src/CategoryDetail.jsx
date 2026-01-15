import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

function CategoryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const catDoc = await getDoc(doc(db, "categories", id));
                if (catDoc.exists()) {
                    setCategory({ id: catDoc.id, ...catDoc.data() });
                }
                const transSnap = await getDocs(collection(db, "transactions"));
                const trans = transSnap.docs
                    .map((d) => ({
                        id: d.id,
                        ...d.data(),
                        date: d.data().date.toDate(),
                    }))
                    .filter((t) => t.categoryId === id)
                    .sort((a, b) => b.date - a.date);

                setTransactions(trans);
            } catch (error) {
                console.error("Veri hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const formatCurrency = (num) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num);

    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const net = totalIncome - totalExpense;

    if (loading) return <div style={{textAlign:"center", padding:"50px", fontFamily:"sans-serif", color:"#64748b"}}>Analiz Hazırlanıyor...</div>;

    return (
        <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                
                {/* Üst Başlık Paneli */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <div>
                        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: "bold", cursor: "pointer", marginBottom: "10px", display: "block" }}>
                            ← Listeye Dön
                        </button>
                        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "850", color: "#1e293b" }}>{category?.name} Analizi</h1>
                        <p style={{ margin: "5px 0 0 0", color: "#64748b" }}>Bu kategoriye ait finansal hareket özetleri</p>
                    </div>
                    <div style={{ textAlign: "right", backgroundColor: "white", padding: "15px 25px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Kategori Bakiyesi</span>
                        <span style={{ fontSize: "24px", fontWeight: "900", color: net >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(net)}</span>
                    </div>
                </div>

                {/* İstatistik Kartları */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Toplam Gelir</p>
                        <p style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "900", color: "#10b981" }}>{formatCurrency(totalIncome)}</p>
                    </div>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Toplam Gider</p>
                        <p style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "900", color: "#ef4444" }}>{formatCurrency(totalExpense)}</p>
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", padding: "30px", borderRadius: "24px", color: "white" }}>
                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.8, fontWeight: "bold", textTransform: "uppercase" }}>İşlem Adedi</p>
                        <p style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "900" }}>{transactions.length} Kayıt</p>
                    </div>
                </div>

                {/* Hareket Listesi */}
                <div style={{ backgroundColor: "white", borderRadius: "28px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "25px 30px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>Son Hareketler</h2>
                    </div>

                    <div style={{ padding: "20px" }}>
                        {transactions.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Henüz bir kayıt bulunmuyor.</div>
                        ) : (
                            transactions.map((t) => (
                                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderRadius: "18px", marginBottom: "12px", backgroundColor: "#fcfdfe", border: "1px solid #f1f5f9" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                        <div style={{ width: "45px", height: "45px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", backgroundColor: t.type === "income" ? "#ecfdf5" : "#fff1f2", color: t.type === "income" ? "#10b981" : "#ef4444" }}>
                                            {t.type === "income" ? "↑" : "↓"}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: "700", color: "#334155" }}>{t.description}</p>
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{t.donor ? `👤 ${t.donor} • ` : ""}{new Intl.DateTimeFormat('tr-TR').format(t.date)}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ margin: 0, fontWeight: "900", fontSize: "17px", color: t.type === "income" ? "#10b981" : "#ef4444" }}>
                                            {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CategoryDetail;