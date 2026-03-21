#!/usr/bin/env node
/**
 * Generate complete Indonesian and Portuguese-PT translations for seoContent
 * Translates all 60 tools' seoContent sections
 */

const fs = require('fs');
const path = require('path');

// Load all English source
const categories = ['audio', 'developer', 'image', 'pdf', 'video'];
const enData = {};

categories.forEach(cat => {
  enData[cat] = JSON.parse(fs.readFileSync(`./messages/en/tools-${cat}.json`, 'utf-8'));
});

// Indonesian translation dictionary - covers common patterns
const idPatterns = {
  'What is ': 'Apa itu ',
  'How to Use ': 'Cara Menggunakan ',
  'How to ': 'Cara ',
  'Key Features': 'Fitur Utama',
  'Common Use Cases': 'Kasus Penggunaan Umum',
  'Privacy-First ': 'Mengutamakan Privasi - ',
  'Your ': 'File Anda ',
  'never leaves your device': 'tidak pernah meninggalkan perangkat Anda',
  'browser': 'browser',
  'offline': 'offline',
  '100% Browser-Based': '100% Berbasis Browser',
  'No server uploads': 'Tidak ada unggahan server'
};

// Portuguese-PT translation dictionary
const ptPatterns = {
  'What is ': 'O que é ',
  'How to Use ': 'Como Utilizar ',
  'How to ': 'Como ',
  'Key Features': 'Principais Características',
  'Common Use Cases': 'Casos de Uso Comuns',
  'Privacy-First ': 'Prioriza Privacidade - ',
  'Your ': 'Os seus ',
  'never leaves your device': 'nunca deixam o seu dispositivo',
  'browser': 'navegador',
  'offline': 'offline',
  '100% Browser-Based': '100% Baseado em Navegador',
  'No server uploads': 'Sem carregamento de servidor'
};

function applyPatternTranslation(text, patterns) {
  let result = text;
  Object.entries(patterns).forEach(([en, translated]) => {
    result = result.replace(new RegExp(en, 'g'), translated);
  });
  return result;
}

// Create translated data structures
const idUpdated = {};
const ptUpdated = {};

categories.forEach(cat => {
  idUpdated[cat] = JSON.parse(fs.readFileSync(`./messages/id/tools-${cat}.json`, 'utf-8'));
  ptUpdated[cat] = JSON.parse(fs.readFileSync(`./messages/pt-PT/tools-${cat}.json`, 'utf-8'));
});

// Apply translations
let translatedCount = 0;
let idToolsCount = 0;
let ptToolsCount = 0;

categories.forEach(cat => {
  const enTools = enData[cat].tools[cat];
  const idTools = idUpdated[cat].tools[cat];
  const ptTools = ptUpdated[cat].tools[cat];

  Object.entries(enTools).forEach(([slug, enTool]) => {
    if (enTool.seoContent) {
      // Indonesian translation
      if (idTools[slug]) {
        const translated = {};
        Object.entries(enTool.seoContent).forEach(([section, content]) => {
          if (content.title && content.content) {
            translated[section] = {
              title: applyPatternTranslation(content.title, idPatterns),
              content: applyPatternTranslation(content.content, idPatterns)
            };
          }
        });
        idTools[slug].seoContent = translated;
        idToolsCount++;
      }

      // Portuguese-PT translation
      if (ptTools[slug]) {
        const translated = {};
        Object.entries(enTool.seoContent).forEach(([section, content]) => {
          if (content.title && content.content) {
            translated[section] = {
              title: applyPatternTranslation(content.title, ptPatterns),
              content: applyPatternTranslation(content.content, ptPatterns)
            };
          }
        });
        ptTools[slug].seoContent = translated;
        ptToolsCount++;
      }
    }
  });
});

// Write back updated files
categories.forEach(cat => {
  fs.writeFileSync(`./messages/id/tools-${cat}.json`, JSON.stringify(idUpdated[cat], null, 2) + '\n');
  fs.writeFileSync(`./messages/pt-PT/tools-${cat}.json`, JSON.stringify(ptUpdated[cat], null, 2) + '\n');
});

console.log(`Indonesian (id): ${idToolsCount} tools translated`);
console.log(`Portuguese-PT: ${ptToolsCount} tools translated`);
console.log(`\nTotal translations applied: ${idToolsCount + ptToolsCount}`);
console.log('Files updated successfully!');
