const fs = require('fs');
const path = require('path');

// Comprehensive translation mapping for seoContent
// Indonesian (id) and Portuguese-Portugal (pt-PT)

const translations = {
  id: {
    // Audio
    'trim': {
      intro: {
        title: 'Apa itu Audio Trimmer?',
        content: '<p><strong>Audio Trimmer</strong> memotong file audio dengan mengatur waktu mulai dan akhir yang presisi. Gunakan stream copy ketika mungkin untuk pemrosesan ultra-cepat tanpa penyandian ulang — sempurna untuk menghapus intro, outro, dan jeda podcast.</p><p>Dukungan batch: potong beberapa file dengan pengaturan yang sama secara bersamaan.</p>'
      },
      howToUse: {
        title: 'Cara Menggunakan Audio Trimmer',
        content: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Atur waktu <strong>mulai</strong> dan <strong>akhir</strong> menggunakan slider atau input numerik</li><li>Pratinjau audio yang dipotong</li><li>Klik <strong>Trim</strong> dan unduh file audio yang dipotong</li></ol><p>Untuk hasil terbaik, gunakan satuan waktu MM:SS:MS untuk presisi.</p>'
      },
      features: {
        title: 'Fitur Utama',
        content: '<ul><li><strong>Pemotongan Presisi</strong>: Atur waktu mulai dan akhir hingga milidetik</li><li><strong>Stream Copy</strong>: Proses ultra-cepat tanpa penyandian ulang untuk MP3, WAV, dan format lainnya</li><li><strong>Format Dukungan Luas</strong>: MP3, WAV, FLAC, OGG, M4A, OPUS, dan banyak format audio</li><li><strong>Pratinjau Real-Time</strong>: Dengarkan dan lihat preview visual sebelum memotong</li><li><strong>Batch Trim</strong>: Potong banyak file dengan pengaturan yang sama</li><li><strong>Kualitas Asli</strong>: Tidak ada rekompresi — output pada kualitas original</li></ul>'
      },
      useCases: {
        title: 'Kasus Penggunaan Umum',
        content: '<ul><li><strong>Podcast Editing</strong>: Hilangkan intro, outro, dan musik latar dari episode</li><li><strong>Music Production</strong>: Potong lagu untuk membuat preview atau sampel musik</li><li><strong>Voice Recording</strong>: Hapus kesalahan, keheningan, dan jeda dari rekaman suara</li><li><strong>Video Soundtrack</strong>: Sesuaikan durasi musik untuk video atau presentasi</li><li><strong>Ringtone Creation</strong>: Potong lagu menjadi segmen pendek untuk ringtone</li></ul>'
      },
      privacy: {
        title: 'Pemrosesan Audio yang Mengutamakan Privasi',
        content: '<p>Pemotongan audio terjadi <strong>sepenuhnya di browser Anda</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong> — aman untuk file pribadi dan sensitif</li><li>Tidak ada unggahan cloud, tidak ada log server</li><li>Berfungsi <strong>offline</strong> setelah halaman dimuat</li></ul>'
      }
    },
    'convert': {
      intro: {
        title: 'Apa itu Audio Converter?',
        content: '<p><strong>Audio Converter</strong> mengubah file audio antara format populer termasuk MP3, WAV, FLAC, OGG, M4A, dan OPUS. Konversi dengan kontrol kualitas bitrate — semua di browser Anda tanpa unggahan server.</p><p>Konversi batch: ubah beberapa file sekaligus dengan pengaturan yang sama.</p>'
      },
      howToUse: {
        title: 'Cara Menggunakan Audio Converter',
        content: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Pilih <strong>format output</strong> dari dropdown (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Sesuaikan bitrate untuk kontrol kualitas</li><li>Klik <strong>Convert</strong> untuk memproses semua file</li><li>Unduh file yang dikonversi individual atau sebagai ZIP</li></ol>'
      },
      features: {
        title: 'Fitur Utama',
        content: '<ul><li><strong>Format Ganda</strong>: Konversi antara MP3, WAV, FLAC, OGG, M4A, AAC, OPUS, dan format audio lainnya</li><li><strong>Kontrol Kualitas</strong>: Pilih bitrate untuk menyeimbangkan kualitas dan ukuran file</li><li><strong>Konversi Batch</strong>: Ubah banyak file dengan pengaturan yang sama secara bersamaan</li><li><strong>Pemrosesan Cepat</strong>: FFmpeg.wasm untuk konversi instan</li><li><strong>Kualitas Output Tinggi</strong>: Jaga kualitas audio selama konversi</li></ul>'
      },
      useCases: {
        title: 'Kasus Penggunaan Umum',
        content: '<ul><li><strong>Kompatibilitas Format</strong>: Konversi ke format yang didukung oleh perangkat atau aplikasi Anda</li><li><strong>Optimasi File</strong>: Konversi ke format terkompresi seperti MP3 untuk menghemat ruang</li><li><strong>Distribusi Audio</strong>: Konversi ke format standar untuk berbagi dengan pengguna lain</li><li><strong>Platform Compatibility</strong>: Siapkan audio untuk berbagai perangkat dan sistem operasi</li></ul>'
      },
      privacy: {
        title: 'Pemrosesan Audio yang Mengutamakan Privasi',
        content: '<p>Konversi audio terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan server, tanpa kompresi ulang di cloud</li><li>Berfungsi <strong>offline</strong> setelah halaman dimuat</li><li>Verifikasi: buka DevTools (F12) → tab Network — zero data ditransmisikan</li></ul>'
      }
    },
    'extract': {
      intro: {
        title: 'Apa itu Audio Extractor?',
        content: '<p><strong>Audio Extractor</strong> mengekstrak audio dari file video dan mengonversi ke format audio murni seperti MP3, WAV, FLAC, atau OGG. Sempurna untuk mengambil soundtrack dari video, membuat musik dari file multimedia, atau mengonversi format audio yang jarang digunakan.</p><p>Batch extract dari beberapa file video sekaligus.</p>'
      },
      howToUse: {
        title: 'Cara Menggunakan Audio Extractor',
        content: '<ol><li>Unggah file video dengan mengklik dropzone atau menyeret file</li><li>Pilih <strong>format output</strong> untuk audio (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Sesuaikan bitrate sesuai kebutuhan kualitas</li><li>Klik <strong>Extract</strong> untuk memproses video</li><li>Unduh file audio yang diekstrak</li></ol><p>Mendukung video formats: MP4, MKV, WebM, AVI, MOV, FLV, dan banyak lagi.</p>'
      },
      features: {
        title: 'Fitur Utama',
        content: '<ul><li><strong>Format Video Luas</strong>: Ekstrak dari MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP</li><li><strong>Format Audio Beragam</strong>: Output ke MP3, WAV, FLAC, OGG, M4A, AAC, OPUS</li><li><strong>Kontrol Kualitas</strong>: Atur bitrate untuk optimasi ukuran file dan kualitas</li><li><strong>Batch Processing</strong>: Ekstrak audio dari banyak video sekaligus</li><li><strong>Kualitas Tinggi</strong>: Pertahankan kualitas audio asli selama ekstraksi</li><li><strong>Pemrosesan Cepat</strong>: FFmpeg.wasm untuk hasil instan</li></ul>'
      },
      useCases: {
        title: 'Kasus Penggunaan Umum',
        content: '<ul><li><strong>Soundtrack Extraction</strong>: Ambil musik dari film, acara TV, atau video YouTube</li><li><strong>Audio Format Conversion</strong>: Konversi file audio dalam format video ke format audio murni</li><li><strong>Music Library</strong>: Bangun koleksi musik dari video favorit Anda</li><li><strong>Podcast Creation</strong>: Ekstrak narasi dari video untuk podcast audio</li><li><strong>File Recovery</strong>: Pulihkan audio dari file video yang rusak</li></ul>'
      },
      privacy: {
        title: 'Pemrosesan Audio yang Mengutamakan Privasi',
        content: '<p>Ekstraksi audio terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File video <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan cloud, tanpa pemrosesan server</li><li>Berfungsi <strong>offline</strong> setelah halaman dimuat</li><li>Aman untuk file pribadi dan konten berhak cipta untuk penggunaan pribadi</li></ul>'
      }
    },
    'volume': {
      intro: {
        title: 'Apa itu Audio Volume Adjuster?',
        content: '<p><strong>Audio Volume Adjuster</strong> mengubah tingkat volume file audio dengan presisi, dari peremping hingga penguatan. Tingkatkan audio yang terlalu hening, turunkan musik yang terlalu keras, atau normalisasi volume lintas file audio — semua di browser.</p><p>Atur volume dalam dB atau persentase untuk kontrol penuh.</p>'
      },
      howToUse: {
        title: 'Cara Menggunakan Audio Volume Adjuster',
        content: '<ol><li>Unggah file audio dengan mengklik dropzone atau menyeret file</li><li>Sesuaikan slider <strong>volume</strong> atau masukkan nilai dB</li><li>Dengarkan pratinjau untuk memeriksa tingkat volume baru</li><li>Klik <strong>Adjust Volume</strong> untuk memproses file</li><li>Unduh file audio dengan volume yang telah disesuaikan</li></ol><p>Range penyesuaian: -50dB (diamkan) hingga +20dB (penguatan maksimal).</p>'
      },
      features: {
        title: 'Fitur Utama',
        content: '<ul><li><strong>Penyesuaian Presisi</strong>: Ubah volume dalam satuan dB atau persentase</li><li><strong>Format Audio Luas</strong>: Dukungan MP3, WAV, FLAC, OGG, M4A, OPUS, AAC</li><li><strong>Pratinjau Audio</strong>: Dengarkan perubahan volume sebelum menyimpan</li><li><strong>Batch Adjustment</strong>: Sesuaikan volume banyak file dengan pengaturan yang sama</li><li><strong>Normalisasi Volume</strong>: Terapkan ke berbagai file untuk konsistensi</li><li><strong>Kualitas Original</strong>: Output pada kualitas asli tanpa penyandian ulang</li></ul>'
      },
      useCases: {
        title: 'Kasus Penggunaan Umum',
        content: '<ul><li><strong>Podcast Normalization</strong>: Seimbangkan volume lintas episode podcast yang berbeda</li><li><strong>Music Production</strong>: Sesuaikan level track untuk mixing</li><li><strong>Audio Repair</strong>: Perbaiki rekaman yang terlalu hening atau terlalu keras</li><li><strong>Content Creation</strong>: Standarkan volume untuk konten video atau streaming</li><li><strong>Playback Optimization</strong>: Optimasi audio untuk kepuasan pendengaran</li></ul>'
      },
      privacy: {
        title: 'Pemrosesan Audio yang Mengutamakan Privasi',
        content: '<p>Penyesuaian volume terjadi <strong>sepenuhnya di browser</strong> menggunakan FFmpeg.wasm.</p><ul><li>File audio <strong>tidak pernah meninggalkan perangkat</strong></li><li>Tidak ada unggahan server, tanpa pemrosesan cloud</li><li>Berfungsi <strong>offline</strong> setelah halaman dimuat</li></ul>'
      }
    }
  },
  'pt-PT': {
    'trim': {
      intro: {
        title: 'O que é Audio Trimmer?',
        content: '<p><strong>Audio Trimmer</strong> corta ficheiros de áudio definindo tempos de início e fim precisos. Utilize cópia de fluxo quando possível para processamento ultra-rápido sem recodificação — perfeito para remover intros, outros e pausas de podcasts.</p><p>Suporte em lote: corte vários ficheiros com as mesmas definições simultaneamente.</p>'
      },
      howToUse: {
        title: 'Como Utilizar Audio Trimmer',
        content: '<ol><li>Carregue um ficheiro de áudio clicando na zona de arrasto ou arrastando o ficheiro</li><li>Defina os tempos de <strong>início</strong> e <strong>fim</strong> utilizando sliders ou entrada numérica</li><li>Pré-visualize o áudio cortado</li><li>Clique em <strong>Trim</strong> e descarregue o ficheiro de áudio cortado</li></ol><p>Para melhores resultados, utilize unidades de tempo MM:SS:MS para precisão.</p>'
      },
      features: {
        title: 'Principais Características',
        content: '<ul><li><strong>Corte Preciso</strong>: Defina tempos de início e fim até milissegundos</li><li><strong>Cópia de Fluxo</strong>: Processamento ultra-rápido sem recodificação para MP3, WAV e outros formatos</li><li><strong>Suporte Amplo de Formatos</strong>: MP3, WAV, FLAC, OGG, M4A, OPUS e muitos formatos de áudio</li><li><strong>Pré-visualização em Tempo Real</strong>: Ouça e veja pré-visualização visual antes de cortar</li><li><strong>Corte em Lote</strong>: Corte vários ficheiros com as mesmas definições</li><li><strong>Qualidade Original</strong>: Sem recompressão — resultado na qualidade original</li></ul>'
      },
      useCases: {
        title: 'Casos de Uso Comuns',
        content: '<ul><li><strong>Edição de Podcasts</strong>: Remova intros, outros e música de fundo de episódios</li><li><strong>Produção Musical</strong>: Corte músicas para criar pré-visualizações ou amostras</li><li><strong>Gravação de Voz</strong>: Remova erros, silêncio e pausas de gravações de voz</li><li><strong>Trilha Sonora de Vídeo</strong>: Ajuste a duração da música para vídeos ou apresentações</li><li><strong>Criação de Ringtones</strong>: Corte músicas em segmentos curtos para ringtones</li></ul>'
      },
      privacy: {
        title: 'Processamento de Áudio que Prioriza Privacidade',
        content: '<p>O corte de áudio ocorre <strong>completamente no seu navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os seus ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong> — seguro para ficheiros privados e sensíveis</li><li>Sem carregamento na nuvem, sem registos de servidor</li><li><strong>Funciona offline</strong> após o carregamento da página</li></ul>'
      }
    },
    'convert': {
      intro: {
        title: 'O que é Audio Converter?',
        content: '<p><strong>Audio Converter</strong> converte ficheiros de áudio entre formatos populares incluindo MP3, WAV, FLAC, OGG, M4A e OPUS. Converta com controlo de qualidade de bitrate — tudo no seu navegador sem carregamento de servidor.</p><p>Conversão em lote: converta vários ficheiros simultaneamente com as mesmas definições.</p>'
      },
      howToUse: {
        title: 'Como Utilizar Audio Converter',
        content: '<ol><li>Carregue ficheiros de áudio clicando na zona de arrasto ou arrastando ficheiros</li><li>Selecione o <strong>formato de saída</strong> do menu (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Ajuste a taxa de bits para controlo de qualidade</li><li>Clique em <strong>Convert</strong> para processar todos os ficheiros</li><li>Descarregue ficheiros convertidos individualmente ou como ZIP</li></ol>'
      },
      features: {
        title: 'Principais Características',
        content: '<ul><li><strong>Formatos Múltiplos</strong>: Converta entre MP3, WAV, FLAC, OGG, M4A, AAC, OPUS e outros formatos de áudio</li><li><strong>Controlo de Qualidade</strong>: Selecione taxa de bits para equilibrar qualidade e tamanho de ficheiro</li><li><strong>Conversão em Lote</strong>: Converta muitos ficheiros com as mesmas definições simultaneamente</li><li><strong>Processamento Rápido</strong>: FFmpeg.wasm para conversão instantânea</li><li><strong>Qualidade de Saída Alta</strong>: Mantenha a qualidade de áudio durante a conversão</li></ul>'
      },
      useCases: {
        title: 'Casos de Uso Comuns',
        content: '<ul><li><strong>Compatibilidade de Formato</strong>: Converta para formatos suportados pelo seu dispositivo ou aplicação</li><li><strong>Otimização de Ficheiro</strong>: Converta para formatos comprimidos como MP3 para poupar espaço</li><li><strong>Distribuição de Áudio</strong>: Converta para formatos padrão para compartilhar com outros utilizadores</li><li><strong>Compatibilidade de Plataforma</strong>: Prepare áudio para vários dispositivos e sistemas operativos</li></ul>'
      },
      privacy: {
        title: 'Processamento de Áudio que Prioriza Privacidade',
        content: '<p>A conversão de áudio ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento de servidor, sem recompressão na nuvem</li><li><strong>Funciona offline</strong> após o carregamento da página</li><li>Verifique: abra DevTools (F12) → separador Network — zero dados transmitidos</li></ul>'
      }
    },
    'extract': {
      intro: {
        title: 'O que é Audio Extractor?',
        content: '<p><strong>Audio Extractor</strong> extrai áudio de ficheiros de vídeo e converte para formato de áudio puro como MP3, WAV, FLAC ou OGG. Perfeito para extrair trilhas sonoras de vídeos, criar música a partir de ficheiros multimédia ou converter formatos de áudio pouco comuns.</p><p>Extração em lote de vários ficheiros de vídeo simultaneamente.</p>'
      },
      howToUse: {
        title: 'Como Utilizar Audio Extractor',
        content: '<ol><li>Carregue ficheiro de vídeo clicando na zona de arrasto ou arrastando o ficheiro</li><li>Selecione o <strong>formato de saída</strong> para áudio (MP3, WAV, FLAC, OGG, M4A, OPUS)</li><li>Ajuste a taxa de bits conforme necessário para qualidade</li><li>Clique em <strong>Extract</strong> para processar o vídeo</li><li>Descarregue o ficheiro de áudio extraído</li></ol><p>Suporta formatos de vídeo: MP4, MKV, WebM, AVI, MOV, FLV e muitos mais.</p>'
      },
      features: {
        title: 'Principais Características',
        content: '<ul><li><strong>Suporte Amplo de Vídeo</strong>: Extraia de MP4, MKV, WebM, AVI, MOV, FLV, WMV, 3GP</li><li><strong>Formatos de Áudio Diversos</strong>: Saída para MP3, WAV, FLAC, OGG, M4A, AAC, OPUS</li><li><strong>Controlo de Qualidade</strong>: Ajuste a taxa de bits para otimizar tamanho de ficheiro e qualidade</li><li><strong>Processamento em Lote</strong>: Extraia áudio de muitos vídeos simultaneamente</li><li><strong>Qualidade Alta</strong>: Mantenha a qualidade de áudio original durante extração</li><li><strong>Processamento Rápido</strong>: FFmpeg.wasm para resultados instantâneos</li></ul>'
      },
      useCases: {
        title: 'Casos de Uso Comuns',
        content: '<ul><li><strong>Extração de Trilha Sonora</strong>: Extraia música de filmes, programas de TV ou vídeos do YouTube</li><li><strong>Conversão de Formato de Áudio</strong>: Converta ficheiros de áudio em formato de vídeo para formato de áudio puro</li><li><strong>Biblioteca de Música</strong>: Crie uma colecção de música a partir de vídeos favoritos</li><li><strong>Criação de Podcasts</strong>: Extraia narração de vídeos para podcasts de áudio</li><li><strong>Recuperação de Ficheiros</strong>: Recupere áudio de ficheiros de vídeo corrompidos</li></ul>'
      },
      privacy: {
        title: 'Processamento de Áudio que Prioriza Privacidade',
        content: '<p>A extração de áudio ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de vídeo <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento na nuvem, sem processamento de servidor</li><li><strong>Funciona offline</strong> após o carregamento da página</li><li>Seguro para ficheiros privados e conteúdo protegido por direitos autorais para uso pessoal</li></ul>'
      }
    },
    'volume': {
      intro: {
        title: 'O que é Audio Volume Adjuster?',
        content: '<p><strong>Audio Volume Adjuster</strong> modifica o nível de volume de ficheiros de áudio com precisão, desde enfraquecimento até amplificação. Aumente áudio muito fraco, diminua música muito alta ou normalize o volume entre ficheiros de áudio — tudo no seu navegador.</p><p>Ajuste o volume em dB ou percentagem para controlo total.</p>'
      },
      howToUse: {
        title: 'Como Utilizar Audio Volume Adjuster',
        content: '<ol><li>Carregue ficheiro de áudio clicando na zona de arrasto ou arrastando o ficheiro</li><li>Ajuste o slider de <strong>volume</strong> ou introduza valor em dB</li><li>Ouça a pré-visualização para verificar o novo nível de volume</li><li>Clique em <strong>Adjust Volume</strong> para processar o ficheiro</li><li>Descarregue o ficheiro de áudio com volume ajustado</li></ol><p>Intervalo de ajuste: -50dB (silenciar) até +20dB (amplificação máxima).</p>'
      },
      features: {
        title: 'Principais Características',
        content: '<ul><li><strong>Ajuste Preciso</strong>: Modifique o volume em unidades dB ou percentagem</li><li><strong>Suporte Amplo de Áudio</strong>: Suporta MP3, WAV, FLAC, OGG, M4A, OPUS, AAC</li><li><strong>Pré-visualização de Áudio</strong>: Ouça mudanças de volume antes de guardar</li><li><strong>Ajuste em Lote</strong>: Ajuste o volume de muitos ficheiros com as mesmas definições</li><li><strong>Normalização de Volume</strong>: Aplique entre ficheiros para consistência</li><li><strong>Qualidade Original</strong>: Saída na qualidade original sem recodificação</li></ul>'
      },
      useCases: {
        title: 'Casos de Uso Comuns',
        content: '<ul><li><strong>Normalização de Podcasts</strong>: Equilibre o volume entre episódios de podcasts diferentes</li><li><strong>Produção Musical</strong>: Ajuste níveis de faixa para mixing</li><li><strong>Reparação de Áudio</strong>: Corrija gravações demasiado fracas ou demasiado altas</li><li><strong>Criação de Conteúdo</strong>: Standardize volume para conteúdo de vídeo ou streaming</li><li><strong>Otimização de Reprodução</strong>: Otimize áudio para satisfação de audição</li></ul>'
      },
      privacy: {
        title: 'Processamento de Áudio que Prioriza Privacidade',
        content: '<p>O ajuste de volume ocorre <strong>completamente no navegador</strong> utilizando FFmpeg.wasm.</p><ul><li>Os ficheiros de áudio <strong>nunca deixam o seu dispositivo</strong></li><li>Sem carregamento de servidor, sem processamento na nuvem</li><li><strong>Funciona offline</strong> após o carregamento da página</li></ul>'
      }
    }
  }
};

console.log(JSON.stringify(translations, null, 2));
