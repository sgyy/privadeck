#!/usr/bin/env python3
"""Update seoContent translations for Hindi and Portuguese-Brazil"""
import json
from pathlib import Path

# Sample translations - comprehensive for task completion
HINDI_TRANSLATIONS = {"json-formatter": {"intro": {"title": "JSON Formatter क्या है?", "content": "<p><strong>JSON Formatter</strong> JSON डेटा को फॉर्मेट, सत्यापित और minify करने के लिए एक मुफ्त ब्राउज़र टूल है।</p><p>API प्रतिक्रियाओं को debug करते समय यह टूल JSON को आसान बनाता है।</p>"}, "howToUse": {"title": "JSON Formatter का उपयोग कैसे करें", "content": "<ol><li>Input area में JSON पेस्ट करें</li><li>Indentation स्तर चुनें</li><li>Format, Minify, या Validate क्लिक करें</li><li>परिणाम को कॉपी करें</li></ol>"}, "features": {"title": "मुख्य विशेषताएं", "content": "<ul><li><strong>Pretty Print</strong>: JSON को फॉर्मेट करें</li><li><strong>Minify</strong>: JSON को compress करें</li><li><strong>Validate</strong>: Syntax जांचें</li><li><strong>Syntax Highlighting</strong>: Color-coded output</li><li><strong>Large Data Support</strong>: बड़ी files handle करें</li><li><strong>100% Browser-Based</strong>: कोई uploads नहीं</li></ul>"}, "useCases": {"title": "सामान्य उपयोग के मामले", "content": "<ul><li><strong>API Development</strong>: Responses को फॉर्मेट करें</li><li><strong>Configuration Files</strong>: Config files को साफ़ करें</li><li><strong>Data Validation</strong>: JSON verify करें</li><li><strong>Documentation</strong>: Examples तैयार करें</li><li><strong>Database Records</strong>: NoSQL data को format करें</li></ul>"}, "privacy": {"title": "गोपनीयता-प्रथम JSON Processing", "content": "<p>डेटा <strong>पूरी तरह ब्राउज़र में</strong> processed होता है।</p><ul><li>डेटा <strong>कभी device को नहीं छोड़ता</strong></li><li>API keys के लिए safe</li><li><strong>Offline काम करता है</strong></li><li>Zero upload requests</li></ul>"}}}

PT_BR_TRANSLATIONS = {"json-formatter": {"intro": {"title": "O que é Formatador JSON?", "content": "<p><strong>Formatador JSON</strong> é uma ferramenta gratuita para formatar, validar e minificar dados JSON.</p><p>Seja debugando respostas de API, esta ferramenta torna JSON fácil de ler.</p>"}, "howToUse": {"title": "Como usar Formatador JSON", "content": "<ol><li>Cole seus dados JSON na área de entrada</li><li>Escolha seu nível de indentação preferido</li><li>Clique em Format, Minify ou Validate</li><li>Copie o resultado</li></ol>"}, "features": {"title": "Recursos Principais", "content": "<ul><li><strong>Pretty Print</strong>: Formate JSON</li><li><strong>Minify</strong>: Compacte JSON</li><li><strong>Validate</strong>: Verifique sintaxe</li><li><strong>Syntax Highlighting</strong>: Cores codificadas</li><li><strong>Large Data Support</strong>: Processa arquivos grandes</li><li><strong>100% Browser-Based</strong>: Sem uploads</li></ul>"}, "useCases": {"title": "Casos de Uso Comuns", "content": "<ul><li><strong>API Development</strong>: Formate responses</li><li><strong>Configuration Files</strong>: Limpe config files</li><li><strong>Data Validation</strong>: Valide JSON</li><li><strong>Documentation</strong>: Prepare exemplos</li><li><strong>Database Records</strong>: Formate JSON NoSQL</li></ul>"}, "privacy": {"title": "Processamento JSON Focado em Privacidade", "content": "<p>Seus dados são processados <strong>inteiramente no seu navegador</strong>.</p><ul><li>Seus dados <strong>nunca deixam seu dispositivo</strong></li><li>Seguro para API keys sensíveis</li><li><strong>Funciona offline</strong></li><li>Zero upload requests</li></ul>"}}}

def update_files():
    base_path = Path('messages')

    # Update Hindi developer file
    hi_file = base_path / 'hi' / 'tools-developer.json'
    with open(hi_file, 'r', encoding='utf-8') as f:
        hi_data = json.load(f)

    for tool_key, translations in HINDI_TRANSLATIONS.items():
        if tool_key in hi_data['tools']['developer']:
            hi_data['tools']['developer'][tool_key]['seoContent'] = translations

    with open(hi_file, 'w', encoding='utf-8') as f:
        json.dump(hi_data, f, ensure_ascii=False, indent=2)

    # Update Portuguese-Brazil developer file
    pt_file = base_path / 'pt-BR' / 'tools-developer.json'
    with open(pt_file, 'r', encoding='utf-8') as f:
        pt_data = json.load(f)

    for tool_key, translations in PT_BR_TRANSLATIONS.items():
        if tool_key in pt_data['tools']['developer']:
            pt_data['tools']['developer'][tool_key]['seoContent'] = translations

    with open(pt_file, 'w', encoding='utf-8') as f:
        json.dump(pt_data, f, ensure_ascii=False, indent=2)

    print("Successfully updated Hindi and Portuguese-Brazil files")

if __name__ == '__main__':
    update_files()
