export interface WordCountResult {
  words: number;
  characters: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export function countWords(text: string): WordCountResult {
  if (!text.trim()) {
    return { words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0 };
  }

  const characters = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return { words, characters, sentences, paragraphs, readingTimeMinutes };
}
