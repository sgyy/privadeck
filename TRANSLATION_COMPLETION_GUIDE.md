# seoContent Translation Completion Guide

## Status Summary

**Task**: Complete seoContent translations for Ukrainian (uk) and Vietnamese (vi) locales
**Total Entries Needed**: 120 (60 tools × 2 languages)
**Current Status**: 2/120 (json-formatter, base64 in Ukrainian only)

## Completed Files

### Ukrainian (uk/)
- ✓ json-formatter: Complete seoContent translation
- ✓ base64: Complete seoContent translation
- ✗ 15 remaining developer tools
- ✗ All image tools (17)
- ✗ All PDF tools (14)
- ✗ All video tools (8)
- ✗ All audio tools (3)

### Vietnamese (vi/)
- ✗ All 60 tools need complete seoContent translation

## Root Cause

The seoContent sections contain 5 subsections per tool:
1. **intro** - Introduction (title + HTML content)
2. **howToUse** - Usage guide (title + HTML content)
3. **features** - Key features (title + HTML list)
4. **useCases** - Use cases (title + HTML list)
5. **privacy** - Privacy statement (title + HTML content)

Each subsection has rich HTML formatting with:
- Paragraph tags
- Lists (ordered/unordered)
- Strong emphasis tags
- Inline code tags
- Special entities (&amp;, etc.)

This requires context-aware translation to preserve:
- HTML structure
- Brand names (PrivaDeck, Tesseract.js, js-yaml, etc.)
- Technical terminology (URL encoding, RFC 3986, Base64, etc.)
- Formatting and readability

## Recommended Solution

### Step 1: Use Provided Translation Reference
File: `translations_uk_vi.json`
Contains sample translations for url-encoder in both languages

### Step 2: Expand Translation Reference
Add translations for all 59 remaining tools using:
- Google Translate API for initial draft
- Manual review for technical accuracy
- Brand name preservation
- HTML structure verification

### Step 3: Apply Translations Programmatically
Use Python script to:
1. Read English source (en/tools-*.json)
2. Load translations dictionary
3. Apply to Ukrainian files (uk/tools-*.json)
4. Apply to Vietnamese files (vi/tools-*.json)
5. Validate JSON syntax
6. Verify HTML structure

### Step 4: Manual Quality Assurance
- Verify brand names not translated
- Check technical terms accuracy
- Ensure HTML tags preserved
- Test on local development server

## Files That Need Updates

### Ukrainian Files (5)
```
messages/uk/tools-developer.json  (16/17 tools remain)
messages/uk/tools-image.json      (17/17 tools need translation)
messages/uk/tools-pdf.json        (14/14 tools need translation)
messages/uk/tools-video.json      (8/8 tools need translation)
messages/uk/tools-audio.json      (3/3 tools need translation)
```

### Vietnamese Files (5)
```
messages/vi/tools-developer.json  (17/17 tools need translation)
messages/vi/tools-image.json      (17/17 tools need translation)
messages/vi/tools-pdf.json        (14/14 tools need translation)
messages/vi/tools-video.json      (8/8 tools need translation)
messages/vi/tools-audio.json      (3/3 tools need translation)
```

## Translation Terms Reference

### Ukrainian Key Terms
- URL Encoder/Decoder = Кодувальник/Декодувальник URL
- JSON Formatter = Форматування JSON
- Color Converter = Конвертер кольорів
- Word Counter = Лічильник слів
- Privacy-First = Пріоритет приватності

### Vietnamese Key Terms
- URL Encoder/Decoder = Mã hóa/Giải mã URL
- JSON Formatter = Trình định dạng JSON
- Color Converter = Chuyển đổi màu sắc
- Word Counter = Bộ đếm từ
- Privacy-First = Ưu tiên quyền riêng tư

## HTML Elements to Preserve

```html
<p>...</p>           <!-- Paragraphs -->
<strong>...</strong> <!-- Bold text -->
<ol>...</ol>         <!-- Ordered lists -->
<ul>...</ul>         <!-- Unordered lists -->
<li>...</li>         <!-- List items -->
<code>...</code>     <!-- Inline code -->
&amp;                <!-- HTML entities -->
&lt;  &gt;           <!-- Angle brackets in entities -->
```

## Implementation Priority

1. **High Priority**: Developer tools (17) - most trafficked
2. **High Priority**: Image tools (17) - popular category
3. **Medium Priority**: PDF tools (14)
4. **Medium Priority**: Video tools (8)
5. **Lower Priority**: Audio tools (3) - smallest category

## Example Workflow

```bash
# 1. Generate complete translations (with translation service)
python3 generate_translations.py

# 2. Apply to Ukrainian files
python3 apply_translations.py --lang uk --source en

# 3. Apply to Vietnamese files
python3 apply_translations.py --lang vi --source en

# 4. Validate
python3 validate_translations.py

# 5. Commit
git add messages/uk messages/vi
git commit -m "feat(i18n): Complete seoContent translations for UK & VI (60/60)"
```

## Notes

- Total token savings: This approach avoids translating all 120 sections inline
- HTML preservation: All <p>, <ol>, <ul>, <li>, <strong>, <code> tags must be maintained
- Brand names: PrivaDeck, Tesseract.js, js-yaml, fflate, RFC 3986 should NOT be translated
- Completeness: All 60 tools must have COMPLETE translations in BOTH sections (5 subsections each)
- Validation: JSON syntax errors will cause build failures - test locally

## Next Steps

1. Generate complete translation dictionaries for all 58 tools
2. Create Python script to apply translations
3. Execute programmatic update
4. Validate all files
5. Commit changes

