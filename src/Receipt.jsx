import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Receipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const transRef = doc(db, "transactions", id);
                const transSnap = await getDoc(transRef);
                if (transSnap.exists()) {
                    const transData = { id: transSnap.id, ...transSnap.data(), date: transSnap.data().date.toDate() };
                    setTransaction(transData);
                    if (transData.categoryId) {
                        const catSnap = await getDoc(doc(db, "categories", transData.categoryId));
                        if (catSnap.exists()) setCategory(catSnap.data());
                    }
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        loadData();
    }, [id]);

    const downloadPDF = async () => {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 3, logging: false, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`bagis-makbuzu-${id.substring(0, 5)}.pdf`);
    };

    if (loading) return <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>Yükleniyor...</div>;
    if (!transaction) return <div style={{ textAlign: "center", marginTop: "100px" }}>İşlem bulunamadı.</div>;

    return (
        <div style={{ backgroundColor: "#e2e8f0", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            
            {/* Kontrol Butonları */}
            <div style={{ maxWidth: "850px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between" }} className="print:hidden">
                <button onClick={() => navigate(-1)} style={{ padding: "10px 20px", cursor: "pointer", border: "none", background: "none", color: "#475569", fontWeight: "600" }}>← Geri Dön</button>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={downloadPDF} style={{ padding: "10px 25px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>📥 PDF Olarak İndir</button>
                    <button onClick={() => window.print()} style={{ padding: "10px 25px", backgroundColor: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>🖨️ Yazdır</button>
                </div>
            </div>

            {/* BAĞIŞ MAKBUZU TASARIMI */}
            <div 
                ref={receiptRef}
                style={{
                    maxWidth: "850px",
                    margin: "0 auto",
                    backgroundColor: "white",
                    padding: "50px 70px",
                    position: "relative",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                    borderTop: "15px solid #059669", // Bağış için güven veren yeşil tonu
                    color: "#1e293b"
                }}
            >
                {/* Logo ve Başlık Alanı */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "50px" }}>
                    <div style={{ textAlign: "left" }}>
                        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "900", color: "#059669", letterSpacing: "1px" }}>BAĞIŞ MAKBUZU</h1>
                        <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "3px" }}>Bağışçı Onay Belgesi</p>
                    </div>
                    <div style={{ textAlign: "right", backgroundColor: "#f8fafc", padding: "15px 20px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                        <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: "bold" }}>MAKBUZ NO</p>
                        <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#334155", fontFamily: "monospace" }}>#{id.substring(0, 10).toUpperCase()}</p>
                    </div>
                </div>

                {/* Bağışçı Bilgileri ve Teşekkür */}
                <div style={{ marginBottom: "50px" }}>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 8px 0", fontWeight: "bold" }}>BAĞIŞÇI BİLGİLERİ</p>
                    <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 20px 0", color: "#0f172a" }}>Sayın {transaction.donor || "Hayırsever Bağışçımız"},</h2>
                    
                    <div style={{ 
                        backgroundColor: "#f0fdf4", 
                        padding: "25px", 
                        borderRadius: "15px", 
                        borderLeft: "6px solid #059669",
                        lineHeight: "1.6",
                        fontSize: "17px",
                        color: "#166534",
                        fontStyle: "italic"
                    }}>
                        {transaction.donor ? (
                            <span>
                                Yapmış olduğunuz bu anlamlı bağış, <strong>{category?.name || "insani yardım"}</strong> faaliyetlerimizde kullanılmak üzere kayıtlarımıza başarıyla geçmiştir. 
                                Desteğiniz ve gösterdiğiniz bu duyarlılık için en içten şükranlarımızı sunarız.
                            </span>
                        ) : (
                            "Bu belge, aşağıda dökümü sunulan bağış miktarının kurumumuza teslim edildiğine dair resmi onay belgesidir."
                        )}
                    </div>
                </div>

                {/* İşlem Detayları Tablosu */}
                <div style={{ marginBottom: "40px" }}>
                    <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", marginBottom: "20px" }}>
                        <div style={{ flex: 2, fontSize: "12px", fontWeight: "bold", color: "#94a3b8" }}>BAĞIŞ DETAYI</div>
                        <div style={{ flex: 1, fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textAlign: "right" }}>İÇERİK</div>
                    </div>

                    <div style={{ display: "flex", marginBottom: "15px" }}>
                        <div style={{ flex: 2, fontWeight: "700" }}>Bağış Türü / Kategori</div>
                        <div style={{ flex: 1, textAlign: "right" }}>{category?.name || "Genel Bağış"}</div>
                    </div>

                    <div style={{ display: "flex", marginBottom: "15px" }}>
                        <div style={{ flex: 2, fontWeight: "700" }}>Bağış Tarihi</div>
                        <div style={{ flex: 1, textAlign: "right" }}>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(transaction.date)}</div>
                    </div>

                    <div style={{ display: "flex", marginBottom: "15px" }}>
                        <div style={{ flex: 2, fontWeight: "700" }}>Açıklama</div>
                        <div style={{ flex: 1, textAlign: "right", color: "#64748b", fontSize: "14px" }}>{transaction.description || "-"}</div>
                    </div>
                </div>

                {/* Tutar Kartı */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "60px" }}>
                    <div style={{ 
                        background: "linear-gradient(135deg, #059669 0%, #065f46 100%)", 
                        color: "white", 
                        padding: "30px 50px", 
                        borderRadius: "20px", 
                        textAlign: "right",
                        boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.3)"
                    }}>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: "bold", opacity: 0.8, letterSpacing: "1px" }}>TOPLAM BAĞIŞ MİKTARI</p>
                        <p style={{ margin: 0, fontSize: "48px", fontWeight: "900", letterSpacing: "-1px" }}>
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(transaction.amount)}
                        </p>
                    </div>
                </div>

                {/* İmza ve Alt Bilgi */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "60px", borderTop: "1px solid #f1f5f9", paddingTop: "40px" }}>
                    <div style={{ textAlign: "left" }}>
                        <div style={{ width: "180px", borderBottom: "1px solid #cbd5e1", marginBottom: "10px", height: "50px" }}></div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>Bağışçı İmzası</p>
                    </div>
                    
                    <div style={{ textAlign: "center" }}>
                        <div style={{ 
                            width: "100px", 
                            height: "100px", 
                            border: "3px double #059669", 
                            borderRadius: "50%", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: "#059669",
                            fontSize: "10px",
                            fontWeight: "bold",
                            margin: "0 auto 10px auto",
                            opacity: 0.6
                        }}>RESMİ MÜHÜR</div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>Elektronik Onaylı Belge</p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{ width: "180px", borderBottom: "1px solid #cbd5e1", marginBottom: "10px", height: "50px", position: "relative" }}>
                             {/* İsteğe bağlı yetkili adı buraya eklenebilir */}
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>Kurum Yetkilisi</p>
                    </div>
                </div>

                {/* Footnote */}
                <div style={{ marginTop: "50px", textAlign: "center", fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Bu bağış makbuzu dijital ortamda düzenlenmiştir. Kayıtlarımıza göre geçerlidir.
                </div>
            </div>
        </div>
    );
}

export default Receipt;