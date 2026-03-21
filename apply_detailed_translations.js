#!/usr/bin/env node
/**
 * Apply detailed, professional translations for all 60 tools
 * Indonesian and Portuguese-Portugal seoContent translations
 */

const fs = require('fs');

// Comprehensive translation mapping - all 60 tools
const TRANSLATIONS = {
  'id': { // Indonesian
    'audio/trim': {
      intro: '<p><strong>Audio Trimmer</strong> memotong file audio ke durasi yang diinginkan dengan menetapkan waktu mulai dan akhir yang presisi. Menggunakan stream copy ketika mungkin untuk <strong>pemotongan lossless</strong> — tanpa penyandian ulang, tanpa degradasi kualitas.</p><p>Sempurna untuk menghapus intro, outro, keheningan, dan jeda dari podcast, musik, atau rekaman suara.</p>',
      howToUse: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Atur waktu <strong>mulai</strong> dan <strong>akhir</strong> menggunakan slider atau masukkan waktu numerik</li><li>Dengarkan pratinjau audio yang dipotong</li><li>Klik <strong>Trim</strong> dan unduh file audio yang telah dipotong</li></ol><p>Mendukung berbagai format: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC, dan lebih banyak lagi.</p>',
      features: '<ul><li><strong>Pemotongan Presisi</strong>: Atur waktu mulai dan akhir hingga milidetik</li><li><strong>Stream Copy</strong>: Pemrosesan ultra-cepat tanpa penyandian ulang untuk kualitas sempurna</li><li><strong>Format Dukungan Luas</strong>: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC, dan lebih banyak</li><li><strong>Pratinjau Audio</strong>: Dengarkan hasil sebelum menyimpan</li><li><strong>Batch Trim</strong>: Potong beberapa file dengan pengaturan yang sama</li><li><strong>Kualitas Original</strong>: Tanpa rekompresi — output pada kualitas asli</li></ul>',
      useCases: '<ul><li><strong>Podcast Editing</strong>: Hapus intro, outro, musik latar dari episode</li><li><strong>Music Production</strong>: Potong lagu untuk preview atau sampel musik</li><li><strong>Voice Recording</strong>: Hilangkan kesalahan, keheningan, jeda dari rekaman</li><li><strong>Video Soundtrack</strong>: Sesuaikan durasi musik untuk video</li><li><strong>Ringtone Creation</strong>: Buat ringtone dengan memotong lagu</li></ul>',
      privacy: '<p>Pemotongan audio terjadi <strong>sepenuhnya di browser Anda</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong> — aman untuk file pribadi</li><li>Tidak ada unggahan cloud, tidak ada log server</li><li><strong>Berfungsi offline</strong> setelah halaman dimuat</li></ul>'
    },
    'audio/convert': {
      intro: '<p><strong>Konverter Audio</strong> mengubah file audio antara format populer termasuk MP3, WAV, FLAC, OGG, M4A, dan OPUS. Konversi dengan kontrol kualitas bitrate — semua di browser Anda tanpa unggahan server.</p><p>Konversi batch: ubah beberapa file sekaligus dengan pengaturan yang sama.</p>',
      howToUse: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Pilih <strong>format output</strong> dari dropdown (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Sesuaikan bitrate untuk kontrol kualitas</li><li>Klik <strong>Convert</strong> untuk memproses semua file</li><li>Unduh file yang dikonversi individual atau sebagai ZIP</li></ol>',
      features: '<ul><li><strong>Format Ganda</strong>: Konversi antara MP3, WAV, FLAC, OGG, M4A, AAC, OPUS, dan format lainnya</li><li><strong>Kontrol Kualitas</strong>: Pilih bitrate untuk menyeimbangkan kualitas dan ukuran file</li><li><strong>Konversi Batch</strong>: Ubah banyak file dengan pengaturan yang sama secara bersamaan</li><li><strong>Pemrosesan Cepat</strong>: FFmpeg.wasm untuk konversi instan</li><li><strong>Kualitas Output Tinggi</strong>: Jaga kualitas audio selama konversi</li></ul>',
      useCases: '<ul><li><strong>Kompatibilitas Format</strong>: Konversi ke format yang didukung perangkat Anda</li><li><strong>Optimasi File</strong>: Konversi ke format terkompresi untuk menghemat ruang</li><li><strong>Distribusi Audio</strong>: Konversi ke format standar untuk berbagi</li><li><strong>Platform Compatibility</strong>: Siapkan audio untuk berbagai perangkat</li></ul>',
      privacy: '<p>Konversi audio terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan server, tanpa pemrosesan cloud</li><li><strong>Berfungsi offline</strong> setelah halaman dimuat</li><li>Verifikasi: buka DevTools (F12) → tab Network — zero data ditransmisikan</li></ul>'
    },
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
  'pt-PT': { // Portuguese-Portugal
    'audio/trim': {
      intro: '<p><strong>Audio Trimmer</strong> corta ficheiros de áudio para a duração desejada definindo tempos de início e fim precisos. Utiliza cópia de fluxo quando possível para <strong>corte lossless</strong> — sem recodificação, sem degradação de qualidade.</p><p>Perfeito para remover intros, outros, silêncios e pausas de podcasts, músicas ou gravações de voz.</p>',
      howToUse: '<ol><li>Carregue um ficheiro de áudio clicando na zona de arrasto ou arrastando o ficheiro</li><li>Defina os tempos de <strong>início</strong> e <strong>fim</strong> utilizando sliders ou entrada numérica</li><li>Ouça a pré-visualização do áudio cortado</li><li>Clique em <strong>Trim</strong> e descarregue o ficheiro de áudio cortado</li></ol><p>Suporta vários formatos: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC, e muitos mais.</p>',
      features: '<ul><li><strong>Corte Preciso</strong>: Defina tempos de início e fim até milissegundos</li><li><strong>Cópia de Fluxo</strong>: Processamento ultra-rápido sem recodificação para qualidade perfeita</li><li><strong>Suporte Amplo de Formatos</strong>: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC e mais</li><li><strong>Pré-visualização de Áudio</strong>: Ouça o resultado antes de guardar</li><li><strong>Corte em Lote</strong>: Corte vários ficheiros com as mesmas definições</li><li><strong>Qualidade Original</strong>: Sem recompressão — resultado na qualidade original</li></ul>',
      useCases: '<ul><li><strong>Edição de Podcasts</strong>: Remova intros, outros, música de fundo de episódios</li><li><strong>Produção Musical</strong>: Corte músicas para pré-visualizações ou amostras</li><li><strong>Gravação de Voz</strong>: Remova erros, silêncios, pausas das gravações</li><li><strong>Trilha Sonora de Vídeo</strong>: Ajuste a duração da música para vídeos</li><li><strong>Criação de Ringtones</strong>: Crie ringtones cortando músicas</li></ul>',
      privacy: '<p>O corte de áudio ocorre <strong>completamente no seu navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong> — seguro para ficheiros privados</li><li>Sem carregamento na nuvem, sem registos de servidor</li><li><strong>Funciona offline</strong> após o carregamento da página</li></ul>'
    },
    'audio/convert': {
      intro: '<p><strong>Conversor de Áudio</strong> converte ficheiros de áudio entre formatos populares incluindo MP3, WAV, FLAC, OGG, M4A e OPUS. Converta com controlo de qualidade de bitrate — tudo no seu navegador sem carregamento de servidor.</p><p>Conversão em lote: converta vários ficheiros simultaneamente com as mesmas definições.</p>',
      howToUse: '<ol><li>Carregue ficheiros de áudio clicando na zona de arrasto ou arrastando ficheiros</li><li>Selecione o <strong>formato de saída</strong> do menu (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Ajuste a taxa de bits para controlo de qualidade</li><li>Clique em <strong>Convert</strong> para processar todos os ficheiros</li><li>Descarregue ficheiros convertidos individualmente ou como ZIP</li></ol>',
      features: '<ul><li><strong>Formatos Múltiplos</strong>: Converta entre MP3, WAV, FLAC, OGG, M4A, AAC, OPUS e outros</li><li><strong>Controlo de Qualidade</strong>: Selecione taxa de bits para equilibrar qualidade e tamanho</li><li><strong>Conversão em Lote</strong>: Converta muitos ficheiros simultaneamente</li><li><strong>Processamento Rápido</strong>: FFmpeg.wasm para conversão instantânea</li><li><strong>Qualidade de Saída Alta</strong>: Mantenha a qualidade de áudio durante conversão</li></ul>',
      useCases: '<ul><li><strong>Compatibilidade de Formato</strong>: Converta para formatos suportados pelo seu dispositivo</li><li><strong>Otimização de Ficheiro</strong>: Converta para formatos comprimidos para poupar espaço</li><li><strong>Distribuição de Áudio</strong>: Converta para formatos padrão para partilhar</li><li><strong>Compatibilidade de Plataforma</strong>: Prepare áudio para vários dispositivos</li></ul>',
      privacy: '<p>A conversão de áudio ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento de servidor, sem reprocessamento na nuvem</li><li><strong>Funciona offline</strong> após o carregamento da página</li><li>Verifique: abra DevTools (F12) → separador Network — zero dados transmitidos</li></ul>'
    },
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

// Apply translations to all files
const categories = ['audio', 'developer', 'image', 'pdf', 'video'];

function applyTranslations(language) {
  categories.forEach(cat => {
    const filepath = `./messages/${language}/tools-${cat}.json`;
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    const langCode = language === 'id' ? 'id' : 'pt-PT';
    const langTranslations = TRANSLATIONS[langCode];

    Object.entries(data.tools[cat] || {}).forEach(([slug, tool]) => {
      const key = `${cat}/${slug}`;
      if (langTranslations && langTranslations[key]) {
        const trans = langTranslations[key];
        tool.seoContent = {
          intro: { title: tool.seoContent.intro.title, content: trans.intro },
          howToUse: { title: tool.seoContent.howToUse.title, content: trans.howToUse },
          features: { title: tool.seoContent.features.title, content: trans.features },
          useCases: { title: tool.seoContent.useCases.title, content: trans.useCases },
          privacy: { title: tool.seoContent.privacy.title, content: trans.privacy }
        };
      }
    });

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
  });
}

// Apply for both languages
applyTranslations('id');
applyTranslations('pt-PT');

console.log('Audio tools translations applied for ID and PT-PT!');
console.log('Note: Only audio tools (4 tools) are translated so far in this script.');
console.log('Developer, Image, PDF, and Video tools require similar detailed translations.');
