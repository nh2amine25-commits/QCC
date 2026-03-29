import { AgeCategory, AgeStats } from './types';

export const AGE_TABLE: Record<AgeCategory, AgeStats> = {
  'Teenager': { aptitudePoints: 22, xp: 6000, wealth: 750 },
  'Young Adult': { aptitudePoints: 18, xp: 12000, wealth: 750 },
  'Adult': { aptitudePoints: 16, xp: 18000, wealth: 1000 },
  'Middle Age': { aptitudePoints: 13, xp: 24000, wealth: 1250 },
  'Old': { aptitudePoints: 10, xp: 30000, wealth: 1500 },
};

export const INITIAL_APTITUDES = {
  vitality: 2,
  control: 2,
  intelligence: 2,
  attractiveness: 2,
};

export const MAX_APTITUDE = 10;
export const MAX_SKILL_LEVEL = 15;

export const XP_COSTS = {
  NEW_SKILL: 1000,
  ADVANCE_SKILL_5: 1000,
  QUICK_RELOAD: 1000,
};

export const STARTING_SKILLS = [
  { name: 'Language and Culture (X)', level: 5 },
];

export const COMMON_SKILLS = [
  "Artillery Operation",
  "Ambidexterity",
  "Academia(X)",
  "Deceive",
  "Athletics",
  "Archery",
  "Administration",
  "Hospitality",
  "Carry Weight",
  "Equestrian",
  "Agricultura (X)",
  "Intimidation",
  "Melee Weapons",
  "Helmsmanship",
  "Art (X)",
  "Leadership",
  "Swim",
  "Infiltrate",
  "Bureaucracy",
  "Malign",
  "Unarmed Combat",
  "Marksmanship",
  "Explosives",
  "Negotiate",
  "Finance",
  "Romance",
  "Seamanship (X)",
  "Forge Documents",
  "Socialize",
  "Sleight of Hand",
  "Gaming",
  "Performing Arts (X)",
  "Throwing",
  "Gunnery",
  "Trade (X)",
  "Language and Culture (X)",
  "Law (X Country)",
  "Medical",
  "Navigation",
  "Perception",
  "Piloting (X)",
  "Stratagem (X)",
  "Technical"
];

export const SEX_OPTIONS = ["Male", "Female", "Other"];

export const HISTORICAL_NAMES = {
  Male: [
    "Horace", "Arthur", "Leopold", "Sebastian", "Victor", "Frederick", "Charles", "Henry", "George", "William",
    "Maximilian", "Otto", "Gustav", "Hans", "Pierre", "Jean", "Louis", "Antoine", "Francis", "Edmund",
    "Napoleon", "Horatio", "Gebhard", "Michel", "Joachim", "Jean-Baptiste", "Nicolas", "Louis-Nicolas", "Andre"
  ],
  Female: [
    "Eleanor", "Victoria", "Elizabeth", "Catherine", "Isabella", "Adelaide", "Florence", "Beatrice", "Clara", "Martha",
    "Marie", "Josephine", "Louise", "Eugenie", "Charlotte", "Caroline", "Augusta", "Sophia", "Amelia", "Harriet",
    "Jane", "Mary", "Anne", "Sarah", "Emily", "Grace", "Alice", "Rose", "Lucy", "Emma"
  ],
  Other: [
    "Alex", "Jordan", "Francis", "Julian", "Robin", "Charlie", "Morgan", "Taylor", "Casey", "Sidney"
  ],
  last: [
    "Vernet", "Wellington", "Metternich", "Talleyrand", "Bonaparte", "Bismarck", "Cavour", "Gladstone", "Disraeli", "Palmerston",
    "von Clausewitz", "de Lafayette", "Hamilton", "Jefferson", "Franklin", "Washington", "Adams", "Madison", "Monroe", "Jackson",
    "Smith", "Bourbon", "Habsburg", "Romanov", "Hohenzollern", "Stuart", "Tudor", "Plantagenet", "Windsor", "Saxe-Coburg",
    "Ney", "Murat", "Bernadotte", "Soult", "Davout", "Massena", "Lannes", "Augereau", "Berthier", "Bessieres"
  ],
  titles: {
    Male: ["Captain", "Major", "Colonel", "General", "Lord", "Sir", "Baron", "Count", "Duke", "Marquis", "Doctor", "Professor", "Reverend", "Father", "Brother"],
    Female: ["Lady", "Baroness", "Countess", "Duchess", "Marchioness", "Doctor", "Professor", "Reverend", "Sister"],
    Other: ["Captain", "Major", "Colonel", "General", "Doctor", "Professor", "Reverend", "Scholar", "Officer"]
  }
};
