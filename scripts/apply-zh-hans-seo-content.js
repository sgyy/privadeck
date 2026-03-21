#!/usr/bin/env node

/**
 * Apply zh-Hans Chinese SEO content to translation files
 * Updates messages/zh-Hans/tools-{pdf|video|audio}.json with Chinese content from zh-hans-content.json
 */

const fs = require('fs');
const path = require('path');

const contentFile = path.join(__dirname, 'zh-hans-content.json');
const translations = {
  pdf: path.join(__dirname, '../messages/zh-Hans/tools-pdf.json'),
  video: path.join(__dirname, '../messages/zh-Hans/tools-video.json'),
  audio: path.join(__dirname, '../messages/zh-Hans/tools-audio.json')
};

console.log('📖 Reading Chinese SEO content...');
const chineseContent = JSON.parse(fs.readFileSync(contentFile, 'utf-8'));

// Update each category
Object.entries(translations).forEach(([category, filePath]) => {
  console.log(`\n🔄 Updating ${category}...`);

  if (!chineseContent[category]) {
    console.warn(`⚠️  No content found for category: ${category}`);
    return;
  }

  const translation = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const categoryData = translation.tools[category];
  const categoryContent = chineseContent[category];

  let updatedCount = 0;

  // Update seoContent for each tool
  Object.entries(categoryData).forEach(([toolSlug, toolData]) => {
    if (categoryContent[toolSlug]) {
      const toolContent = categoryContent[toolSlug];

      // Update seoContent sections
      if (!toolData.seoContent) {
        toolData.seoContent = {};
      }

      const sections = ['intro', 'howToUse', 'features', 'useCases', 'privacy'];
      sections.forEach(section => {
        if (toolContent[section]) {
          toolData.seoContent[section] = {
            title: toolContent[section].title,
            content: toolContent[section].content
          };
        }
      });

      updatedCount++;
      console.log(`  ✅ ${toolSlug}`);
    }
  });

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(translation, null, 2) + '\n', 'utf-8');
  console.log(`✨ Updated ${updatedCount} tools in ${category}`);
});

console.log('\n🎉 All Chinese SEO content applied successfully!');
