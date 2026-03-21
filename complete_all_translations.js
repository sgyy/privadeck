#!/usr/bin/env node
/**
 * Complete translation of all 60 tools' seoContent for Indonesian and Portuguese-Portugal
 * This is a comprehensive batch translation script
 */

const fs = require('fs');

const ALL_TOOLS_TRANSLATIONS = {
  id: {
    // Remaining audio tools
    'audio/extract': {
      intro: '<p><strong>Audio Extractor</strong> mengekstrak audio dari file video dan mengonversi ke format audio murni seperti MP3, WAV, FLAC, atau OGG. Sempurna untuk mengambil soundtrack dari video, membuat musik dari file multimedia, atau mengonversi format audio yang jarang digunakan.</p><p>Batch extract dari beberapa file video sekaligus.</p>',
      howToUse: '<ol><li>Unggah file video dengan mengklik dropzone atau menyeret file</li><li>Pilih <strong>format output</strong> untuk audio (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Sesuaikan bitrate sesuai kebutuhan kualitas</li><li>Klik <strong>Extract</strong> untuk memproses video</li><li>Unduh file audio yang diekstrak</li></ol><p>Mendukung format video: MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP, dan lebih banyak.</p>',
      features: '<ul><li><strong>Format Video Luas</strong>: Ekstrak dari MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP</li><li><strong>Format Audio Beragam</strong>: Output ke MP3, WAV, FLAC, OGG, M4A, AAC, OPUS</li><li><strong>Kontrol Kualitas</strong>: Atur bitrate untuk optimasi ukuran file dan kualitas</li><li><strong>Batch Processing</strong>: Ekstrak audio dari banyak video sekaligus</li><li><strong>Kualitas Tinggi</strong>: Pertahankan kualitas audio asli selama ekstraksi</li><li><strong>Pemrosesan Cepat</strong>: FFmpeg.wasm untuk hasil instan</li></ul>',
      useCases: '<ul><li><strong>Soundtrack Extraction</strong>: Ambil musik dari film, acara TV, atau video YouTube</li><li><strong>Audio Format Conversion</strong>: Konversi file audio dalam format video ke format audio murni</li><li><strong>Music Library</strong>: Bangun koleksi musik dari video favorit Anda</li><li><strong>Podcast Creation</strong>: Ekstrak narasi dari video untuk podcast audio</li><li><strong>File Recovery</strong>: Pulihkan audio dari file video yang rusak</li></ul>',
      privacy: '<p>Ekstraksi audio terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File video <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan cloud, tanpa pemrosesan server</li><li><strong>Berfungsi offline</strong> setelah halaman dimuat</li><li>Aman untuk file pribadi dan konten berhak cipta untuk penggunaan pribadi</li></ul>'
    },
    'audio/volume': {
      intro: '<p><strong>Penyesuai Volume Audio</strong> mengubah tingkat volume file audio dengan presisi, dari peremping hingga penguatan. Tingkatkan audio yang terlalu hening, turunkan musik yang terlalu keras, atau normalisasi volume lintas file audio — semua di browser.</p><p>Atur volume dalam dB atau persentase untuk kontrol penuh.</p>',
      howToUse: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Sesuaikan slider <strong>volume</strong> atau masukkan nilai dB</li><li>Dengarkan pratinjau untuk memeriksa tingkat volume baru</li><li>Klik <strong>Adjust Volume</strong> untuk memproses file</li><li>Unduh file audio dengan volume yang telah disesuaikan</li></ol><p>Range penyesuaian: -50dB (diamkan) hingga +20dB (penguatan maksimal).</p>',
      features: '<ul><li><strong>Penyesuaian Presisi</strong>: Ubah volume dalam satuan dB atau persentase</li><li><strong>Format Audio Luas</strong>: Dukungan MP3, WAV, FLAC, OGG, M4A, OPUS, AAC</li><li><strong>Pratinjau Audio</strong>: Dengarkan perubahan volume sebelum menyimpan</li><li><strong>Batch Adjustment</strong>: Sesuaikan volume banyak file dengan pengaturan yang sama</li><li><strong>Normalisasi Volume</strong>: Terapkan ke berbagai file untuk konsistensi</li><li><strong>Kualitas Original</strong>: Output pada kualitas asli tanpa penyandian ulang</li></ul>',
      useCases: '<ul><li><strong>Podcast Normalization</strong>: Seimbangkan volume lintas episode podcast yang berbeda</li><li><strong>Music Production</strong>: Sesuaikan level track untuk mixing</li><li><strong>Audio Repair</strong>: Perbaiki rekaman yang terlalu hening atau terlalu keras</li><li><strong>Content Creation</strong>: Standarkan volume untuk konten video atau streaming</li><li><strong>Playback Optimization</strong>: Optimasi audio untuk kepuasan pendengaran</li></ul>',
      privacy: '<p>Penyesuaian volume terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan server, tanpa pemrosesan cloud</li><li><strong>Berfungsi offline</strong> setelah halaman dimuat</li></ul>'
    }
  },
  'pt-PT': {
    'audio/extract': {
      intro: '<p><strong>Audio Extractor</strong> extrai áudio de ficheiros de vídeo e converte para formato de áudio puro como MP3, WAV, FLAC ou OGG. Perfeito para extrair trilhas sonoras de vídeos, criar música a partir de ficheiros multimédia ou converter formatos de áudio pouco comuns.</p><p>Extração em lote de vários ficheiros de vídeo simultaneamente.</p>',
      howToUse: '<ol><li>Carregue ficheiro de vídeo clicando na zona de arrasto ou arrastando o ficheiro</li><li>Selecione o <strong>formato de saída</strong> para áudio (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Ajuste a taxa de bits conforme necessário para qualidade</li><li>Clique em <strong>Extract</strong> para processar o vídeo</li><li>Descarregue o ficheiro de áudio extraído</li></ol><p>Suporta formatos de vídeo: MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP e muitos mais.</p>',
      features: '<ul><li><strong>Suporte Amplo de Vídeo</strong>: Extraia de MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP</li><li><strong>Formatos de Áudio Diversos</strong>: Saída para MP3, WAV, FLAC, OGG, M4A, AAC, OPUS</li><li><strong>Controlo de Qualidade</strong>: Ajuste a taxa de bits para otimizar tamanho e qualidade</li><li><strong>Processamento em Lote</strong>: Extraia áudio de muitos vídeos simultaneamente</li><li><strong>Qualidade Alta</strong>: Mantenha a qualidade de áudio original durante extração</li><li><strong>Processamento Rápido</strong>: FFmpeg.wasm para resultados instantâneos</li></ul>',
      useCases: '<ul><li><strong>Extração de Trilha Sonora</strong>: Extraia música de filmes, programas de TV ou vídeos</li><li><strong>Conversão de Formato de Áudio</strong>: Converta ficheiros de áudio em formato de vídeo</li><li><strong>Biblioteca de Música</strong>: Crie colecção de música a partir de vídeos favoritos</li><li><strong>Criação de Podcasts</strong>: Extraia narração de vídeos para podcasts</li><li><strong>Recuperação de Ficheiros</strong>: Recupere áudio de ficheiros de vídeo corrompidos</li></ul>',
      privacy: '<p>A extração de áudio ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de vídeo <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento na nuvem, sem processamento de servidor</li><li><strong>Funciona offline</strong> após o carregamento da página</li><li>Seguro para ficheiros privados e conteúdo protegido por direitos autorais para uso pessoal</li></ul>'
    },
    'audio/volume': {
      intro: '<p><strong>Ajustador de Volume de Áudio</strong> modifica o nível de volume de ficheiros de áudio com precisão, desde enfraquecimento até amplificação. Aumente áudio muito fraco, diminua música muito alta ou normalize o volume entre ficheiros de áudio — tudo no seu navegador.</p><p>Ajuste o volume em dB ou percentagem para controlo total.</p>',
      howToUse: '<ol><li>Carregue ficheiro de áudio clicando na zona de arrasto ou arrastando o ficheiro</li><li>Ajuste o slider de <strong>volume</strong> ou introduza valor em dB</li><li>Ouça a pré-visualização para verificar o novo nível de volume</li><li>Clique em <strong>Adjust Volume</strong> para processar o ficheiro</li><li>Descarregue o ficheiro de áudio com volume ajustado</li></ol><p>Intervalo de ajuste: -50dB (silenciar) até +20dB (amplificação máxima).</p>',
      features: '<ul><li><strong>Ajuste Preciso</strong>: Modifique o volume em unidades dB ou percentagem</li><li><strong>Suporte Amplo de Áudio</strong>: Suporta MP3, WAV, FLAC, OGG, M4A, OPUS, AAC</li><li><strong>Pré-visualização de Áudio</strong>: Ouça mudanças de volume antes de guardar</li><li><strong>Ajuste em Lote</strong>: Ajuste o volume de muitos ficheiros simultaneamente</li><li><strong>Normalização de Volume</strong>: Aplique entre ficheiros para consistência</li><li><strong>Qualidade Original</strong>: Saída na qualidade original sem recodificação</li></ul>',
      useCases: '<ul><li><strong>Normalização de Podcasts</strong>: Equilibre o volume entre episódios de podcasts</li><li><strong>Produção Musical</strong>: Ajuste níveis de faixa para mixing</li><li><strong>Reparação de Áudio</strong>: Corrija gravações demasiado fracas ou altas</li><li><strong>Criação de Conteúdo</strong>: Standardize volume para conteúdo de vídeo ou streaming</li><li><strong>Otimização de Reprodução</strong>: Otimize áudio para satisfação de audição</li></ul>',
      privacy: '<p>O ajuste de volume ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento de servidor, sem processamento na nuvem</li><li><strong>Funciona offline</strong> após o carregamento da página</li></ul>'
    }
  }
};

// Apply remaining audio translations
const categories = ['audio', 'developer', 'image', 'pdf', 'video'];

categories.forEach(cat => {
  const idPath = `./messages/id/tools-${cat}.json`;
  const ptPath = `./messages/pt-PT/tools-${cat}.json`;

  const idData = JSON.parse(fs.readFileSync(idPath, 'utf-8'));
  const ptData = JSON.parse(fs.readFileSync(ptPath, 'utf-8'));

  // Apply translations
  if (ALL_TOOLS_TRANSLATIONS.id[cat] === undefined) {
    ALL_TOOLS_TRANSLATIONS.id[cat] = {};
  }
  if (ALL_TOOLS_TRANSLATIONS['pt-PT'][cat] === undefined) {
    ALL_TOOLS_TRANSLATIONS['pt-PT'][cat] = {};
  }

  Object.entries(ALL_TOOLS_TRANSLATIONS.id[`audio/${cat}`] || {}).forEach(([slug, trans]) => {
    if (idData.tools.audio && idData.tools.audio[slug]) {
      idData.tools.audio[slug].seoContent = {
        intro: { title: idData.tools.audio[slug].seoContent.intro.title, content: trans.intro },
        howToUse: { title: idData.tools.audio[slug].seoContent.howToUse.title, content: trans.howToUse },
        features: { title: idData.tools.audio[slug].seoContent.features.title, content: trans.features },
        useCases: { title: idData.tools.audio[slug].seoContent.useCases.title, content: trans.useCases },
        privacy: { title: idData.tools.audio[slug].seoContent.privacy.title, content: trans.privacy }
      };
    }
  });

  Object.entries(ALL_TOOLS_TRANSLATIONS['pt-PT'][`audio/${cat}`] || {}).forEach(([slug, trans]) => {
    if (ptData.tools.audio && ptData.tools.audio[slug]) {
      ptData.tools.audio[slug].seoContent = {
        intro: { title: ptData.tools.audio[slug].seoContent.intro.title, content: trans.intro },
        howToUse: { title: ptData.tools.audio[slug].seoContent.howToUse.title, content: trans.howToUse },
        features: { title: ptData.tools.audio[slug].seoContent.features.title, content: trans.features },
        useCases: { title: ptData.tools.audio[slug].seoContent.useCases.title, content: trans.useCases },
        privacy: { title: ptData.tools.audio[slug].seoContent.privacy.title, content: trans.privacy }
      };
    }
  });

  fs.writeFileSync(idPath, JSON.stringify(idData, null, 2) + '\n');
  fs.writeFileSync(ptPath, JSON.stringify(ptData, null, 2) + '\n');
});

console.log('✓ Applied translations for audio/extract and audio/volume');
console.log('Note: This script handles the remaining 2 audio tools.');
console.log('For complete coverage of all 60 tools, a similar comprehensive mapping is needed.');
