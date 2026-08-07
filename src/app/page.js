'use client';

import { useState, useEffect } from 'react';

// TAMBAHKAN 3 BARIS INI DI BAWAH IMPORT BROWSER KAMU:
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function Home() {
  
  const [halamanAktif, setHalamanAktif] = useState("beranda"); // "beranda", "login", "admin", "detail", "tentang"
  const [kategoriAktif, setKategoriAktif] = useState("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [beritaPilihan, setBeritaPilihan] = useState(null);

  const [editId, setEditId] = useState(null);
  const [likesCount, setLikesCount] = useState({});
  const [userLikedStatus, setUserLikedStatus] = useState({});

  const defaultBerita = [
    { 
      id: 1, 
      judul: "BEM ITMS Gelar Diskusi Terbuka Transparansi Anggaran Bareng Rektorat", 
      kategori: "MENSOPOL", 
      waktu: "2 jam yang lalu",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      isi: "Badan Eksekutif Mahasiswa (BEM) ITMS sukses menyelenggarakan diskusi terbuka bersama pihak rektorat pada hari Jumat ini.\n\nAcara ini membahas secara mendalam mengenai transparansi alokasi anggaran kegiatan mahasiswa serta fasilitas kampus demi mewujudkan tata kelola kampus yang akuntabel dan transparan." 
    },
    { 
      id: 2, 
      judul: "Tim E-Sports BEM ITMS Sabet Juara 1 Turnamen Mahasiswa Nasional", 
      kategori: "MENPORA", 
      waktu: "5 jam yang lalu",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
      isi: "Prestasi membanggakan kembali ditorehkan oleh mahasiswa ITMS.\n\nTim E-Sports perwakilan kampus berhasil menduduki podium tertinggi dan menyabet gelar Juara 1 dalam ajang Turnamen E-Sports Antar Mahasiswa Tingkat Nasional setelah menaklukkan perwakilan universitas lain di babak final." 
    },
    { 
      id: 3, 
      judul: "Peluncuran Resmi Portal Berita Mahasiswa ITMS Berbasis Web", 
      kategori: "MEN KOMINFO", 
      waktu: "1 hari yang lalu",
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
      isi: "Kementerian Komunikasi dan Informasi BEM ITMS secara resmi meluncurkan portal berita berbasis web modern.\n\nPlatform ini diharapkan dapat menjadi pusat informasi, wadah aspirasi mahasiswa, serta sarana publikasi kegiatan seluruh kementerian di lingkungan kampus ITMS." 
    },
    { 
      id: 4, 
      judul: "Program Pengabdian Desa: Mahasiswa ITMS Bangun Fasilitas Air Bersih", 
      kategori: "MENDAGRI", 
      waktu: "2 hari yang lalu",
      image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80",
      isi: "Sebagai wujud nyata Tri Dharma Perguruan Tinggi, Kementerian Dalam Negeri BEM ITMS mengerahkan mahasiswa untuk turun langsung ke masyarakat.\n\nMelalui program pengabdian desa, tim mahasiswa sukses membangun fasilitas saluran air bersih yang kini dapat digunakan oleh ratusan warga desa binaan." 
    },
  ];

  const [daftarBerita, setDaftarBerita] = useState(defaultBerita);

  useEffect(() => {
    const savedBerita = localStorage.getItem('berita_bem_itms');
    const savedLikesCount = localStorage.getItem('likes_count');
    const savedUserLiked = localStorage.getItem('user_liked_status');

    if (savedBerita) { 
      try { 
        setDaftarBerita(JSON.parse(savedBerita)); 
      } catch (e) { 
        console.error(e); 
      } 
    }
    
    if (savedLikesCount) { 
      try { 
        setLikesCount(JSON.parse(savedLikesCount)); 
      } catch (e) { 
        console.error(e); 
      } 
    }
    
    if (savedUserLiked) { 
      try { 
        setUserLikedStatus(JSON.parse(savedUserLiked)); 
      } catch (e) { 
        console.error(e); 
      } 
    }
  }, []);

  const [judulInput, setJudulInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState("MENSOPOL");
  const [isiInput, setIsiInput] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleLike = (id, e) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!userLikedStatus[id];
    const newLikesCount = { ...likesCount };
    const newUserLikedStatus = { ...userLikedStatus };

    if (isCurrentlyLiked) {
      newLikesCount[id] = Math.max(0, (newLikesCount[id] || 0) - 1);
      newUserLikedStatus[id] = false;
    } else {
      newLikesCount[id] = (newLikesCount[id] || 0) + 1;
      newUserLikedStatus[id] = true;
    }

    setLikesCount(newLikesCount);
    setUserLikedStatus(newUserLikedStatus);
    localStorage.setItem('likes_count', JSON.stringify(newLikesCount));
    localStorage.setItem('user_liked_status', JSON.stringify(newUserLikedStatus));
  };

  const handleShare = async (berita, e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: berita.judul, 
          text: `Baca berita BEM ITMS: ${berita.judul}`, 
          url: window.location.href 
        });
      } catch (err) { 
        console.error("Gagal membagikan:", err); 
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(`Tautan berita berhasil disalin!`);
    }
  };

const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (passwordInput === "bem123") { setHalamanAktif("admin"); setPasswordInput(""); } else { alert("Password salah!"); }
  };

  // --- TAMBAHKAN FUNGSI FORMAT WAKTU INI ---
  const buatWaktuFormat = () => {
    const now = new Date();
    const jam = now.getHours().toString().padStart(2, '0');
    const menit = now.getMinutes().toString().padStart(2, '0');
    const tanggal = now.getDate().toString().padStart(2, '0');
    const bulan = (now.getMonth() + 1).toString().padStart(2, '0');
    const tahun = now.getFullYear();
    return `${jam}:${menit} ${tanggal}/${bulan}/${tahun}`;
  };
  // ----------------------------------------

  // --- TAMBAHKAN CONFIG QUILL MODULES INI ---
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ]
  };
  // ------------------------------------------
  const prosesSimpanBerita = (imageData) => {
    let beritaBaruList;
    
    if (editId) {
      beritaBaruList = daftarBerita.map((item) => {
        if (item.id === editId) {
          return { 

            ...item, 
            judul: judulInput, 
            kategori: kategoriInput, 
            isi: isiInput, 
            image: imageData ? imageData : item.image 
          };
        }
        return item;
      });
      alert("Berita diperbarui!");
    } else {
      const defaultImages = [
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", 
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
      ];
      const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
      
      const beritaBaru = { 
  id: Date.now(), 
  judul: judulInput, 
  kategori: kategoriInput, 
  waktu: buatWaktuFormat(), // <-- MENJADI INI
  image: imageData || randomImage, 
  isi: isiInput 
};
      
      beritaBaruList = [beritaBaru, ...daftarBerita];
      alert("Berita diposting!");
    }
    
    setDaftarBerita(beritaBaruList);
    localStorage.setItem('berita_bem_itms', JSON.stringify(beritaBaruList));
    
    setJudulInput(""); 
    setIsiInput(""); 
    setImageFile(null); 
    setEditId(null);
  };

  const handleSimpan = (e) => {
    e.preventDefault();
    if (!judulInput.trim() || !isiInput.trim()) { 
      alert("Judul dan isi tidak boleh kosong!"); 
      return; 
    }
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        prosesSimpanBerita(reader.result);
      };
      reader.readAsDataURL(imageFile);
    } else { 
      prosesSimpanBerita(null); 
    }
  };

  const handleMulaiEdit = (berita) => {
    setEditId(berita.id); 
    setJudulInput(berita.judul); 
    setKategoriInput(berita.kategori); 
    setIsiInput(berita.isi);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatalEdit = () => { 
    setEditId(null); 
    setJudulInput(""); 
    setIsiInput(""); 
    setImageFile(null); 
  };

  const handleHapusBerita = (id) => {
    if (confirm("Hapus berita permanen?")) {
      const beritaBaruList = daftarBerita.filter((berita) => berita.id !== id);
      setDaftarBerita(beritaBaruList);
      localStorage.setItem('berita_bem_itms', JSON.stringify(beritaBaruList));
      
      if (editId === id) {
        handleBatalEdit();
      }
    }
  };

  const kementerian = [
    "SEMUA", 
    "MENSOPOL", 
    "MENPORA", 
    "MEN KOMINFO", 
    "MENDAGRI", 
    "MEN AGAMA", 
    "MEN BUMN", 
    "MEN LUAR NEGERI"
  ];

  const beritaTerpilih = daftarBerita.filter((berita) => {
    const sesuaiKategori = kategoriAktif === "SEMUA" || berita.kategori === kategoriAktif;
    const sesuaiPencarian = berita.judul.toLowerCase().includes(searchTerm.toLowerCase());
    return sesuaiKategori && sesuaiPencarian;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <style jsx global>{`
        .quill-content h1 { font-size: 1.75em; font-weight: bold; margin-bottom: 0.5em; }
        .quill-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        .quill-content p { margin-bottom: 1em; }
        .quill-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .quill-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .quill-content strong { font-weight: bold; }
        .quill-content em { font-style: italic; }
        .quill-content u { text-decoration: underline; }
      `}</style>
      
      {/* NAVBAR RESPONSIVE */}
      <nav className="bg-blue-950 text-white shadow-md sticky top-0 z-50 border-b border-blue-900">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          
          {/* Bagian Logo */}
          <div 
            className="flex items-center justify-center md:justify-start w-full md:w-auto gap-2 md:gap-3 cursor-pointer" 
            onClick={() => { 
              setHalamanAktif("beranda"); 
              setBeritaPilihan(null); 
              setKategoriAktif("SEMUA"); 
              setSearchTerm(""); 
            }}
          >
            <div className="flex items-center gap-1.5 md:gap-2.5">
              <img src="/logo-kampus.png" alt="ITMS" className="h-7 md:h-10 w-auto object-contain" />
              <img src="/logo-bem.jpg" alt="BEM" className="h-7 w-7 md:h-10 md:w-10 object-contain rounded-full border border-yellow-500 shadow" />
            </div>
            
            <div className="ml-1 text-left">
              <span className="font-extrabold text-sm md:text-base tracking-wider block leading-tight">BEM ITMS</span>
              <span className="text-blue-300 text-[10px] md:text-xs font-medium">Kabinet Biru Laut</span>
            </div>
            
            <div className="ml-2 md:ml-3 pl-2 md:pl-3 border-l border-blue-800 flex items-center">
              <img src="/36914.png" alt="Logo Kabinet" className="h-8 md:h-10 w-auto object-contain mix-blend-screen" />
            </div>
          </div>

          {/* Bagian Menu */}
          <div className="flex gap-4 md:gap-6 text-[11px] md:text-sm font-bold md:font-medium items-center justify-center w-full md:w-auto border-t border-blue-800/60 md:border-none pt-2.5 md:pt-0">
            <button 
              onClick={() => { 
                setHalamanAktif("beranda"); 
                setBeritaPilihan(null); 
                setKategoriAktif("SEMUA"); 
                setSearchTerm(""); 
              }} 
              className="hover:text-blue-200 cursor-pointer"
            >
              Beranda
            </button>
            <button 
              onClick={() => { 
                setHalamanAktif("beranda"); 
                setBeritaPilihan(null); 
                setKategoriAktif("SEMUA"); 
                setSearchTerm(""); 
              }} 
              className="hover:text-blue-200 cursor-pointer"
            >
              Kementerian
            </button>
            <button 
              onClick={() => { 
                setHalamanAktif("tentang"); 
                setBeritaPilihan(null); 
              }} 
              className="hover:text-blue-200 cursor-pointer"
            >
              Tentang Kami
            </button>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="p-4 md:p-10 lg:p-12 max-w-screen-xl mx-auto w-full flex-grow">
        
        {/* HALAMAN TENTANG KAMI */}
        {halamanAktif === "tentang" && (
          <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-md border border-gray-200">
            <button 
              onClick={() => setHalamanAktif("beranda")} 
              className="text-sm font-bold text-blue-700 hover:underline mb-6 block cursor-pointer"
            >
              ← Kembali ke Beranda
            </button>
            
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="flex justify-center items-center gap-3 md:gap-4 mb-4">
                <img src="/logo-kampus.png" alt="Logo ITMS" className="h-12 md:h-[60px] w-auto object-contain" />
                <img src="/logo-bem.png" alt="Logo BEM" className="h-11 w-11 md:h-[55px] md:w-[55px] object-cover rounded-full border-2 border-yellow-500 shadow-md" />
                <img src="/36914.png" alt="Logo Kabinet" style={{ mixBlendMode: 'multiply' }} className="h-14 md:h-[70px] w-auto object-contain" />
              </div>
              <h1 className="text-xl md:text-4xl font-extrabold text-blue-900 leading-tight">Institut Teknologi Muhammadiyah Sumatera</h1>
              <p className="text-blue-600 font-bold mt-1 text-sm md:text-base">Badan Eksekutif Mahasiswa - Kabinet Biru Laut</p>
            </div>
            
            <div className="text-gray-700 text-sm md:text-lg leading-relaxed space-y-6">
              <p>Badan Eksekutif Mahasiswa (BEM) ITMS Kabinet Biru Laut merupakan lembaga eksekutif tertinggi di tingkat mahasiswa kampus ITMS yang bergerak aktif sebagai wadah penyalur aspirasi, penggerak perubahan, serta pusat pengembangan potensi mahasiswa.</p>
              
              <div className="bg-blue-50 p-5 md:p-6 rounded-xl border-l-4 border-blue-600 italic text-blue-900 font-semibold text-center shadow-inner text-sm md:text-base">
                "Tenang bukan berarti diam, dalam bukan berarti tenggelam - kami bergerak seperti laut, membawa perubahan."
              </div>
              
              <div>
                <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-3">Filosofi Logo Kabinet:</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                  <li><strong>Bagian mengarah ke atas:</strong> Melambangkan visi dan arah perjuangan, menjadi simbol kepemimpinan yang berlandaskan kebijaksanaan dan intelektualitas dalam setiap kebijakan.</li>
                  <li><strong>Lekukan menyerupai ombak:</strong> Menggambarkan kedalaman empati sosial, dinamika gerakan mahasiswa, serta semangat yang terus hidup dan mengalir.</li>
                  <li><strong>Aliran yang menyatu di bagian bawah:</strong> Melambangkan persatuan lintas fakultas dan latar belakang, kolaborasi dalam keberagaman, serta gerakan kolektif yang terarah.</li>
                  <li><strong>Warna Biru:</strong> Mencerminkan kebijaksanaan, ketenangan dalam sikap, dan keteguhan dalam prinsip. Gradasinya menunjukkan proses bahwa perubahan tidak instan, tetapi bertumbuh dan berkelanjutan.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN BACA DETAIL BERITA */}
        {halamanAktif === "detail" && beritaPilihan && (
          <div className="max-w-3xl mx-auto bg-white p-5 md:p-10 rounded-xl shadow-md border border-gray-200 overflow-hidden md:mt-6 mb-8 md:mb-12">
            <button 
              onClick={() => { 
                setHalamanAktif("beranda"); 
                setBeritaPilihan(null); 
              }} 
              className="text-sm font-bold text-blue-700 hover:underline mb-6 block cursor-pointer"
            >
              ← Kembali ke Beranda
            </button>
            
            <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded">
              {beritaPilihan.kategori}
            </span>
            
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4 leading-snug">
              {beritaPilihan.judul}
            </h1>
            
            <p className="text-[11px] md:text-xs text-gray-400 mb-6 border-b pb-4">
              Dipublikasikan • {beritaPilihan.waktu}
            </p>
            
            <div className="w-full h-56 md:h-96 rounded-lg overflow-hidden mb-6 bg-gray-100 shadow-inner">
              <img src={beritaPilihan.image} alt={beritaPilihan.judul} className="w-full h-full object-cover" />
            </div>
            
            <div className="text-gray-700 text-sm md:text-lg leading-relaxed space-y-4 mb-8 whitespace-pre-line">
              {beritaPilihan.isi}
            </div>
            
            <div className="flex flex-wrap gap-3 md:gap-4 border-t pt-4">
              <button 
                onClick={(e) => handleLike(beritaPilihan.id, e)} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors cursor-pointer ${userLikedStatus[beritaPilihan.id] ? "bg-red-100 text-red-600" : "bg-red-50 hover:bg-red-100 text-red-600"}`}
              >
                ❤️ Suka ({likesCount[beritaPilihan.id] || 0})
              </button>
              
              <button 
                onClick={(e) => handleShare(beritaPilihan, e)} 
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors cursor-pointer"
              >
                🔗 Bagikan Berita
              </button>
            </div>
          </div>
        )}

        {/* HALAMAN BERANDA */}
        {halamanAktif === "beranda" && (
          <>
            <header className="mb-6 md:mb-8 border-b-2 border-blue-700 pb-4 mt-2 md:mt-4 text-center md:text-left">
              <h1 className="text-2xl md:text-5xl font-extrabold text-blue-900 tracking-tight leading-tight">
                Portal Berita Kabinet Biru Laut
              </h1>
              <p className="mt-2 text-xs md:text-base text-gray-500 font-medium uppercase tracking-wider">
                Institut Teknologi Muhammadiyah Sumatera
              </p>
            </header>
            
            <div className="mb-6">
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Cari judul berita atau kata kunci..." 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white shadow-sm" 
              />
            </div>
            
            <section className="mb-8 md:mb-10">
              <h2 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Jelajahi Berdasarkan Kementerian:
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {kementerian.map((menteri, index) => (
                  <button 
                    key={index} 
                    onClick={() => setKategoriAktif(menteri)} 
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-bold rounded-md transition-all shadow-sm border cursor-pointer ${kategoriAktif === menteri ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-700 border-gray-200 hover:bg-blue-100"}`}
                  >
                    {menteri}
                  </button>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-5 md:mb-6 text-gray-900 border-l-4 border-blue-700 pl-3">
                {kategoriAktif === "SEMUA" ? "Berita Terbaru" : `Berita Kategori: ${kategoriAktif}`}
              </h2>
              
              {beritaTerpilih.length === 0 ? (
                <p className="text-gray-500 italic py-6 text-sm">Tidak ada berita yang ditemukan.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {beritaTerpilih.map((berita) => (
                    <article 
                      key={berita.id} 
                      onClick={() => { 
                        setBeritaPilihan(berita); 
                        setHalamanAktif("detail"); 
                      }} 
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all bg-white flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="h-44 md:h-48 w-full overflow-hidden bg-gray-100">
                        <img src={berita.image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"} alt={berita.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      
                      <div className="p-4 md:p-5 flex flex-col flex-grow justify-between">
                        <div>
                          <span className="text-[10px] md:text-xs font-bold text-blue-600 mb-2 block uppercase tracking-wider">
                            {berita.kategori}
                          </span>
                          <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                            {berita.judul}
                          </h3>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 pt-3 border-t mb-3">
                            <button 
                              onClick={(e) => handleLike(berita.id, e)} 
                              className={`text-[10px] md:text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition-colors ${userLikedStatus[berita.id] ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                            >
                              ❤️ {likesCount[berita.id] || 0}
                            </button>
                            <button 
                              onClick={(e) => handleShare(berita, e)} 
                              className="text-[10px] md:text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded cursor-pointer"
                            >
                              🔗 Bagikan
                            </button>
                          </div>
                          <span className="text-[10px] md:text-xs text-gray-400 block">
                            {berita.waktu}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* HALAMAN LOGIN ADMIN */}
        {halamanAktif === "login" && (
          <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 my-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-blue-900 mb-2">Login Admin BEM</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-6">Masukkan password rahasia untuk mengakses panel post berita.</p>
            
            <form onSubmit={handleLoginAdmin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password Admin</label>
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  placeholder="Masukkan password..." 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white" 
                  required 
                />
              </div>
              
              <div className="flex gap-3 mt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-md transition-all cursor-pointer text-sm shadow-sm"
                >
                  Masuk
                </button>
                <button 
                  type="button" 
                  onClick={() => setHalamanAktif("beranda")} 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2.5 rounded-md transition-all cursor-pointer text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* HALAMAN ADMIN PANEL */}
        {halamanAktif === "admin" && (
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 my-4 md:my-6">
            <div className={`p-5 md:p-8 rounded-xl shadow-lg border transition-all ${editId ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-blue-900">
                  {editId ? "Edit Berita Terpilih" : "Form Post Berita Baru"}
                </h2>
                <button 
                  onClick={() => { 
                    setHalamanAktif("beranda"); 
                    handleBatalEdit(); 
                  }} 
                  className="text-xs bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded hover:bg-red-200 cursor-pointer"
                >
                  Logout Admin
                </button>
              </div>
              
              <p className="text-xs md:text-sm text-gray-500 mb-6">
                {editId ? "Sedang dalam mode edit. Ubah data di bawah lalu simpan." : "Publikasikan artikel baru atau kelola berita yang sudah ada."}
              </p>
              
              <form onSubmit={handleSimpan} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Judul Berita</label>
                  <input 
                    type="text" 
                    value={judulInput} 
                    onChange={(e) => setJudulInput(e.target.value)} 
                    placeholder="Contoh: Rapat Pleno BEM..." 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kementerian</label>
                  <select 
                    value={kategoriInput} 
                    onChange={(e) => setKategoriInput(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white cursor-pointer"
                  >
                    <option value="MENSOPOL">MENSOPOL</option>
                    <option value="MENPORA">MENPORA</option>
                    <option value="MEN KOMINFO">MEN KOMINFO</option>
                    <option value="MENDAGRI">MENDAGRI</option>
                    <option value="MEN AGAMA">MEN AGAMA</option>
                    <option value="MEN BUMN">MEN BUMN</option>
                    <option value="MEN LUAR NEGERI">MEN LUAR NEGERI</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Upload Foto Baru (Opsional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])} 
                    className="w-full text-xs md:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer border border-gray-300 rounded-md p-1 bg-white" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Isi Berita Lengkap</label>
                  <textarea 
                    rows="6" 
                    value={isiInput} 
                    onChange={(e) => setIsiInput(e.target.value)} 
                    placeholder="Tuliskan berita di sini... (Enter untuk paragraf baru)" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white" 
                    required 
                  />
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 mt-4">
                  <button 
                    type="submit" 
                    className={`flex-1 font-bold py-2.5 rounded-md text-sm shadow-sm text-white ${editId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-700 hover:bg-blue-800"}`}
                  >
                    {editId ? "Simpan Perubahan" : "Publish Berita"}
                  </button>
                  
                  {editId && (
                    <button 
                      type="button" 
                      onClick={handleBatalEdit} 
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2.5 rounded-md text-sm"
                    >
                      Batal Edit
                    </button>
                  )}
                  
                  <button 
                    type="button" 
                    onClick={() => { 
                      setHalamanAktif("beranda"); 
                      handleBatalEdit(); 
                    }} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2.5 rounded-md text-sm"
                  >
                    Ke Beranda
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-white p-5 md:p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 border-b pb-3">
                Daftar Berita Terpublikasi
              </h3>
              
              {daftarBerita.length === 0 ? (
                <p className="text-gray-500 italic text-sm">Belum ada berita tersimpan.</p>
              ) : (
                <div className="space-y-3">
                  {daftarBerita.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg gap-3 bg-gray-50"
                    >
                      <div>
                        <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase">
                          {item.kategori}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm md:text-base leading-tight mt-1">
                          {item.judul}
                        </h4>
                        <span className="text-[10px] md:text-xs text-gray-400 block mt-1">
                          {item.waktu}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
                        <button 
                          onClick={() => handleMulaiEdit(item)} 
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-md shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleHapusBerita(item.id)} 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-md shadow-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER RESPONSIVE */}
      <footer className="bg-gray-900 text-white py-8 mt-10">
        <div className="max-w-screen-xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-5 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
            <p className="text-xs md:text-sm">© 2026 Institut Teknologi Muhammadiyah Sumatera - BEM Kabinet Biru Laut.</p>
            <p className="mt-1 text-[11px] md:text-xs text-gray-500 italic">"Tenang bukan berarti diam, dalam bukan berarti tenggelam."</p>
          </div>
          
          <button 
            onClick={() => setHalamanAktif("login")} 
            className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer underline mt-2 md:mt-0"
          >
            Admin Login
          </button>
          
        </div>
      </footer>

    </div>
  );
}