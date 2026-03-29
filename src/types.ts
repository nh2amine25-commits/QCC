export type AgeCategory = 'Teenager' | 'Young Adult' | 'Adult' | 'Middle Age' | 'Old';

export interface AgeStats {
  aptitudePoints: number;
  xp: number;
  wealth: number;
}

export interface Aptitudes {
  vitality: number;
  control: number;
  intelligence: number;
  attractiveness: number;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Character {
  name: string;
  sex: string;
  ageCategory: AgeCategory;
  aptitudes: Aptitudes;
  skills: Skill[];
  quickReloadPoints: number;
  spentXP: number;
  totalXP: number;
  wealth: number;
}
