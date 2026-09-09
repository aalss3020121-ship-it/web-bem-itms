'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '@/lib/supabase';

// Import ReactQuill secara dinamis agar Next.js tidak error saat build
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const WAKTU_SHOLAT = [
  { key: 'Fajr', label: 'Subuh' },
  { key: 'Dhuhr', label: 'Dzuhur' },
  { key: 'Asr', label: 'Ashar' },
  { key: 'Maghrib', label: 'Maghrib' },
  { key: 'Isha', label: 'Isya' }
];

const LOKASI_DEFAULT = {
  latitude: 3.5952,
  longitude: 98.6722,
  label: 'Medan'
};

const GALERI_DEFAULT = [
  {
    src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=85',
    alt: 'Mahasiswa berdiskusi bersama',
    label: 'Kolaborasi mahasiswa'
  },
  {
    src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=85',
    alt: 'Mahasiswa bekerja dalam satu tim',
    label: 'Gerak bersama'
  },
  {
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=85',
    alt: 'Suasana kegiatan kampus',
    label: 'Ruang bertumbuh'
  },
  {
    src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=85',
    alt: 'Presentasi dalam sebuah kegiatan',
    label: 'Menyuarakan aspirasi'
  }
];

export default function Home() {
  
  const [halamanAktif, setHalamanAktif] = useState("beranda"); // "beranda", "ibadah", "login", "admin", "detail", "tentang", "galeri"
  const [kategoriAktif, setKategoriAktif] = useState("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [beritaPilihan, setBeritaPilihan] = useState(null);

  const [editId, setEditId] = useState(null);
  const [likesCount, setLikesCount] = useState({});
  const [userLikedStatus, setUserLikedStatus] = useState(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      return JSON.parse(localStorage.getItem('user_liked_status_v2') || '{}');
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const [daftarBerita, setDaftarBerita] = useState([]);
  const [daftarGaleri, setDaftarGaleri] = useState(GALERI_DEFAULT);
  const [galeriEditId, setGaleriEditId] = useState(null);
  const [galeriJudulInput, setGaleriJudulInput] = useState("");
  const [galeriAltInput, setGaleriAltInput] = useState("");
  const [galeriImageFile, setGaleriImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jadwalSholat, setJadwalSholat] = useState(null);
  const [lokasiSholat, setLokasiSholat] = useState(LOKASI_DEFAULT);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [pengingatAktif, setPengingatAktif] = useState(false);
  const [arahKiblat, setArahKiblat] = useState(null);
  const [kompasAktif, setKompasAktif] = useState(false);

  const fetchBerita = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('berita')
        .select('*');

      if (fetchError) throw fetchError;

      const beritaTersusun = [...(data || [])].sort((a, b) => {
        if (a.created_at || b.created_at) {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }

        if (typeof a.id === "number" && typeof b.id === "number") {
          return b.id - a.id;
        }

        return 0;
      });

      setDaftarBerita(beritaTersusun);

      // Build likes count dari data Supabase
      const counts = {};
      beritaTersusun.forEach((item) => {
        counts[item.id] = item.likes || 0;
      });
      setLikesCount(counts);
      setError(null);
    } catch (err) {
      console.error('Gagal fetch berita:', err);
      setError('Gagal memuat berita. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGaleri = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('galeri')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Gagal fetch galeri:', fetchError);
      return;
    }

    setDaftarGaleri(data?.length ? data : GALERI_DEFAULT);
  }, []);

  // Fetch berita dari Supabase saat pertama kali load
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchBerita();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBerita]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchGaleri();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchGaleri]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch((registrationError) => {
      console.error('Gagal mendaftarkan PWA service worker:', registrationError);
    });
  }, []);

  useEffect(() => {
    let dibatalkan = false;

    const ambilJadwal = async (latitude, longitude, label) => {
      setLoadingJadwal(true);
      try {
        const tanggal = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
        const response = await fetch(`https://api.aladhan.com/v1/timings/${tanggal}?latitude=${latitude}&longitude=${longitude}&method=11`);
        if (!response.ok) throw new Error('Jadwal sholat tidak tersedia');
        const hasil = await response.json();
        if (!dibatalkan) {
          setJadwalSholat(hasil.data.timings);
          setLokasiSholat({ latitude, longitude, label });
        }
      } catch (jadwalError) {
        console.error('Gagal memuat jadwal sholat:', jadwalError);
      } finally {
        if (!dibatalkan) setLoadingJadwal(false);
      }
    };

    if (!navigator.geolocation) {
      ambilJadwal(LOKASI_DEFAULT.latitude, LOKASI_DEFAULT.longitude, LOKASI_DEFAULT.label);
      return () => { dibatalkan = true; };
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => ambilJadwal(coords.latitude, coords.longitude, 'Lokasi perangkat'),
      () => ambilJadwal(LOKASI_DEFAULT.latitude, LOKASI_DEFAULT.longitude, LOKASI_DEFAULT.label),
      { enableHighAccuracy: false, timeout: 8000 }
    );

    return () => { dibatalkan = true; };
  }, []);

  useEffect(() => {
    if (!pengingatAktif || !jadwalSholat) return undefined;

    const timerIds = WAKTU_SHOLAT.map(({ key, label }) => {
      const [jam, menit] = jadwalSholat[key].split(':').map(Number);
      const waktuSholat = new Date();
      waktuSholat.setHours(jam, menit, 0, 0);
      const selisih = waktuSholat.getTime() - Date.now();
      if (selisih <= 0) return null;

      return window.setTimeout(() => {
        const judul = `Waktu sholat ${label}`;
        if (Notification.permission === 'granted') {
          new Notification(judul, { body: `Saatnya menunaikan sholat ${label}.` });
        }
      }, selisih);
    }).filter(Boolean);

    return () => timerIds.forEach((timerId) => window.clearTimeout(timerId));
  }, [jadwalSholat, pengingatAktif]);

  useEffect(() => {
    if (!kompasAktif) return undefined;

    const hitungArahKiblat = (event) => {
      const heading = event.webkitCompassHeading || (360 - (event.alpha || 0));
      const phi1 = lokasiSholat.latitude * Math.PI / 180;
      const phi2 = 21.4225 * Math.PI / 180;
      const deltaLambda = (39.8262 - lokasiSholat.longitude) * Math.PI / 180;
      const arah = Math.atan2(
        Math.sin(deltaLambda),
        Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda)
      ) * 180 / Math.PI;
      setArahKiblat((heading + arah + 360) % 360);
    };

    window.addEventListener('deviceorientation', hitungArahKiblat, true);
    return () => window.removeEventListener('deviceorientation', hitungArahKiblat, true);
  }, [kompasAktif, lokasiSholat]);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== 'production'
      });
    });
  }, []);

  const handleRefreshBerita = () => {
    setLoading(true);
    fetchBerita();
  };

  const [judulInput, setJudulInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState("BERITA UTAMA");
  const [penulisInput, setPenulisInput] = useState("PRESIDEN BEM");
  const [isiInput, setIsiInput] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleLike = async (id, e) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!userLikedStatus[id];
    const newUserLikedStatus = { ...userLikedStatus };
    const newLikesCount = { ...likesCount };

    if (isCurrentlyLiked) {
      newLikesCount[id] = Math.max(0, (newLikesCount[id] || 0) - 1);
      newUserLikedStatus[id] = false;
    } else {
      newLikesCount[id] = (newLikesCount[id] || 0) + 1;
      newUserLikedStatus[id] = true;
    }

    // Update state lokal dulu (optimistic update)
    setLikesCount(newLikesCount);
    setUserLikedStatus(newUserLikedStatus);
    localStorage.setItem('user_liked_status_v2', JSON.stringify(newUserLikedStatus));

    // Update di Supabase
    try {
      const { error: updateError } = await supabase
        .from('berita')
        .update({ likes: newLikesCount[id] })
        .eq('id', id);
      
      if (updateError) throw updateError;
    } catch (err) {
      console.error('Gagal update like:', err);
    }
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

  const handleAktifkanNotifikasi = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
    });
  };

  const handleAktifkanPengingat = async () => {
    if (!('Notification' in window)) {
      alert('Browser ini belum mendukung notifikasi.');
      return;
    }

    const izin = await Notification.requestPermission();
    if (izin !== 'granted') {
      alert('Izin notifikasi belum diberikan.');
      return;
    }

    setPengingatAktif(true);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
    });
  };

  const handleAktifkanKompas = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const izin = await DeviceOrientationEvent.requestPermission();
      if (izin !== 'granted') return;
    }

    setKompasAktif(true);
  };

  const waktuBerikutnya = jadwalSholat && WAKTU_SHOLAT.map(({ key, label }) => {
    const [jam, menit] = jadwalSholat[key].split(':').map(Number);
    const waktu = new Date();
    waktu.setHours(jam, menit, 0, 0);
    return { key, label, waktu };
  }).find(({ waktu }) => waktu > new Date());

  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (passwordInput === "bem123") { 
      setHalamanAktif("admin"); 
      setPasswordInput(""); 
    } else { 
      alert("Password salah!"); 
    }
  };

  const buatWaktuFormat = () => {
    const now = new Date();
    const hari = now.getDate().toString().padStart(2, '0');
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const bulan = namaBulan[now.getMonth()];
    const tahun = now.getFullYear();
    const jam = now.getHours().toString().padStart(2, '0');
    const menit = now.getMinutes().toString().padStart(2, '0');
    
    return `${hari} ${bulan} ${tahun}, ${jam}:${menit} WIB`;
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ]
  };

  const prosesSimpanBerita = async (imageData) => {
    try {
      if (editId) {
        // UPDATE berita di Supabase
        const updateData = { 
          judul: judulInput, 
          kategori: kategoriInput, 
          penulis: penulisInput,
          isi: isiInput 
        };
        if (imageData) {
          updateData.image = imageData;
        }

        const { error: updateError } = await supabase
          .from('berita')
          .update(updateData)
          .eq('id', editId);

        if (updateError) throw updateError;
        alert("Berita diperbarui!");
      } else {
        // INSERT berita baru ke Supabase
        const defaultImages = [
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", 
          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
        ];
        const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
        
        const beritaBaru = { 
          judul: judulInput, 
          kategori: kategoriInput, 
          penulis: penulisInput,
          waktu: buatWaktuFormat(), 
          image: imageData || randomImage, 
          isi: isiInput
        };

        const { error: insertError } = await supabase
          .from('berita')
          .insert([beritaBaru]);

        if (insertError) throw insertError;

        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: beritaBaru.judul,
              category: beritaBaru.kategori,
              url: window.location.origin
            })
          });
        } catch (notificationError) {
          console.error('Gagal mengirim notifikasi:', notificationError);
        }
        alert("Berita diposting!");
      }
      
      // Refresh data dari Supabase
      await fetchBerita();
      
      setJudulInput(""); 
      setIsiInput(""); 
      setImageFile(null); 
      setEditId(null);
    } catch (err) {
      console.error('Gagal menyimpan berita:', err);
      alert("Gagal menyimpan berita. Cek koneksi internet.");
    }
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
    setPenulisInput(berita.penulis || "PRESIDEN BEM");
    setIsiInput(berita.isi);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatalEdit = () => { 
    setEditId(null); 
    setJudulInput(""); 
    setIsiInput(""); 
    setImageFile(null); 
  };

  const handleHapusBerita = async (id) => {
    if (confirm("Hapus berita permanen?")) {
      try {
        const { error: deleteError } = await supabase
          .from('berita')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        // Refresh data dari Supabase
        await fetchBerita();
        
        if (editId === id) {
          handleBatalEdit();
        }
      } catch (err) {
        console.error('Gagal menghapus berita:', err);
        alert("Gagal menghapus berita. Cek koneksi internet.");
      }
    }
  };

  const resetFormGaleri = () => {
    setGaleriEditId(null);
    setGaleriJudulInput("");
    setGaleriAltInput("");
    setGaleriImageFile(null);
  };

  const handleSimpanGaleri = (e) => {
    e.preventDefault();
    if (!galeriJudulInput.trim() || (!galeriImageFile && !galeriEditId)) {
      alert('Judul dan foto galeri wajib diisi.');
      return;
    }

    const simpanData = async (imageData) => {
      const galeriData = {
        judul: galeriJudulInput.trim(),
        alt: galeriAltInput.trim() || galeriJudulInput.trim()
      };
      if (imageData) galeriData.src = imageData;

      const query = galeriEditId
        ? supabase.from('galeri').update(galeriData).eq('id', galeriEditId)
        : supabase.from('galeri').insert([galeriData]);
      const { error: saveError } = await query;

      if (saveError) {
        console.error('Gagal menyimpan galeri:', saveError);
        alert('Gagal menyimpan galeri. Pastikan tabel galeri sudah tersedia di Supabase.');
        return;
      }

      await fetchGaleri();
      resetFormGaleri();
    };

    if (galeriImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => simpanData(reader.result);
      reader.readAsDataURL(galeriImageFile);
    } else {
      simpanData(null);
    }
  };

  const handleMulaiEditGaleri = (foto) => {
    setGaleriEditId(foto.id);
    setGaleriJudulInput(foto.judul || foto.label || '');
    setGaleriAltInput(foto.alt || '');
    setGaleriImageFile(null);
  };

  const handleHapusGaleri = async (id) => {
    if (!confirm('Hapus foto galeri permanen?')) return;

    const { error: deleteError } = await supabase.from('galeri').delete().eq('id', id);
    if (deleteError) {
      console.error('Gagal menghapus galeri:', deleteError);
      alert('Gagal menghapus foto galeri.');
      return;
    }

    await fetchGaleri();
    if (galeriEditId === id) resetFormGaleri();
  };

  const kategoriBerita = [
    "SEMUA", 
    "BERITA UTAMA", 
    "INFO AKADEMIK", 
    "KAJIAN & OPINI", 
    "EVENT BEM", 
    "PENGUMUMAN",
    "EKSTERNAL"
  ];

  const beritaTerpilih = daftarBerita.filter((berita) => {
    const sesuaiKategori = kategoriAktif === "SEMUA" || berita.kategori === kategoriAktif;
    const sesuaiPencarian = berita.judul.toLowerCase().includes(searchTerm.toLowerCase());
    return sesuaiKategori && sesuaiPencarian;
  });

  const normalisasiIsiBerita = (isi) => (isi || '')
    .replace(/&nbsp;|&#160;|&#xA0;|\u00a0/gi, ' ');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <style jsx global>{`
        /* PERBAIKAN MUTLAK: Paksa semua elemen teks di seluruh web agar tidak memotong kata */
        body, h1, h2, h3, h4, p, div, span, article {
          overflow-wrap: normal !important;
          word-break: normal !important;
          white-space: normal !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }

        html, body {
          max-width: 100%;
          overflow-x: hidden;
        }

        /* RESET KHUSUS UNTUK KONTEN BERITA */
        .quill-content {
          display: block !important;
          box-sizing: border-box !important;
          width: auto !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: visible !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
          white-space: normal !important;
          hyphens: none !important;
        }

        .quill-content, .quill-content * {
          box-sizing: border-box !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          white-space: normal !important;
          hyphens: none !important;
        }

        .quill-content img, .quill-content video, .quill-content iframe {
          max-width: 100% !important;
          height: auto !important;
        }
        
        .quill-content p { 
          display: block !important;
          width: auto !important;
          max-width: 100% !important;
          overflow: visible !important;
          margin-bottom: 1em; 
          text-align: left !important; 
        }
        
        .quill-content h1 { font-size: 1.75em; font-weight: bold; margin-bottom: 0.5em; }
        .quill-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        .quill-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .quill-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .quill-content strong { font-weight: bold; }
        .quill-content em { font-style: italic; }
        .quill-content u { text-decoration: underline; }
      `}</style>
      
      {/* NAVBAR RESPONSIVE */}
      <nav className="bg-blue-950 text-white shadow-md sticky top-0 z-50 border-b border-blue-900">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          
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
                setHalamanAktif("ibadah"); 
                setBeritaPilihan(null); 
              }} 
              className="hover:text-blue-200 cursor-pointer"
            >
              Ibadah
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
            <button 
              onClick={() => { 
                setHalamanAktif("galeri"); 
                setBeritaPilihan(null); 
              }} 
              className="hover:text-blue-200 cursor-pointer"
            >
              Galeri
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
                <img src="/logo-bem.jpg" alt="Logo BEM" className="h-11 w-11 md:h-[55px] md:w-[55px] object-cover rounded-full border-2 border-yellow-500 shadow-md" />
                <img src="/36914.png" alt="Logo Kabinet" style={{ mixBlendMode: 'multiply' }} className="h-14 md:h-[70px] w-auto object-contain" />
              </div>
              <h1 className="text-xl md:text-4xl font-extrabold text-blue-900 leading-tight">Institut Teknologi Muhammadiyah Sumatera</h1>
              <p className="text-blue-600 font-bold mt-1 text-sm md:text-base">Badan Eksekutif Mahasiswa - Kabinet Biru Laut</p>
            </div>
            
            <div className="text-gray-700 text-sm md:text-lg leading-relaxed space-y-6">
              <p>Badan Eksekutif Mahasiswa (BEM) ITMS Kabinet Biru Laut merupakan lembaga eksekutif tertinggi di tingkat mahasiswa kampus ITMS yang bergerak aktif sebagai wadah penyalur aspirasi, penggerak perubahan, serta pusat pengembangan potensi mahasiswa.</p>
              
              <div className="bg-blue-50 p-5 md:p-6 rounded-xl border-l-4 border-blue-600 italic text-blue-900 font-semibold text-center shadow-inner text-sm md:text-base">
                &quot;Tenang bukan berarti diam, dalam bukan berarti tenggelam - kami bergerak seperti laut, membawa perubahan.&quot;
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

        {/* HALAMAN GALERI */}
        {halamanAktif === "galeri" && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-[0.2em]">Dokumentasi gerakan</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950 mt-1">Galeri Kegiatan</h1>
                <p className="text-gray-600 text-sm mt-2">Ruang untuk menyimpan cerita dan momen kegiatan BEM ITMS.</p>
              </div>
              <button onClick={() => setHalamanAktif("beranda")} className="text-sm font-bold text-blue-700 hover:underline cursor-pointer self-start md:self-auto">
                ← Kembali ke Beranda
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {daftarGaleri.map((foto, index) => (
                <figure key={foto.id || foto.src} className={`group relative overflow-hidden rounded-xl bg-blue-950 shadow-md ${index === 0 ? 'sm:col-span-2 lg:col-span-2 aspect-[2/1]' : 'aspect-[4/3]'}`}>
                  <img src={foto.src} alt={foto.alt || foto.judul || foto.label} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/95 to-transparent px-4 pb-4 pt-16 text-sm font-bold text-white">
                    {foto.judul || foto.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* HALAMAN BACA DETAIL BERITA */}
        {halamanAktif === "detail" && beritaPilihan && (
          <div className="w-full max-w-3xl min-w-0 mx-auto bg-white p-5 md:p-10 rounded-xl shadow-md border border-gray-200 overflow-hidden md:mt-6 mb-8 md:mb-12">
            <button 
              onClick={() => { 
                setHalamanAktif("beranda"); 
                setBeritaPilihan(null); 
              }} 
              className="text-sm font-bold text-blue-700 hover:underline mb-6 block cursor-pointer"
            >
              ← Kembali ke Beranda
            </button>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded">
                {beritaPilihan.kategori}
              </span>
              {beritaPilihan.penulis && (
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  Oleh: {beritaPilihan.penulis}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4 leading-snug">
              {beritaPilihan.judul}
            </h1>
            
            <p className="text-[11px] md:text-xs text-gray-400 mb-6 border-b pb-4">
              Dipublikasikan • {beritaPilihan.waktu}
            </p>
            
            <div className="w-full h-56 md:h-96 rounded-lg overflow-hidden mb-6 bg-gray-100 shadow-inner">
              <img src={beritaPilihan.image} alt={beritaPilihan.judul} className="w-full h-full object-cover" />
            </div>
            
            <div 
                className="quill-content text-gray-700 text-sm md:text-lg leading-relaxed mb-8"
                style={{ whiteSpace: "normal", overflowWrap: "normal", wordBreak: "normal", maxWidth: "100%" }}
              dangerouslySetInnerHTML={{ __html: normalisasiIsiBerita(beritaPilihan.isi) }}
            />
            
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

        {/* HALAMAN IBADAH */}
        {halamanAktif === "ibadah" && (
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            <header className="bg-blue-950 text-white rounded-2xl p-6 md:p-10 shadow-lg overflow-hidden relative">
              <div className="relative z-10 max-w-2xl">
                <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">Ruang Ibadah BEM ITMS</p>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Jadwal sholat hari ini</h1>
                <p className="text-blue-100 mt-3 text-sm md:text-base">Temukan waktu sholat, arah kiblat, dan bacaan Al-Qur&apos;an dalam satu tempat.</p>
                <p className="mt-5 text-xs text-blue-200">Lokasi: {lokasiSholat.label}</p>
              </div>
              <div className="absolute -right-10 -bottom-20 w-64 h-64 rounded-full border-[32px] border-blue-900/70" aria-hidden="true" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-7">
                <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Waktu sholat</h2>
                    <p className="text-xs text-gray-500 mt-1">Metode perhitungan Kementerian Agama RI</p>
                  </div>
                  {waktuBerikutnya && (
                    <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider block">Berikutnya</span>
                      <strong className="text-sm">{waktuBerikutnya.label}, {jadwalSholat[waktuBerikutnya.key]}</strong>
                    </div>
                  )}
                </div>

                {loadingJadwal ? (
                  <div className="py-12 text-center text-sm text-gray-500">Memuat jadwal sholat...</div>
                ) : jadwalSholat ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {WAKTU_SHOLAT.map(({ key, label }) => (
                      <div key={key} className={`rounded-lg p-3 text-center border ${waktuBerikutnya?.key === key ? 'bg-blue-700 text-white border-blue-700' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                        <span className="text-xs font-semibold block">{label}</span>
                        <strong className="text-xl block mt-1">{jadwalSholat[key]}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-600">Jadwal belum dapat dimuat. Periksa koneksi internet.</p>
                )}

                <button
                  onClick={handleAktifkanPengingat}
                  className={`mt-5 w-full py-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${pengingatAktif ? 'bg-green-100 text-green-700' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                >
                  {pengingatAktif ? 'Pengingat sholat aktif' : 'Aktifkan pengingat sholat'}
                </button>
                <p className="text-[11px] text-gray-400 mt-2 text-center">Izin notifikasi diperlukan agar pengingat dapat muncul.</p>
              </section>

              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-7 flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Kompas kiblat</h2>
                    <p className="text-xs text-gray-500 mt-1">Aktifkan sensor arah perangkat</p>
                  </div>
                  <span className="text-2xl" aria-hidden="true">🧭</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="w-40 h-40 rounded-full border-4 border-blue-100 bg-blue-50 flex items-center justify-center relative" style={{ transform: `rotate(${arahKiblat || 0}deg)` }}>
                    <span className="absolute top-2 text-xs font-bold text-blue-700">UTARA</span>
                    <span className="text-5xl" aria-hidden="true">↑</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    {arahKiblat === null ? 'Arah kiblat akan muncul setelah kompas diaktifkan.' : `Arah kiblat ${Math.round(arahKiblat)}°`}
                  </p>
                </div>
                <button onClick={handleAktifkanKompas} className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold cursor-pointer">
                  {kompasAktif ? 'Kompas sedang membaca arah' : 'Aktifkan kompas'}
                </button>
              </section>
            </div>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-2">Baca dan renungkan</p>
                <h2 className="text-2xl font-extrabold text-gray-900">Al-Qur&apos;an digital</h2>
                <p className="text-sm text-gray-500 mt-1">Baca Al-Qur&apos;an lengkap dengan terjemahan Bahasa Indonesia.</p>
              </div>
              <a href="https://quran.kemenag.go.id/" target="_blank" rel="noopener noreferrer" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg text-sm font-bold text-center">
                Buka Al-Qur&apos;an
              </a>
            </section>
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
                Jelajahi Berdasarkan Kategori:
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {kategoriBerita.map((kat, index) => (
                  <button 
                    key={index} 
                    onClick={() => setKategoriAktif(kat)} 
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-bold rounded-md transition-all shadow-sm border cursor-pointer ${kategoriAktif === kat ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-700 border-gray-200 hover:bg-blue-100"}`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-5 md:mb-6 text-gray-900 border-l-4 border-blue-700 pl-3">
                {kategoriAktif === "SEMUA" ? "Berita Terbaru" : `Berita Kategori: ${kategoriAktif}`}
              </h2>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-sm font-medium">Memuat berita dari server...</p>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                  <p className="font-bold mb-1">⚠️ Terjadi Kesalahan</p>
                  <p>{error}</p>
                  <button 
                    onClick={handleRefreshBerita} 
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-md cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Data Loaded */}
              {!loading && !error && beritaTerpilih.length === 0 && (
                <p className="text-gray-500 italic py-6 text-sm">Tidak ada berita yang ditemukan.</p>
              )}

              {!loading && !error && beritaTerpilih.length > 0 && (
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
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider">
                              {berita.kategori}
                            </span>
                            {berita.penulis && (
                              <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                Oleh: {berita.penulis}
                              </span>
                            )}
                          </div>
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
                          <span className="text-[10px] md:text-xs text-gray-400 block font-medium">
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Berita</label>
                  <select 
                    value={kategoriInput} 
                    onChange={(e) => setKategoriInput(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white cursor-pointer"
                  >
                    <option value="BERITA UTAMA">BERITA UTAMA</option>
                    <option value="INFO AKADEMIK">INFO AKADEMIK</option>
                    <option value="KAJIAN & OPINI">KAJIAN & OPINI</option>
                    <option value="EVENT BEM">EVENT BEM</option>
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                    <option value="EKSTERNAL">EKSTERNAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Asal / Penulis</label>
                  <select 
                    value={penulisInput} 
                    onChange={(e) => setPenulisInput(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white cursor-pointer"
                  >
                    <option value="PRESIDEN BEM">PRESIDEN BEM</option>
                    <option value="WAKIL PRESIDEN BEM">WAKIL PRESIDEN BEM</option>
                    <option value="SEKRETARIS BEM">SEKRETARIS BEM</option>
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
                  <div className="bg-white">
                    <ReactQuill 
                      theme="snow"
                      value={isiInput} 
                      onChange={setIsiInput}
                      modules={quillModules}
                      placeholder="Tuliskan berita di sini..."
                    />
                  </div>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase">
                            {item.kategori}
                          </span>
                          {item.penulis && (
                            <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              Oleh: {item.penulis}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm md:text-base leading-tight mt-1">
                          {item.judul}
                        </h4>
                        <span className="text-[10px] md:text-xs text-gray-400 block mt-1 font-medium">
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

            <div className={`p-5 md:p-8 rounded-xl shadow-lg border transition-all ${galeriEditId ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    {galeriEditId ? 'Edit Foto Galeri' : 'Tambah Foto Galeri'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Kelola dokumentasi yang tampil di halaman Galeri.</p>
                </div>
                {galeriEditId && (
                  <button type="button" onClick={resetFormGaleri} className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer">
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSimpanGaleri} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Judul Foto</label>
                  <input
                    type="text"
                    value={galeriJudulInput}
                    onChange={(e) => setGaleriJudulInput(e.target.value)}
                    placeholder="Contoh: Rapat kerja kabinet"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={galeriAltInput}
                    onChange={(e) => setGaleriAltInput(e.target.value)}
                    placeholder="Deskripsi untuk aksesibilitas"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-black bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">{galeriEditId ? 'Ganti Foto (Opsional)' : 'Upload Foto'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGaleriImageFile(e.target.files[0])}
                    className="w-full text-xs md:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer border border-gray-300 rounded-md p-1 bg-white"
                    required={!galeriEditId}
                  />
                </div>
                <button type="submit" className="md:col-span-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-md text-sm">
                  {galeriEditId ? 'Simpan Perubahan Foto' : 'Tambah ke Galeri'}
                </button>
              </form>
            </div>

            <div className="bg-white p-5 md:p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 border-b pb-3">Daftar Foto Galeri</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {daftarGaleri.map((foto) => (
                  <div key={foto.id || foto.src} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="aspect-square bg-gray-200">
                      <img src={foto.src} alt={foto.alt || foto.judul || foto.label} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{foto.judul || foto.label}</h4>
                      {foto.id ? (
                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={() => handleMulaiEditGaleri(foto)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-md">Edit</button>
                          <button type="button" onClick={() => handleHapusGaleri(foto.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-md">Hapus</button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-2">Foto bawaan</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER RESPONSIVE DENGAN SVG */}
      <footer className="bg-gray-900 text-white py-8 mt-10 border-t-4 border-blue-800">
        <div className="max-w-screen-xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-6 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start order-3 md:order-1 mt-4 md:mt-0">
            <p className="text-xs md:text-sm text-gray-300">© 2026 Institut Teknologi Muhammadiyah Sumatera</p>
            <p className="text-[11px] md:text-xs font-bold text-blue-400 mt-1">BEM Kabinet Biru Laut</p>
            <p className="mt-1.5 text-[10px] md:text-[11px] text-gray-500 italic">&quot;Tenang bukan berarti diam, dalam bukan berarti tenggelam.&quot;</p>
          </div>
          
          <div className="flex flex-col items-center order-1 md:order-2">
            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 md:mb-3">Hubungi & Ikuti Kami</span>
            <div className="flex flex-wrap justify-center gap-5 md:gap-6">
              
              <a href="https://youtube.com/@bemitms?si=2Zn-1f9g4d8lzB83" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-xs font-medium hidden md:inline">YouTube</span>
              </a>

              <a href="https://www.instagram.com/bemitms?igsh=dnMybmx0NGU5Nm51" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors cursor-pointer group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span className="text-xs font-medium hidden md:inline">Instagram</span>
              </a>

              <a href="https://www.tiktok.com/@bemiitms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-xs font-medium hidden md:inline">TikTok</span>
              </a>

              <a href="https://api.whatsapp.com/send/?phone=6285175329877&text=bang+webnya+error&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors cursor-pointer group">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <span className="text-xs font-medium hidden md:inline">WhatsApp</span>
              </a>
              
            </div>
          </div>
          
          <div className="order-2 md:order-3 mt-4 md:mt-0">
            <button
              onClick={handleAktifkanNotifikasi}
              className="text-xs bg-blue-950 hover:bg-blue-800 text-blue-200 hover:text-white px-4 py-2 rounded-md transition-colors cursor-pointer border border-blue-800 shadow-sm"
            >
              Aktifkan Notifikasi
            </button>
            <button 
              onClick={() => setHalamanAktif("login")} 
              className="text-xs bg-gray-800 hover:bg-blue-900 text-gray-400 hover:text-white px-4 py-2 rounded-md transition-colors cursor-pointer border border-gray-700 shadow-sm flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z"/>
              </svg>
              Admin Login
            </button>
          </div>
          
        </div>
      </footer>

    </div>
  );
}