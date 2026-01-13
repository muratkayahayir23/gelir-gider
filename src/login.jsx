import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
      // 🔥 onLogin YOK – Firebase state zaten App.jsx’i tetikler
    } catch {
      setError("Kullanıcı adı veya şifre yanlış");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-sm">

        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Gelir Gider Uygulaması
        </h1>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <input
            className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded focus:outline-none focus:border-gray-500"
            placeholder="Kullanıcı adı"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded focus:outline-none focus:border-gray-500"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={login}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
