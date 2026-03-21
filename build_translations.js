#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Load English source files
const categories = ['audio', 'developer', 'image', 'pdf', 'video'];
const enData = {};
const idData = {};
const ptData = {};

categories.forEach(cat => {
  enData[cat] = JSON.parse(fs.readFileSync(`./messages/en/tools-${cat}.json`, 'utf-8'));
  idData[cat] = JSON.parse(fs.readFileSync(`./messages/id/tools-${cat}.json`, 'utf-8'));
  ptData[cat] = JSON.parse(fs.readFileSync(`./messages/pt-PT/tools-${cat}.json`, 'utf-8'));
});

// Indonesian translations - comprehensive mapping
const idTranslations = {
  // Audio tools (4 tools)
  'trim': {
    name: 'Audio Trimmer',
    intro: {
      title: 'Apa itu Audio Trimmer?',
      content: '<p><strong>Audio Trimmer</strong> memotong file audio ke durasi yang diinginkan dengan menetapkan waktu mulai dan akhir yang presisi. Menggunakan stream copy ketika mungkin untuk <strong>pemotongan lossless</strong> — tanpa penyandian ulang, tanpa degradasi kualitas.</p><p>Sempurna untuk menghapus intro, outro, keheningan, dan jeda dari podcast, musik, atau rekaman suara.</p>'
    },
    howToUse: {
      title: 'Cara Menggunakan Audio Trimmer',
      content: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Atur waktu <strong>mulai</strong> dan <strong>akhir</strong> menggunakan slider atau masukkan waktu numerik</li><li>Dengarkan pratinjau audio yang dipotong</li><li>Klik <strong>Trim</strong> dan unduh file audio yang telah dipotong</li></ol><p>Mendukung berbagai format: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC, dan lebih banyak lagi.</p>'
    },
    features: {
      title: 'Fitur Utama',
      content: '<ul><li><strong>Pemotongan Presisi</strong>: Atur waktu mulai dan akhir hingga milidetik</li><li><strong>Stream Copy</strong>: Pemrosesan ultra-cepat tanpa penyandian ulang untuk kualitas sempurna</li><li><strong>Format Dukungan Luas</strong>: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC, dan lebih banyak</li><li><strong>Pratinjau Audio</strong>: Dengarkan hasil sebelum menyimpan</li><li><strong>Batch Trim</strong>: Potong beberapa file dengan pengaturan yang sama</li><li><strong>Kualitas Original</strong>: Tanpa rekompresi — output pada kualitas asli</li></ul>'
    },
    useCases: {
      title: 'Kasus Penggunaan Umum',
      content: '<ul><li><strong>Podcast Editing</strong>: Hapus intro, outro, musik latar dari episode</li><li><strong>Music Production</strong>: Potong lagu untuk preview atau sampel musik</li><li><strong>Voice Recording</strong>: Hilangkan kesalahan, keheningan, jeda dari rekaman</li><li><strong>Video Soundtrack</strong>: Sesuaikan durasi musik untuk video</li><li><strong>Ringtone Creation</strong>: Buat ringtone dengan memotong lagu</li></ul>'
    },
    privacy: {
      title: 'Pemrosesan Audio yang Mengutamakan Privasi',
      content: '<p>Pemotongan audio terjadi <strong>sepenuhnya di browser Anda</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong> — aman untuk file pribadi</li><li>Tidak ada unggahan cloud, tidak ada log server</li><li><strong>Berfungsi offline</strong> setelah halaman dimuat</li></ul>'
    }
  }
};

// Test - show structure
console.log('Translations loaded. Sample audio/trim translation:');
console.log(JSON.stringify(idTranslations.trim, null, 2).substring(0, 200));

module.exports = { idTranslations };
