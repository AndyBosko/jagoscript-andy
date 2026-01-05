// @ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Copy,
  RefreshCw,
  Zap,
  MonitorPlay,
  MessageSquare,
  Users,
  CheckCircle2,
  Lightbulb,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  X as XIcon,
  FileDown,
  Printer,
  Check,
  Moon,
  Sun,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

// --- KONFIGURASI ---
// Masukkan API Key Anda di sini. 
// Untuk keamanan, sebaiknya gunakan import.meta.env.VITE_GEMINI_API_KEY
const API_KEY = "AIzaSyDKXVJpHiBRZSIWEUM04GcLLIb6xkjqP_Y"; 

const VideoScriptApp = () => {
  const [mode, setMode] = useState('topic'); // 'topic', 'idea', 'image'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useNegativeHook, setUseNegativeHook] = useState(false);

  const [formData, setFormData] = useState({
    platform: 'TikTok',
    goal: 'Edukasi',
    style: 'Santai',
    audience: 'Gen Z / Remaja',
    topic: '',
    rawIdea: '',
    imagePrompt: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [generatedScript, setGeneratedScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Effect untuk mengganti background body
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';
  }, [isDarkMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 15MB ya!');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imagePrompt: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateScript = async () => {
    // 1. Validasi Awal
    if (mode === 'topic' && !formData.topic) return setError('Topik konten harus diisi ya!');
    if (mode === 'idea' && !formData.rawIdea) return setError('Ide mentah harus diisi ya!');
    if (mode === 'image' && !imageFile) return setError('Upload gambar dulu ya!');
    if (!API_KEY || API_KEY === "MASUKKAN_KEY_ANDA_DISINI") return setError('API Key belum diatur di dalam kodingan!');

    setLoading(true);
    setError('');
    setGeneratedScript(null);

    try {
      // 2. Persiapan Prompt & System Instruction
      let systemInstruction = '';
      let userPrompt = '';
      let imagePart = null;

      const commonContext = `
        Konteks: Platform ${formData.platform}, Tujuan ${formData.goal}, 
        Gaya ${formData.style}, Audiens ${formData.audience}.
      `;

      const negativeHookContext = useNegativeHook
        ? `MODE HOOK: NEGATIVE. Gunakan kata pemicu ketakutan/penyesalan seperti "Jangan", "Stop", "Fatal".`
        : `MODE HOOK: POSITIVE. Gunakan kata inspiratif/manfaat. DILARANG kata negatif di awal.`;

      // --- LOGIKA PROMPT BERDASARKAN MODE ---
      if (mode === 'topic') {
        systemInstruction = `
          Anda adalah Senior Content Strategist.
          Tugas: Buat naskah video pendek (JSON).
          Jika topik adalah LOKASI/WISATA: Bertindak sebagai Traveler berpengalaman, berikan review jujur, vibe, kelebihan & kekurangan.
          Jika BUKAN lokasi: Fokus pada edukasi/hiburan sesuai topik.
          Struktur JSON: hook, problem, value, cta.
          ${negativeHookContext}
        `;
        userPrompt = `${commonContext} Topik: "${formData.topic}". Buat skrip JSON.`;
      
      } else if (mode === 'idea') {
        systemInstruction = `
          Anda adalah Creative Director.
          Tugas: Kembangkan ide mentah user menjadi konsep matang.
          Output JSON: 
          - problem: Analisis singkat ide ini.
          - value: Solusi pengembangan (Angle unik, alur, tips visual).
          - hook: (kosongkan)
          - cta: (kosongkan)
        `;
        userPrompt = `${commonContext} Ide Mentah: "${formData.rawIdea}". Berikan analisis dan pengembangan.`;

      } else if (mode === 'image') {
        systemInstruction = `
          Anda adalah AI Visual Assistant.
          Tugas: Analisis gambar berdasarkan input user.
          Jika user bertanya (misal: "ini apa?"): Jawab di field 'value'. Kosongkan hook/problem/cta.
          Jika user minta skrip: Buat skrip lengkap di field hook, problem, value, cta.
          ${negativeHookContext}
        `;
        userPrompt = `${commonContext} Analisis gambar ini. Input User: "${formData.imagePrompt || 'Buatkan konten dari gambar ini'}"`;
        
        // Persiapan Data Gambar
        const base64Data = imagePreview.split(',')[1];
        imagePart = {
          inlineData: { mimeType: imageFile.type, data: base64Data },
        };
      }

      // 3. Panggil API Gemini
      const contentParts = [{ text: userPrompt }];
      if (imagePart) contentParts.push(imagePart);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            // Menambahkan system instruction dengan format yang benar untuk v1beta
            system_instruction: {
              parts: [{ text: systemInstruction }]
            }
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Gagal terhubung ke Google AI');
      }

      const data = await response.json();
      let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("AI tidak memberikan jawaban.");

      // 4. Sanitasi JSON (Penting agar tidak error saat parsing)
      // Mencari kurung kurawal pertama { dan terakhir }
      const startIndex = textResponse.indexOf('{');
      const endIndex = textResponse.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        textResponse = textResponse.substring(startIndex, endIndex + 1);
      } else {
        // Fallback jika AI lupa format JSON, kita paksa masuk ke 'value'
        textResponse = JSON.stringify({
            hook: "Gagal format JSON",
            problem: "AI merespon dengan teks biasa.",
            value: textResponse,
            cta: ""
        });
      }

      const parsedResult = JSON.parse(textResponse);
      setGeneratedScript(parsedResult);

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedScript) return;
    let textToCopy = '';

    // Logika copy cerdas
    if (generatedScript.hook) {
        textToCopy = `HOOK:\n${generatedScript.hook}\n\nPROBLEM:\n${generatedScript.problem}\n\nISI KONTEN:\n${generatedScript.value}\n\nCTA:\n${generatedScript.cta}`;
    } else {
        // Fallback untuk mode idea/jawaban gambar
        textToCopy = `${generatedScript.problem ? `ANALISIS:\n${generatedScript.problem}\n\n` : ''}ISI:\n${generatedScript.value}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const exportToWord = () => {
    if (!generatedScript) return;
    
    // Header Content
    const contentHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Script Export</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #4338ca;">${formData.topic || 'JagoScript Export'}</h1>
        <p><strong>Platform:</strong> ${formData.platform} | <strong>Mode:</strong> ${mode.toUpperCase()}</p>
        <hr/>
        ${generatedScript.hook ? `<h3 style="color: #e11d48;">HOOK (3 Detik Pertama)</h3><p><b>${generatedScript.hook}</b></p>` : ''}
        ${generatedScript.problem ? `<h3 style="color: #d97706;">MASALAH / ANALISIS</h3><p>${generatedScript.problem}</p>` : ''}
        <h3 style="color: #059669;">ISI KONTEN / SOLUSI</h3>
        <p>${generatedScript.value.replace(/\n/g, '<br/>')}</p>
        ${generatedScript.cta ? `<h3 style="background-color: #1e293b; color: white; padding: 5px;">CALL TO ACTION</h3><p>${generatedScript.cta}</p>` : ''}
        <br/><hr/><p style="font-size: 10px; color: gray;">Generated by JagoScript.ai</p>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', contentHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jagoscript-${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- KOMPONEN UI ---
  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => { setMode(id); setGeneratedScript(null); setError(''); }}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
        mode === id
          ? isDarkMode
            ? 'bg-slate-700 text-white shadow-lg ring-1 ring-slate-600'
            : 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
          : isDarkMode
          ? 'text-slate-400 hover:text-slate-200'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <header className={`backdrop-blur-md border-b sticky top-0 z-20 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Jago<span className="text-lime-500">Script</span>.ai
          </h1>
          <div className="flex items-center gap-4">
             {/* API Key Warning jika masih default */}
            {API_KEY === "MASUKKAN_KEY_ANDA_DISINI" && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 hidden sm:block">
                    ⚠️ API Key belum dipasang
                </span>
            )}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-indigo-50 text-indigo-600'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: INPUT */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-1 rounded-2xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            
            {/* Tabs */}
            <div className={`flex p-1 rounded-xl mb-6 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100/80'}`}>
              <TabButton id="topic" icon={FileText} label="Topik" />
              <TabButton id="idea" icon={Lightbulb} label="Ide" />
              <TabButton id="image" icon={ImageIcon} label="Gambar" />
            </div>

            <div className="px-5 pb-6 space-y-5">
              {/* INPUT AREA */}
              <div className="min-h-[120px]">
                {mode === 'topic' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Topik Utama</label>
                        <textarea
                            name="topic" value={formData.topic} onChange={handleInputChange}
                            placeholder="Mau buat konten apa hari ini?"
                            className={`w-full p-4 border rounded-xl focus:ring-2 outline-none text-sm min-h-[120px] transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/20'}`}
                        />
                    </div>
                )}
                {mode === 'idea' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Curhatan / Ide Mentah</label>
                        <textarea
                            name="rawIdea" value={formData.rawIdea} onChange={handleInputChange}
                            placeholder="Tulis ide kasarmu di sini..."
                            className={`w-full p-4 border rounded-xl focus:ring-2 outline-none text-sm min-h-[160px] transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-amber-500/50' : 'bg-amber-50/50 border-amber-200 text-slate-700 focus:ring-amber-500/20'}`}
                        />
                    </div>
                )}
                {mode === 'image' && (
                    <div className="animate-fade-in space-y-4">
                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Analisis Gambar</label>
                        {!imagePreview ? (
                            <div onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[150px] group ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'}`}>
                                <UploadCloud size={32} className="text-indigo-500 mb-2" />
                                <span className="text-xs text-slate-500">Klik untuk upload foto</span>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border">
                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                <button onClick={removeImage} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1 rounded shadow"><XIcon size={16} /></button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        
                        <input
                            type="text" name="imagePrompt" value={formData.imagePrompt} onChange={handleInputChange}
                            placeholder="Instruksi khusus (Opsional)..."
                            className={`w-full p-3 border rounded-xl text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50'}`}
                        />
                    </div>
                )}
              </div>

              {/* NEGATIVE HOOK TOGGLE */}
              {mode !== 'idea' && (
                <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`block text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Negative Hook</span>
                    <span className="text-[10px] text-slate-500">Peringatan, Larangan, Stop...</span>
                  </div>
                  <button onClick={() => setUseNegativeHook(!useNegativeHook)} className={`w-12 h-6 rounded-full p-1 transition-colors ${useNegativeHook ? 'bg-rose-500' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${useNegativeHook ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              {/* DROPDOWNS (Platform & Style) */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-400">Platform</label>
                    <div className="relative mt-1">
                        <select name="platform" value={formData.platform} onChange={handleInputChange} className={`w-full p-2.5 rounded-xl border appearance-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            {['TikTok','Instagram Reels','YouTube Shorts','Threads'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400">Gaya</label>
                    <div className="relative mt-1">
                        <select name="style" value={formData.style} onChange={handleInputChange} className={`w-full p-2.5 rounded-xl border appearance-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            {['Santai (Gue/Lo)','Formal','Storytelling','Provokatif'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                    </div>
                 </div>
              </div>

              {/* GENERATE BUTTON */}
              <button
                onClick={generateScript} disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Zap fill="currentColor" />}
                {loading ? 'Meracik Ide...' : 'Buat Skrip Ajaib'}
              </button>
              
              {error && <p className="text-red-500 text-xs text-center mt-2 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: OUTPUT */}
        <div className="lg:col-span-7">
          {!generatedScript && !loading && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white/50'}`}>
                <MonitorPlay size={40} className="text-slate-400 mb-4 opacity-50" />
                <p className="text-slate-500 font-medium">Hasil skrip akan muncul di sini</p>
            </div>
          )}

          {loading && (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg animate-pulse">Sedang Berpikir...</p>
            </div>
          )}

          {generatedScript && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* ACTION BAR */}
              <div className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                 <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={14}/> Selesai</span>
                 <div className="flex gap-2">
                    <button onClick={exportToWord} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><FileDown size={14}/> Word</button>
                    <button onClick={copyToClipboard} className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                        {copySuccess ? <Check size={14}/> : <Copy size={14}/>} {copySuccess ? 'Tersalin!' : 'Salin'}
                    </button>
                 </div>
              </div>

              {/* SCRIPT CARDS */}
              <div className="space-y-4">
                {/* HOOK */}
                {generatedScript.hook && (
                    <div className={`relative p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${useNegativeHook ? 'bg-red-500' : 'bg-rose-500'}`}></div>
                        <div className="flex justify-between mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${useNegativeHook ? 'text-red-500' : 'text-rose-500'}`}>🔥 3 Detik Pertama (Hook)</span>
                        </div>
                        <p className="text-lg font-medium font-serif leading-relaxed">"{generatedScript.hook}"</p>
                    </div>
                )}

                {/* PROBLEM & VALUE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedScript.problem && (
                        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                            <h4 className="text-xs font-bold text-amber-500 uppercase mb-3">Masalah / Analisis</h4>
                            <p className="text-sm leading-relaxed opacity-90">{generatedScript.problem}</p>
                        </div>
                    )}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3">Isi / Solusi</h4>
                        <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{generatedScript.value}</p>
                    </div>
                </div>

                {/* CTA */}
                {generatedScript.cta && (
                    <div className={`p-6 rounded-2xl text-center border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-900 text-white'}`}>
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                         <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2 relative z-10">Call To Action</h4>
                         <p className="text-base font-medium relative z-10 text-white">"{generatedScript.cta}"</p>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default VideoScriptApp;