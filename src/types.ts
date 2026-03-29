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
  age: number;
  ethnicity: string;
  religion: string;
  ageCategory: AgeCategory;
  aptitudes: Aptitudes;
  skills: Skill[];
  quickReloadPoints: number;
  handedness: string;
  spentXP: number;
  totalXP: number;
  wealth: number;
  notes?: string;
  possessions?: string;
}
