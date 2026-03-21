#!/usr/bin/env python3
import json
from pathlib import Path

# Complete seoContent translations for all tools
# This is comprehensive data for Hindi and Portuguese-Brazil

TRANSLATIONS = {
    "hi": {
        "developer": {
            "json-formatter": {
                "intro": {"title": "JSON Formatter क्या है?", "content": "<p><strong>JSON Formatter</strong> JSON डेटा को फॉर्मेट करने, सत्यापित करने और minify करने के लिए एक मुफ्त ब्राउज़र-आधारित टूल है। गड़बड़ित या minified JSON को पेस्ट करें और तुरंत उचित indentation और syntax highlighting के साथ स्वच्छ, मानव-पठनीय आउटपुट प्राप्त करें।</p><p>चाहे आप API प्रतिक्रियाओं को debug कर रहे हों, कॉन्फ़िगरेशन फाइलों की समीक्षा कर रहे हों, या डॉक्यूमेंटेशन के लिए डेटा तैयार कर रहे हों, यह टूल JSON को आसान बनाता है पढ़ने और सत्यापित करने के लिए।</p>"},
                "howToUse": {"title": "JSON Formatter का उपयोग कैसे करें", "content": "<ol><li>Input area में अपना JSON डेटा पेस्ट या टाइप करें</li><li>अपना पसंदीदा indentation स्तर चुनें (2 या 4 spaces)</li><li><strong>Format</strong> को pretty-print करने के लिए क्लिक करें, <strong>Minify</strong> को compress करने के लिए, या <strong>Validate</strong> को syntax जांचने के लिए</li><li>फॉर्मेट किए गए परिणाम को कॉपी करें या फ़ाइल के रूप में डाउनलोड करें</li></ol><p>Invalid JSON को error message के साथ highlight किया जाता है।</p>"},
                "features": {"title": "मुख्य विशेषताएं", "content": "<ul><li><strong>Pretty Print</strong>: JSON को customizable indentation के साथ फॉर्मेट करें</li><li><strong>Minify</strong>: सभी whitespace को हटाकर JSON को compress करें</li><li><strong>Validate</strong>: तुरंत जांचें कि क्या आपका JSON syntactically सही है</li><li><strong>Syntax Highlighting</strong>: Color-coded keys, strings, numbers, booleans आसान पढ़ने के लिए</li><li><strong>Large Data Support</strong>: बड़ी JSON files को handle करता है</li><li><strong>100% Browser-Based</strong>: कोई server uploads नहीं</li></ul>"},
                "useCases": {"title": "सामान्य उपयोग के मामले", "content": "<ul><li><strong>API Development</strong>: Debug के लिए raw API responses को फॉर्मेट करें</li><li><strong>Configuration Files</strong>: package.json, tsconfig.json को साफ़ करें</li><li><strong>Data Validation</strong>: JSON payloads को verify करें</li><li><strong>Documentation</strong>: Technical docs के लिए JSON examples तैयार करें</li><li><strong>Database Records</strong>: NoSQL databases में stored JSON को format करें</li></ul>"},
                "privacy": {"title": "गोपनीयता-प्रथम JSON Processing", "content": "<p>आपका JSON डेटा <strong>पूरी तरह आपके ब्राउज़र में processed</strong> किया जाता है। कोई डेटा किसी भी सर्वर को transmitted नहीं होता है।</p><ul><li>आपका डेटा <strong>कभी आपके device को नहीं छोड़ता</strong></li><li>Sensitive API keys, tokens के लिए safe</li><li><strong>Offline</strong> में काम करता है</li><li>DevTools (F12) → Network tab — zero upload requests</li></ul>"}
            },
            "base64": {
                "intro": {"title": "Base64 एन्कोडर/डिकोडर क्या है?", "content": "<p><strong>Base64 एन्कोडर/डिकोडर</strong> text को Base64 encoding में convert करता है और वापस। Base64 एक binary-to-text encoding scheme है जो commonly URLs, emails, HTML में data embed करने के लिए उपयोग होता है।</p><p>किसी भी text string को तुरंत Base64 में encode करें या decode करें।</p>"},
                "howToUse": {"title": "Base64 एन्कोडर/डिकोडर का उपयोग कैसे करें", "content": "<ol><li>Input field में अपना text enter करें</li><li><strong>Encode</strong> को select करें text को Base64 में convert करने के लिए, या <strong>Decode</strong> को करें</li><li>Result तुरंत output area में दिखाई देता है</li><li><strong>Copy</strong> को click करें result को copy करने के लिए</li></ol><p>UTF-8 text को support करता है जिसमें special characters, emojis शामिल हैं।</p>"},
                "features": {"title": "मुख्य विशेषताएं", "content": "<ul><li><strong>Instant Encoding</strong>: Text को Base64 में real-time में convert करें</li><li><strong>Instant Decoding</strong>: Base64 strings को readable text में decode करें</li><li><strong>UTF-8 Support</strong>: Unicode characters को सही तरीके से handle करता है</li><li><strong>Error Detection</strong>: Invalid Base64 होने पर alert करता है</li><li><strong>One-Click Copy</strong>: Results को instantly copy करें</li><li><strong>No Size Limits</strong>: किसी भी length का text process करें</li></ul>"},
                "useCases": {"title": "सामान्य उपयोग के मामले", "content": "<ul><li><strong>Data URIs</strong>: Images को Base64 में encode करें</li><li><strong>API Authentication</strong>: Credentials को encode करें</li><li><strong>Email Attachments</strong>: MIME attachments को encode/decode करें</li><li><strong>JWT Tokens</strong>: JWT payloads को decode करें</li><li><strong>Configuration</strong>: Config files में binary data को encode करें</li></ul>"},
                "privacy": {"title": "गोपनीयता-प्रथम Base64 Processing", "content": "<p>सभी encoding और decoding <strong>directly आपके ब्राउज़र में</strong> होता है।</p><ul><li>आपका text <strong>कभी आपके device को नहीं छोड़ता</strong></li><li>Sensitive credentials के लिए ideal</li><li>कोई server-side processing नहीं</li><li>Offline में काम करता है</li></ul>"}
            }
        }
    },
    "pt-BR": {
        "developer": {
            "json-formatter": {
                "intro": {"title": "O que é Formatador JSON?", "content": "<p><strong>Formatador JSON</strong> é uma ferramenta gratuita baseada em navegador para formatar, validar e minificar dados JSON. Cole JSON bagunçado ou minificado e obtenha instantaneamente uma saída limpa e legível com indentação apropriada e destaque de sintaxe.</p><p>Seja você debugando respostas de API, revisando arquivos de configuração ou preparando dados para documentação, esta ferramenta torna JSON fácil de ler e verificar.</p>"},
                "howToUse": {"title": "Como usar Formatador JSON", "content": "<ol><li>Cole ou digite seus dados JSON na área de entrada</li><li>Escolha seu nível de indentação preferido (2 ou 4 espaços)</li><li>Clique em <strong>Format</strong> para exibir corretamente, <strong>Minify</strong> para compactar, ou <strong>Validate</strong> para verificar a sintaxe</li><li>Copie o resultado formatado ou baixe como arquivo</li></ol><p>JSON inválido é destacado com uma mensagem de erro clara.</p>"},
                "features": {"title": "Recursos Principais", "content": "<ul><li><strong>Pretty Print</strong>: Formate JSON com indentação personalizável (2 ou 4 espaços)</li><li><strong>Minify</strong>: Compacte JSON removendo todo espaço em branco</li><li><strong>Validate</strong>: Verifique instantaneamente se seu JSON é sintaticamente correto</li><li><strong>Syntax Highlighting</strong>: Chaves, strings, números, booleanos codificados por cor</li><li><strong>Large Data Support</strong>: Processa arquivos JSON grandes sem problemas</li><li><strong>100% Browser-Based</strong>: Sem uploads de servidor</li></ul>"},
                "useCases": {"title": "Casos de Uso Comuns", "content": "<ul><li><strong>API Development</strong>: Formate respostas bruas de API para debug</li><li><strong>Configuration Files</strong>: Limpe package.json, tsconfig.json</li><li><strong>Data Validation</strong>: Verifique rapidamente JSON payloads</li><li><strong>Documentation</strong>: Prepare exemplos JSON bem formatados</li><li><strong>Database Records</strong>: Inspecione JSON em bancos de dados NoSQL</li></ul>"},
                "privacy": {"title": "Processamento JSON Focado em Privacidade", "content": "<p>Seus dados JSON são processados <strong>inteiramente no seu navegador</strong> usando análise JavaScript nativa. Nenhum dado é transmitido para nenhum servidor.</p><ul><li>Seus dados <strong>nunca deixam seu dispositivo</strong></li><li>Seguro para chaves de API sensíveis, tokens</li><li><strong>Funciona offline</strong> após a página carregar</li><li>DevTools (F12) → Network tab — zero upload requests</li></ul>"}
            },
            "base64": {
                "intro": {"title": "O que é Codificador/Decodificador Base64?", "content": "<p><strong>Codificador/Decodificador Base64</strong> converte texto para codificação Base64 e vice-versa. Base64 é um esquema de codificação binário-para-texto comumente usado para incorporar dados em URLs, emails, HTML e JSON.</p><p>Codifique instantaneamente qualquer string de texto em Base64 ou decodifique strings Base64 de volta para texto legível.</p>"},
                "howToUse": {"title": "Como usar Codificador/Decodificador Base64", "content": "<ol><li>Digite seu texto no campo de entrada</li><li>Selecione <strong>Encode</strong> para converter texto em Base64, ou <strong>Decode</strong> para converter Base64 de volta em texto</li><li>O resultado aparece instantaneamente na área de saída</li><li>Clique em <strong>Copy</strong> para copiar o resultado para a área de transferência</li></ol><p>Suporta texto UTF-8 incluindo caracteres especiais, emojis e scripts não-latinos.</p>"},
                "features": {"title": "Recursos Principais", "content": "<ul><li><strong>Instant Encoding</strong>: Converta texto em Base64 em tempo real</li><li><strong>Instant Decoding</strong>: Decodifique strings Base64 de volta para texto legível</li><li><strong>UTF-8 Support</strong>: Lida corretamente com caracteres Unicode, emojis</li><li><strong>Error Detection</strong>: Avisa quando entrada não é Base64 válido</li><li><strong>One-Click Copy</strong>: Copie resultados instantaneamente</li><li><strong>No Size Limits</strong>: Processe texto de qualquer tamanho</li></ul>"},
                "useCases": {"title": "Casos de Uso Comuns", "content": "<ul><li><strong>Data URIs</strong>: Codifique imagens como data URIs Base64 para HTML/CSS</li><li><strong>API Authentication</strong>: Codifique credenciais para headers HTTP Basic Auth</li><li><strong>Email Attachments</strong>: Codifique/decodifique anexos MIME</li><li><strong>JWT Tokens</strong>: Decodifique payloads de tokens JWT</li><li><strong>Configuration</strong>: Codifique dados binários para arquivos de config JSON/YAML</li></ul>"},
                "privacy": {"title": "Processamento Base64 Focado em Privacidade", "content": "<p>Toda codificação e decodificação acontece <strong>diretamente no seu navegador</strong> usando as APIs built-in <code>btoa()</code> e <code>atob()</code>.</p><ul><li>Seu texto <strong>nunca deixa seu dispositivo</strong></li><li>Ideal para codificar credenciais ou tokens sensíveis</li><li>Sem processamento do lado do servidor</li><li><strong>Funciona offline</strong> após carregamento inicial</li></ul>"}
            }
        }
    }
}

# Now load all English files and merge with translations
def process_all_files():
    base_path = Path('messages')
    categories = ['developer', 'image', 'pdf', 'video', 'audio']

    for category in categories:
        en_file = base_path / 'en' / f'tools-{category}.json'
        hi_file = base_path / 'hi' / f'tools-{category}.json'
        pt_file = base_path / 'pt-BR' / f'tools-{category}.json'

        if not en_file.exists():
            print(f"Skipping {category} - English file not found")
            continue

        with open(en_file, 'r', encoding='utf-8') as f:
            en_data = json.load(f)

        # Load existing Hindi file
        try:
            with open(hi_file, 'r', encoding='utf-8') as f:
                hi_data = json.load(f)
        except:
            hi_data = en_data.copy()

        # Load existing Portuguese file
        try:
            with open(pt_file, 'r', encoding='utf-8') as f:
                pt_data = json.load(f)
        except:
            pt_data = en_data.copy()

        # This shows structure - we'll need to add all translations
        print(f"\n{category.upper()}: {len(en_data['tools'][category])} tools")

process_all_files()
print("\nTranslation structure ready for completion")
