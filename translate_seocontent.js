const fs = require('fs');

// Hindi translations
const hiTranslations = {
  "json-formatter": {
    "intro": {
      "title": "JSON Formatter क्या है?",
      "content": "<p><strong>JSON Formatter</strong> JSON डेटा को फॉर्मेट करने, सत्यापित करने और minify करने के लिए एक मुफ्त ब्राउज़र-आधारित टूल है। गड़बड़ित या minified JSON को पेस्ट करें और तुरंत उचित indentation और syntax highlighting के साथ स्वच्छ, मानव-पठनीय आउटपुट प्राप्त करें।</p><p>चाहे आप API प्रतिक्रियाओं को debug कर रहे हों, कॉन्फ़िगरेशन फाइलों की समीक्षा कर रहे हों, या डॉक्यूमेंटेशन के लिए डेटा तैयार कर रहे हों, यह टूल JSON को आसान बनाता है पढ़ने और सत्यापित करने के लिए — सब कुछ आपके ब्राउज़र से बाहर निकले बिना।</p>"
    },
    "howToUse": {
      "title": "JSON Formatter का उपयोग कैसे करें",
      "content": "<ol><li>Input area में अपना JSON डेटा पेस्ट या टाइप करें</li><li>अपना पसंदीदा indentation स्तर चुनें (2 या 4 spaces)</li><li><strong>Format</strong> पर क्लिक करें pretty-print करने के लिए, <strong>Minify</strong> को compress करने के लिए, या <strong>Validate</strong> को syntax जांचने के लिए</li><li>फॉर्मेट किए गए परिणाम को कॉपी करें या फ़ाइल के रूप में डाउनलोड करें</li></ol><p>Invalid JSON को error message के साथ highlight किया जाता है जो बिल्कुल दिखाता है कि syntax issue कहां है।</p>"
    },
    "features": {
      "title": "मुख्य विशेषताएं",
      "content": "<ul><li><strong>Pretty Print</strong>: JSON को customizable indentation के साथ फॉर्मेट करें (2 या 4 spaces)</li><li><strong>Minify</strong>: सभी whitespace को हटाकर JSON को compress करें compact storage या transmission के लिए</li><li><strong>Validate</strong>: तुरंत जांचें कि क्या आपका JSON syntactically सही है detailed error reporting के साथ</li><li><strong>Syntax Highlighting</strong>: Color-coded keys, strings, numbers, booleans, और nulls आसान पढ़ने के लिए</li><li><strong>Large Data Support</strong>: बड़ी JSON files को performance issues के बिना handle करता है</li><li><strong>100% Browser-Based</strong>: कोई server uploads नहीं — आपका डेटा आपके device पर रहता है</li></ul>"
    },
    "useCases": {
      "title": "सामान्य उपयोग के मामले",
      "content": "<ul><li><strong>API Development</strong>: Debug और inspection के लिए raw API responses को फॉर्मेट करें</li><li><strong>Configuration Files</strong>: package.json, tsconfig.json, या अन्य config files को साफ़ करें</li><li><strong>Data Validation</strong>: APIs को भेजने से पहले JSON payloads को जल्दी से verify करें</li><li><strong>Documentation</strong>: Technical docs के लिए well-formatted JSON examples तैयार करें</li><li><strong>Database Records</strong>: NoSQL databases में stored JSON को inspect और format करें</li></ul>"
    },
    "privacy": {
      "title": "गोपनीयता-प्रथम JSON Processing",
      "content": "<p>आपका JSON डेटा <strong>पूरी तरह आपके ब्राउज़र में processed</strong> किया जाता है native JavaScript parsing का उपयोग करके। कोई डेटा किसी भी सर्वर को transmitted नहीं होता है।</p><ul><li>आपका डेटा <strong>कभी आपके device को नहीं छोड़ता</strong> — processing के दौरान zero network requests</li><li>Sensitive API keys, tokens, और configuration data के लिए safe</li><li><strong>Offline</strong> में page loads के बाद काम करता है</li><li>Verify करें: DevTools (F12) खोलें → Network tab और देखें — zero upload requests</li></ul>"
    }
  }
};

console.log(JSON.stringify(hiTranslations, null, 2));
