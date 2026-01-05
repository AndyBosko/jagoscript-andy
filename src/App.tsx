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

const VideoScriptApp = () => {
  const [mode, setMode] = useState('topic'); // 'topic', 'idea', 'image'
  const [isDarkMode, setIsDarkMode] = useState(false); // State untuk Dark Mode
  const [useNegativeHook, setUseNegativeHook] = useState(false); // State untuk Negative Hook

  const [formData, setFormData] = useState({
    platform: 'TikTok',
    goal: 'Edukasi',
    style: 'Santai',
    audience: 'Gen Z / Remaja',
    topic: '',
    rawIdea: '',
    imagePrompt: '', // Tambahan field untuk instruksi gambar
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [generatedScript, setGeneratedScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Konfigurasi API
  const apiKey = ''; // API Key akan diisi oleh environment runtime

  // Effect untuk mengganti body background color agar sesuai tema saat print/overscroll
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = '#0f172a'; // slate-900
    } else {
      document.body.style.backgroundColor = '#f8fafc'; // slate-50
    }
  }, [isDarkMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file updated ke 15MB
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateScript = async () => {
    // Validasi Input
    if (mode === 'topic' && !formData.topic) {
      setError('Topik konten harus diisi ya!');
      return;
    }
    if (mode === 'idea' && !formData.rawIdea) {
      setError('Ide mentah/curhatan harus diisi ya!');
      return;
    }
    if (mode === 'image' && !imageFile) {
      setError('Upload gambar dulu ya!');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedScript(null);
    setCopySuccess(false);

    // --- DYNAMIC PROMPT ENGINE (UPDATED LOGIC) ---
    let systemInstruction = '';
    let userPrompt = '';
    let imagePart = null;

    const commonContext = `
      Konteks konten:
      Platform: ${formData.platform}
      Tujuan konten: ${formData.goal}
      Gaya bahasa: ${formData.style}
      Target audiens: ${formData.audience}
    `;

    // Logika Negative Hook (DIPERTEGAS UNTUK MODE OFF)
    const negativeHookInstruction = useNegativeHook
      ? `
        [MODE HOOK: NEGATIVE (ON)]
        WAJIB GUNAKAN "NEGATIVE HOOK" yang memicu rasa takut/khawatir/penyesalan.
        Gunakan kata kunci: "Jangan pernah", "Kesalahan fatal", "Stop lakukan", "Nyesel banget".
        Contoh: "Jangan beli produk ini kalau...", "Kesalahan terbesarku adalah..."
        `
      : `
        [MODE HOOK: POSITIVE/NORMAL (OFF)]
        WAJIB GUNAKAN HOOK YANG POSITIF, EDUKATIF, ATAU INSPIRATIF.
        DILARANG KERAS menggunakan kata-kata negatif, larangan, atau penyesalan di awal kalimat.
        JANGAN gunakan kata "Jangan", "Salah", "Stop", "Hati-hati".
        Gunakan pendekatan manfaat atau pertanyaan yang relevan.
        Contoh: "Ini cara terbaik untuk...", "Rahasia kulit glowing...", "Siapa yang mau..."
        `;

    // 1. MODE TOPIK (UPDATED WITH TRAVELER PERSONA)
    if (mode === 'topic') {
      systemInstruction = `
        PERAN UTAMA: Kamu adalah Senior Content Strategist.
        
        LOGIKA DETEKSI OTOMATIS (TRAVELER MODE):
        Analisis topik input: "${formData.topic}".
        Apakah ini nama TEMPAT, KOTA, NEGARA, LOKASI WISATA, atau CAFE/RESTO?
        
        JIKA IYA (INI ADALAH TEMPAT):
        - Aktifkan persona: WORLD TRAVELER LEGENDARIS yang sudah keliling dunia.
        - Anggap kamu BENAR-BENAR pernah ke sana. Jangan bicara seperti brosur wisata.
        - Analisis tempat tersebut dengan mata kritis seorang traveler:
          1. Apa 'Vibe' aslinya? (Misal: Bali itu macet tapi magis, Paris itu indah tapi bau pesing di metro).
          2. Apa KELEBIHANNYA (Hidden Gem)?
          3. Apa KEKURANGANNYA (Honest Review)?
        - Gunakan wawasan otentik ini dalam skrip.
        
        JIKA TIDAK (BUKAN TEMPAT):
        - Tetap pada persona Content Strategist Expert. Fokus pada nilai edukasi/hiburan.

        ATURAN UMUM:
        - Bahasa lisan (gaul/santai sesuai style), Max 120 kata, NO Emoji di teks naskah.
        - Struktur: Hook, Problem, Value, CTA.
        
        ATURAN HOOK:
        ${negativeHookInstruction}
      `;
      userPrompt = `
        ${commonContext}
        Topik utama: ${formData.topic}
        Buat skrip JSON: { "hook": "...", "problem": "...", "value": "...", "cta": "..." }
      `;
    }
    // 2. MODE IDE MENTAH
    else if (mode === 'idea') {
      systemInstruction = `
        Kamu adalah Creative Director & Strategist pribadi untuk konten kreator.
        
        TUGAS UTAMA:
        Mengambil ide mentah yang abstrak/kasar dari user, lalu memberikan SOLUSI PENGEMBANGAN IDE yang konkret dan strategis.
        JANGAN BUAT NASKAH SKRIP (No Hook, No CTA).
        
        Fokus Output (Maksimal 300 kata):
        1. Analisis Potensi: Kenapa ide ini bagus atau apa yang kurang.
        2. Sudut Pandang (Angle) Baru: Berikan cara pandang unik agar konten tidak membosankan.
        3. Struktur/Alur Konten: Sarankan urutan penyampaian.
        4. Tips Eksekusi: Saran visual atau cara penyampaian.

        Gaya Bahasa:
        Manusiawi, seperti ngobrol dengan teman kerja, suportif, cerdas.
      `;
      userPrompt = `
        Ide mentah: "${formData.rawIdea}"
        ${commonContext}
        
        Berikan output dalam format JSON khusus ini:
        { 
          "hook": "", 
          "cta": "",
          "problem": "Analisis singkat tentang ide ini (max 2-3 kalimat)", 
          "value": "Solusi lengkap pengembangan ide (Angle, Alur, Tips). Tulis dalam paragraf yang mengalir dan enak dibaca (sekitar 200-300 kata)." 
        }
      `;
    }
    // 3. MODE IMAGE (LOGIC UPDATED)
    else if (mode === 'image') {
      systemInstruction = `
        Kamu adalah AI Visual Assistant yang Cerdas dan Adaptif.
        
        TUGAS UTAMA:
        Analisis gambar yang diberikan dan respon berdasarkan INPUT TEKS user ("${formData.imagePrompt}").
        
        LOGIKA KEPUTUSAN (PENTING):
        
        KONDISI A: JIKA INPUT ADALAH PERTANYAAN/INFORMASI (Misal: "Ini bunga apa?", "Apa merek sepatu ini?", "Jelaskan gambar ini")
        -> TUGAS: Jawab pertanyaan tersebut dengan akurat, jelas, dan informatif.
        -> OUTPUT JSON:
           - "hook": "" (KOSONGKAN)
           - "problem": "" (KOSONGKAN)
           - "cta": "" (KOSONGKAN)
           - "value": "Tulis jawaban lengkap dan akurat di sini."

        KONDISI B: JIKA INPUT ADALAH PERINTAH KONTEN/SKRIP (Misal: "Buat skrip jualan", "Bikin puisi", "Promosikan ini") atau JIKA INPUT KOSONG
        -> TUGAS: Bertindak sebagai Scriptwriter Expert. Buat skrip konten lengkap.
        -> OUTPUT JSON: Isi semua field ("hook", "problem", "value", "cta") sesuai struktur skrip video pendek.
        -> ATURAN HOOK YANG HARUS DIPATUHI: 
           ${negativeHookInstruction}

        Bahasa: Indonesia Lisan & Natural.
      `;
      userPrompt = `
        ${commonContext}
        GAMBAR YANG DIANALISIS: [Image Data]
        INPUT USER: "${formData.imagePrompt}"
        
        Hasilkan output JSON sesuai logika keputusan di atas.
      `;
      const base64Data = imagePreview.split(',')[1];
      imagePart = {
        inlineData: { mimeType: imageFile.type, data: base64Data },
      };
    }

    try {
      const callApi = async (retryCount = 0) => {
        try {
          const contentParts: any[] = [{ text: userPrompt }];
          if (imagePart) contentParts.push(imagePart);
    
          // --- PERHATIKAN BAGIAN INI ---
          // 1. Kita pakai model 'gemini-1.5-flash' (resmi)
          // 2. PASTE KUNCI BARU ANDA DI BAWAH (Ganti tulisan MASUKKAN_KEY_BARU)
          const apiKey = "AIzaSyDKXVJpHiBRZSIWEUM04GcLLIb6xkjqP_Y"; 
          
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    
          if (!textResponse) throw new Error("Tidak ada jawaban.");
          
          // Bersihkan format
          textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(textResponse);
    
        } catch (error) {
          alert(`Gagal: ${error}`);
          return null;
        }
      };

      const result = await callApi();
      setGeneratedScript(result);
    } catch (err) {
      setError('Gagal membuat skrip. Coba lagi atau cek koneksi ya.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedScript) return;

    // Logic copy adaptif
    let textToCopy = '';

    // Cek apakah ini mode jawaban langsung (hook & cta kosong)
    const isDirectAnswer = !generatedScript.hook && !generatedScript.cta;

    if (mode === 'idea') {
      textToCopy = `ANALISIS IDE:\n${generatedScript.problem}\n\nSOLUSI PENGEMBANGAN:\n${generatedScript.value}`;
    } else if (isDirectAnswer) {
      textToCopy = `JAWABAN/ANALISIS:\n${generatedScript.value}`;
    } else {
      textToCopy = `HOOH: ${generatedScript.hook}\nPROBLEM: ${generatedScript.problem}\nVALUE: ${generatedScript.value}\nCTA: ${generatedScript.cta}`;
    }

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy.trim();
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2s
    } catch (err) {
      console.error('Gagal menyalin', err);
    }
    document.body.removeChild(textArea);
  };

  const exportToWord = () => {
    if (!generatedScript) return;

    const isDirectAnswer = !generatedScript.hook && !generatedScript.cta;
    const isIdeaMode = mode === 'idea';

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Script Export</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #4338ca;">${
          formData.topic || 'JagoScript Export'
        }</h1>
        <p><strong>Platform:</strong> ${
          formData.platform
        } | <strong>Mode:</strong> ${mode.toUpperCase()}</p>
        <hr/>
        
        ${/* Hook Section - Hide if empty */ ''}
        ${
          generatedScript.hook
            ? `
          <h3 style="color: #e11d48;">Hook</h3>
          <p>${generatedScript.hook}</p>
        `
            : ''
        }
        
        ${/* Problem Section - Hide if empty */ ''}
        ${
          generatedScript.problem
            ? `
          <h3 style="color: #d97706;">${
            isIdeaMode ? 'Analisis Ide' : 'Problem / Relate'
          }</h3>
          <p>${generatedScript.problem}</p>
        `
            : ''
        }
        
        ${/* Value Section - Always Show, adapt title */ ''}
        <h3 style="color: #059669;">
          ${
            isIdeaMode
              ? 'Solusi Pengembangan'
              : isDirectAnswer
              ? 'Jawaban / Analisis Gambar'
              : 'Value / Solution'
          }
        </h3>
        <p>${generatedScript.value}</p>
        
        ${/* CTA Section - Hide if empty */ ''}
        ${
          generatedScript.cta
            ? `
          <h3 style="background-color: #1e293b; color: white; padding: 5px;">Call to Action</h3>
          <p>${generatedScript.cta}</p>
        `
            : ''
        }
        
        <hr/>
        <p style="font-size: 10px; color: gray;">Generated by JagoScript.ai</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jagoscript-${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // UI Components
  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => {
        setMode(id);
        setGeneratedScript(null);
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
        mode === id
          ? isDarkMode
            ? 'bg-slate-700 text-white shadow-lg ring-1 ring-slate-600'
            : 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5'
          : isDarkMode
          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div
      className={`min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 print:bg-white transition-colors duration-300 ${
        isDarkMode
          ? 'bg-slate-900 text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* HEADER with Glassmorphism */}
      <header
        className={`backdrop-blur-md border-b sticky top-0 z-20 print:hidden transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-900/80 border-slate-700'
            : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1
                className={`text-xl font-bold tracking-tight leading-none ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Jago<span className="text-lime-500">Script</span>.ai
              </h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                STUDIO MODE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-500">
                System Ready
              </span>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all duration-500 transform ${
                isDarkMode
                  ? 'bg-slate-800 text-yellow-400 rotate-180 hover:bg-slate-700'
                  : 'bg-indigo-50 text-indigo-600 rotate-0 hover:bg-indigo-100'
              }`}
              title={isDarkMode ? 'Matikan Dark Mode' : 'Aktifkan Dark Mode'}
            >
              {isDarkMode ? (
                <Sun size={20} className="fill-current" />
              ) : (
                <Moon size={20} className="fill-current" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:p-0">
        {/* Left Column: Input Form (Hidden on Print) */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div
            className={`p-1 rounded-2xl shadow-sm border transition-colors duration-300 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
          >
            {/* Tab Control */}
            <div
              className={`flex p-1 rounded-xl mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100/80'
              }`}
            >
              <TabButton id="topic" icon={FileText} label="Topik" />
              <TabButton id="idea" icon={Lightbulb} label="Ide" />
              <TabButton id="image" icon={ImageIcon} label="Gambar" />
            </div>

            <div className="px-5 pb-6 space-y-5">
              {/* Dynamic Input Section */}
              <div className="min-h-[120px]">
                {mode === 'topic' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Topik Utama
                    </label>
                    <textarea
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      placeholder="Mau buat konten apa hari ini?"
                      className={`w-full p-4 border rounded-xl focus:ring-2 outline-none text-sm min-h-[120px] transition-all ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 placeholder:text-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                )}

                {mode === 'idea' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Curhatan / Ide Mentah
                    </label>
                    <textarea
                      name="rawIdea"
                      value={formData.rawIdea}
                      onChange={handleInputChange}
                      placeholder="Kamu punya ide apa ?"
                      className={`w-full p-4 border rounded-xl focus:ring-2 outline-none text-sm min-h-[160px] transition-all ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-amber-500/50 placeholder:text-slate-600'
                          : 'bg-amber-50/50 border-amber-200 text-slate-700 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                )}

                {mode === 'image' && (
                  <div className="animate-fade-in space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                        Analisis Gambar
                      </label>
                      {!imagePreview ? (
                        <div
                          onClick={() => fileInputRef.current.click()}
                          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[150px] group ${
                            isDarkMode
                              ? 'border-slate-700 hover:bg-slate-800 hover:border-indigo-400'
                              : 'border-slate-300 hover:bg-slate-50 hover:border-indigo-400'
                          }`}
                        >
                          <div
                            className={`p-3 rounded-full mb-3 group-hover:scale-110 transition-transform ${
                              isDarkMode ? 'bg-slate-700' : 'bg-indigo-50'
                            }`}
                          >
                            <UploadCloud
                              size={24}
                              className={
                                isDarkMode
                                  ? 'text-indigo-400'
                                  : 'text-indigo-500'
                              }
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            Upload Foto / Screenshot
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`relative rounded-xl overflow-hidden border group shadow-md ${
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-slate-600 p-1.5 rounded-lg backdrop-blur-sm transition-all shadow-sm"
                          >
                            <XIcon size={16} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white text-[10px] text-center">
                            Gambar siap dianalisis
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* NEW: Image Prompt Input */}
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                        Instruksi / Pertanyaan (Opsional)
                      </label>
                      <textarea
                        name="imagePrompt"
                        value={formData.imagePrompt}
                        onChange={handleInputChange}
                        placeholder="Contoh: 'Buatkan caption lucu', atau 'Apa merek jam di foto ini?'"
                        className={`w-full p-4 border rounded-xl focus:ring-2 outline-none text-sm min-h-[80px] transition-all ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 placeholder:text-slate-600'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Negative Hook Toggle - HIDE in Idea Mode */}
              {mode !== 'idea' && (
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span
                        className={`block text-sm font-bold ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-700'
                        }`}
                      >
                        Negative Hook
                      </span>
                      <span
                        className={`block text-[10px] ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Peringatan, Larangan, Stop...
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseNegativeHook(!useNegativeHook)}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                      useNegativeHook
                        ? 'bg-rose-500'
                        : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        useNegativeHook ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Platform & Style Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Platform
                  </label>
                  <div className="relative">
                    <MonitorPlay
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <select
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm appearance-none cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500 hover:bg-slate-100'
                      }`}
                    >
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram Reels">Reels</option>
                      <option value="YouTube Shorts">Shorts</option>
                      <option value="Threads">Threads</option>
                      <option value="X (Twitter)">X (Twitter)</option>
                      <option value="Facebook">Facebook</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Gaya
                  </label>
                  <div className="relative">
                    <MessageSquare
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <select
                      name="style"
                      value={formData.style}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm appearance-none cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500 hover:bg-slate-100'
                      }`}
                    >
                      <option value="Santai & Akrab">Santai (Gue/Lo)</option>
                      <option value="Provokatif">Provokatif</option>
                      <option value="Storytelling">Storytelling</option>
                      <option value="Hard Selling">Hard Selling</option>
                      <option value="Formal Profesional">
                        Formal (Aku/Kamu)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Goal & Audience Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Tujuan
                  </label>
                  <div className="relative">
                    <CheckCircle2
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <select
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm appearance-none cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500 hover:bg-slate-100'
                      }`}
                    >
                      <option value="Edukasi">Edukasi</option>
                      <option value="Personal Branding">
                        Personal Branding
                      </option>
                      <option value="Jualan / Promosi">Jualan / Promosi</option>
                      <option value="Hiburan">Hiburan</option>
                      <option value="Inspirasi">Inspirasi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Target Audiens
                  </label>
                  <div className="relative">
                    <Users
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <select
                      name="audience"
                      value={formData.audience}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm appearance-none cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500/50 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500 hover:bg-slate-100'
                      }`}
                    >
                      <option value="Gen Z / Remaja">Gen Z / Remaja</option>
                      <option value="Mahasiswa / Pelajar">
                        Mahasiswa / Pelajar
                      </option>
                      <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                      <option value="Pekerja Kantoran / Profesional">
                        Pekerja Kantoran
                      </option>
                      <option value="Pemilik Bisnis / UMKM">
                        Pemilik Bisnis / UMKM
                      </option>
                      <option value="Gamer">Gamer</option>
                      <option value="Tech Enthusiast">Tech Enthusiast</option>
                      <option value="Investor Pemula">Investor Pemula</option>
                      <option value="Umum / Semua Orang">
                        Umum / Semua Orang
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-5 border-t ${
                isDarkMode ? 'border-slate-700' : 'border-slate-100'
              }`}
            >
              <button
                onClick={generateScript}
                disabled={loading}
                className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
                  isDarkMode
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={20} fill="currentColor" />
                    {mode === 'idea'
                      ? 'Kembangkan Ide'
                      : mode === 'image'
                      ? 'Analisis / Buat Skrip'
                      : 'Buat Skrip Ajaib'}
                  </>
                )}
              </button>
              {error && (
                <p className="text-red-500 text-xs mt-3 text-center bg-red-50 py-1 rounded">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output Display */}
        <div className="lg:col-span-7 print:col-span-12">
          {!generatedScript && !loading && (
            <div
              className={`h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-colors duration-300 print:hidden ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800/50 text-slate-500'
                  : 'border-slate-200 bg-white/50 text-slate-400'
              }`}
            >
              <div
                className={`p-6 rounded-full shadow-sm mb-4 border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}
              >
                <MonitorPlay
                  size={40}
                  className={isDarkMode ? 'text-slate-600' : 'text-slate-200'}
                />
              </div>
              <p className="font-semibold opacity-70">Preview Area</p>
              <p className="text-sm mt-1 opacity-50">
                Hasil skrip akan muncul di sini
              </p>
            </div>
          )}

          {loading && (
            <div
              className={`h-full min-h-[400px] flex flex-col items-center justify-center border rounded-2xl space-y-6 print:hidden ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`h-16 w-16 border-4 border-t-indigo-500 rounded-full animate-spin ${
                    isDarkMode ? 'border-slate-700' : 'border-indigo-100'
                  }`}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap
                    size={20}
                    className="text-indigo-500"
                    fill="currentColor"
                  />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p
                  className={`font-bold text-lg animate-pulse ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Meracik Kata...
                </p>
                <p className="text-slate-500 text-sm">
                  AI sedang berpikir kreatif untukmu
                </p>
              </div>
            </div>
          )}

          {generatedScript && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Output Actions Bar */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border shadow-sm print:hidden ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isDarkMode
                        ? 'bg-indigo-900/50 text-indigo-300'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {mode === 'idea'
                      ? 'Analysis Ready'
                      : generatedScript.hook
                      ? 'Script Ready'
                      : 'Answer Ready'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Single Export Button */}
                  <button
                    onClick={exportToWord}
                    className={`text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-transparent ${
                      isDarkMode
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-700'
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:border-blue-100'
                    }`}
                    title="Download Word Document"
                  >
                    <FileDown size={14} />
                    Export ke Word
                  </button>

                  <div
                    className={`w-px h-6 mx-1 ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  ></div>

                  <button
                    onClick={copyToClipboard}
                    className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm ${
                      copySuccess
                        ? 'bg-green-500 text-white shadow-green-200'
                        : isDarkMode
                        ? 'bg-slate-700 text-white hover:bg-slate-600 shadow-slate-900'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <Check size={14} /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Salin
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* The Script Cards Container - Optimized for Print */}
              <div className="space-y-4 print:space-y-6">
                {/* Print Only Header */}
                <div className="hidden print:block text-center mb-8 border-b pb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {formData.topic || 'Video Script'}
                  </h1>
                  <div className="flex justify-center gap-4 text-sm text-slate-500">
                    <span>Platform: {formData.platform}</span>
                    <span>•</span>
                    <span>Target: {formData.audience}</span>
                  </div>
                </div>

                {/* Hook Card - HIDE IN IDEA MODE OR IF EMPTY (ANSWER ONLY) */}
                {mode !== 'idea' && generatedScript.hook && (
                  <div
                    className={`rounded-2xl p-6 shadow-sm border relative overflow-hidden group hover:shadow-md transition-all print:shadow-none print:border print:border-slate-300 print:rounded-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full print:hidden ${
                        useNegativeHook ? 'bg-red-600' : 'bg-rose-500'
                      }`}
                    ></div>
                    <div className="flex justify-between items-start mb-3">
                      <h4
                        className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 print:text-base print:text-black ${
                          useNegativeHook
                            ? 'text-red-500'
                            : isDarkMode
                            ? 'text-rose-400'
                            : 'text-rose-600'
                        }`}
                      >
                        {useNegativeHook ? (
                          <Zap
                            size={12}
                            fill="currentColor"
                            className="print:hidden"
                          />
                        ) : (
                          <Zap
                            size={12}
                            fill="currentColor"
                            className="print:hidden"
                          />
                        )}
                        {useNegativeHook ? ' NEGATIVE HOOK' : ' THE HOOK'}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded uppercase print:hidden ${
                          isDarkMode
                            ? 'bg-rose-900/30 text-rose-300'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        0-3s
                      </span>
                    </div>
                    <p
                      className={`text-base font-medium leading-relaxed font-serif print:text-black print:text-lg ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      "{generatedScript.hook}"
                    </p>
                  </div>
                )}

                {/* Body Content Grid - Adapt if Problem is empty (Answer Only) */}
                <div
                  className={`grid gap-4 print:block print:space-y-4 ${
                    mode === 'idea' || !generatedScript.problem
                      ? 'grid-cols-1'
                      : 'grid-cols-1 md:grid-cols-2'
                  }`}
                >
                  {/* Problem / Analysis Card - HIDE IF EMPTY */}
                  {generatedScript.problem && (
                    <div
                      className={`rounded-2xl p-5 shadow-sm border group transition-colors print:shadow-none print:border print:border-slate-300 print:rounded-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 hover:border-amber-700'
                          : 'bg-white border-slate-100 hover:border-amber-200'
                      }`}
                    >
                      <h4
                        className={`font-bold text-xs uppercase tracking-wider mb-3 print:text-black print:text-base ${
                          isDarkMode ? 'text-amber-400' : 'text-amber-600'
                        }`}
                      >
                        {mode === 'idea'
                          ? 'Analisis Ide (Potensi & Masalah)'
                          : 'Problem / Relate'}
                      </h4>
                      <p
                        className={`text-base leading-relaxed print:text-black print:text-base ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {generatedScript.problem}
                      </p>
                    </div>
                  )}

                  {/* Value / Solution Card - ALWAYS SHOW (Contains Answer or Value) */}
                  <div
                    className={`rounded-2xl p-5 shadow-sm border group transition-colors print:shadow-none print:border print:border-slate-300 print:rounded-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 hover:border-emerald-700'
                        : 'bg-white border-slate-100 hover:border-emerald-200'
                    }`}
                  >
                    <h4
                      className={`font-bold text-xs uppercase tracking-wider mb-3 print:text-black print:text-base ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      {mode === 'idea'
                        ? 'Solusi Pengembangan (Angle & Tips)'
                        : !generatedScript.hook
                        ? 'Jawaban / Analisis'
                        : 'Value / Solution'}
                    </h4>
                    <p
                      className={`text-base leading-relaxed print:text-black print:text-base whitespace-pre-wrap ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {generatedScript.value}
                    </p>
                  </div>
                </div>

                {/* CTA Card - HIDE IN IDEA MODE OR IF EMPTY */}
                {mode !== 'idea' && generatedScript.cta && (
                  <div
                    className={`rounded-2xl p-6 shadow-lg text-center relative overflow-hidden print:bg-none print:shadow-none print:border print:border-slate-300 print:rounded-none print:text-left ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-slate-950 to-slate-900 shadow-slate-950'
                        : 'bg-gradient-to-r from-slate-900 to-slate-800 shadow-slate-200'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 print:hidden"></div>
                    <h4 className="text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2 relative z-10 print:text-black print:text-base print:mb-2">
                      Call to Action
                    </h4>
                    <p className="text-white text-base font-medium leading-relaxed relative z-10 print:text-black">
                      "{generatedScript.cta}"
                    </p>
                  </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block text-center text-xs text-slate-400 mt-8 pt-4 border-t">
                  Generated by JagoScript.ai
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center print:hidden"></footer>
    </div>
  );
};

export default VideoScriptApp;
