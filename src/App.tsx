// @ts-nocheck
import { useState, useRef } from 'react';
import { 
  Send, Sparkles, Loader2, Copy, Check, 
  Share2, MessageSquare, MonitorPlay, 
  Lightbulb, Image as ImageIcon,
  AlertTriangle, ChevronDown 
} from 'lucide-react';

// --- GANTI KUNCI DI BAWAH INI DENGAN KUNCI BARU PROYEK JAGOSCRIPT AB ---
const API_KEY = "AIzaSyDKXVJpHiBRZSIWEUM04GcLLIb6xkjqP_Y";

function App() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [style, setStyle] = useState('Santai (Gue/Lo)');
  const [audience, setAudience] = useState('Gen Z / Remaja');
  const [goal, setGoal] = useState('Edukasi');
  const [isNegativeHook, setIsNegativeHook] = useState(false);
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);

  // Fungsi Upload Gambar
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi Utama: Buat Skrip
  const generateScript = async () => {
    if (!topic) {
      alert("Tulis dulu topiknya, bos!");
      return;
    }
    if (API_KEY.includes("MASUKKAN_KEY")) {
      alert("API Key belum dipasang di kodingan!");
      return;
    }

    setLoading(true);
    setGeneratedScript(null);

    try {
      // 1. Siapkan Prompt (Perintah)
      const userPrompt = `
        Buat naskah video pendek (Shorts/Reels/TikTok) tentang: "${topic}".
        Platform: ${platform}. Target: ${audience}. Gaya: ${style}. Tujuan: ${goal}.
        ${isNegativeHook ? "Gunakan Negative Hook (Larangan/Peringatan) di awal." : ""}
        
        Berikan output HANYA dalam format JSON seperti ini (tanpa markdown):
        {
          "hook": "Teks hook yang menarik 3 detik pertama",
          "problem": "Masalah yang relevan dengan audiens",
          "value": "Solusi atau isi konten utama",
          "cta": "Kalimat ajakan (Call to Action)"
        }
      `;

      // 2. Siapkan Data untuk Dikirim
      const contentParts = [{ text: userPrompt }];
      
      if (imageFile && imagePreview) {
        const base64Data = imagePreview.split(',')[1];
        contentParts.push({
          inlineData: { mimeType: imageFile.type, data: base64Data }
        });
      }

      // 3. Kirim ke Google Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: contentParts }] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gagal koneksi ke Google');
      }

      const data = await response.json();
      let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("Google diam saja (tidak ada jawaban).");

      // Bersihkan Format JSON
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(textResponse);
      setGeneratedScript(parsedData);

    } catch (error) {
      console.error(error);
      alert(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KOLOM KIRI: INPUT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h1 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> JagoScript.ai
          </h1>

          {/* Topik */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Topik Konten</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Misal: 3 Kesalahan Fatal Freelancer Pemula..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
            />
          </div>

          {/* Upload Gambar */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Upload Gambar (Opsional)</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-cover rounded" />
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs">Klik untuk upload foto</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>

          {/* Pilihan Dropdown */}
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div>
               <label className="text-xs font-bold text-slate-400">PLATFORM</label>
               <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                 <option>TikTok</option><option>Reels</option><option>Shorts</option>
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400">GAYA BAHASA</label>
               <select value={style} onChange={(e)=>setStyle(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                 <option>Santai (Gue/Lo)</option><option>Formal</option><option>Lucu/Receh</option>
               </select>
             </div>
          </div>

          {/* Tombol Eksekusi */}
          <button 
            onClick={generateScript}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <><Loader2 className="animate-spin" /> Meracik Ide...</> : <><Sparkles /> Buat Skrip Ajaib</>}
          </button>
        </div>

        {/* KOLOM KANAN: HASIL */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl h-fit min-h-[500px] relative">
          {!generatedScript ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MonitorPlay className="w-8 h-8 text-slate-500" />
              </div>
              <p>Hasil skrip akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-500/20 p-4 rounded-xl border border-indigo-500/30">
                <div className="text-xs text-indigo-300 font-bold mb-1">🔥 3 DETIK PERTAMA (HOOK)</div>
                <p className="text-lg font-medium">{generatedScript.hook}</p>
              </div>

              <div className="pl-4 border-l-2 border-slate-700">
                <div className="text-xs text-slate-400 font-bold mb-1">MASALAH</div>
                <p className="text-slate-200">{generatedScript.problem}</p>
              </div>

              <div className="pl-4 border-l-2 border-slate-700">
                <div className="text-xs text-slate-400 font-bold mb-1">SOLUSI / ISI</div>
                <p className="text-slate-200">{generatedScript.value}</p>
              </div>

              <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                <div className="text-xs text-green-300 font-bold mb-1">📢 CALL TO ACTION</div>
                <p className="text-green-100 font-medium">{generatedScript.cta}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;