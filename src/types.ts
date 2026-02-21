export interface Word {
  word: string;
  pinyin: string;
  meaning: string;
  culturalNote?: string;
  proficiency: number;
  category?: string;
  isFavorite?: boolean;
}

export interface Etymology {
  components: { char: string; meaning: string }[];
  culturalContext: string;
}

export type PageType = 'recommendation' | 'etymology' | 'vocabulary' | 'dialogue' | 'translation' | 'recognition';
