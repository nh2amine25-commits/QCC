import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  VerticalAlign,
  HeadingLevel,
  ShadingType
} from 'docx';
import { 
  User, 
  Shield, 
  Scroll, 
  Target, 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Minus, 
  RotateCcw,
  Coins,
  BookOpen,
  Sword,
  Dices,
  Sparkles,
  FileText
} from 'lucide-react';
import { AGE_TABLE, INITIAL_APTITUDES, MAX_APTITUDE, MAX_SKILL_LEVEL, XP_COSTS, STARTING_SKILLS, COMMON_SKILLS, HISTORICAL_NAMES, SEX_OPTIONS, ETHNICITY_OPTIONS, RELIGION_OPTIONS, HANDEDNESS_OPTIONS, ALIGNMENT_OPTIONS } from './constants';
import { AgeCategory, Character, Skill } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [step, setStep] = useState(0);
  const dossierRef = useRef<HTMLDivElement>(null);
  const [char, setChar] = useState<Character>({
    name: '',
    sex: 'Male',
    age: 25,
    ethnicity: 'English',
    religion: 'Orthodox',
    ageCategory: 'Young Adult',
    aptitudes: { ...INITIAL_APTITUDES },
    skills: [...STARTING_SKILLS],
    quickReloadPoints: 0,
    handedness: 'Right',
    spentXP: 0,
    totalXP: AGE_TABLE['Young Adult'].xp,
    wealth: AGE_TABLE['Young Adult'].wealth,
    notes: '',
    possessions: '',
  });

  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillSelection, setNewSkillSelection] = useState({ name: '', level: 0 });

  const generateRandomName = (sex?: string) => {
    const chosenSex = sex || SEX_OPTIONS[Math.floor(Math.random() * SEX_OPTIONS.length)];
    const firstNames = HISTORICAL_NAMES[chosenSex as keyof typeof HISTORICAL_NAMES] as string[];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = HISTORICAL_NAMES.last[Math.floor(Math.random() * HISTORICAL_NAMES.last.length)];
    
    const titleOptions = HISTORICAL_NAMES.titles[chosenSex as keyof typeof HISTORICAL_NAMES.titles];
    const title = Math.random() > 0.6 ? titleOptions[Math.floor(Math.random() * titleOptions.length)] + " " : "";
    
    return { name: `${title}${first} ${last}`, sex: chosenSex };
  };

  const handleRandomName = () => {
    const { name, sex } = generateRandomName();
    setChar(prev => ({ 
      ...prev, 
      name, 
      sex,
      ethnicity: ETHNICITY_OPTIONS[Math.floor(Math.random() * ETHNICITY_OPTIONS.length)],
      religion: RELIGION_OPTIONS[Math.floor(Math.random() * RELIGION_OPTIONS.length)],
      handedness: HANDEDNESS_OPTIONS[Math.floor(Math.random() * HANDEDNESS_OPTIONS.length)],
      age: Math.floor(Math.random() * 20) + 18
    }));
  };

  const generateFullCharacter = () => {
    const ages = Object.keys(AGE_TABLE) as AgeCategory[];
    const randomAgeCat = ages[Math.floor(Math.random() * ages.length)];
    const ageStats = AGE_TABLE[randomAgeCat];
    const { name, sex } = generateRandomName();
    
    // Randomize Aptitudes
    let apts = { ...INITIAL_APTITUDES };
    let remainingApts = ageStats.aptitudePoints;
    const keys = Object.keys(apts) as (keyof typeof INITIAL_APTITUDES)[];
    
    while (remainingApts > 0) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      if (apts[key] < MAX_APTITUDE) {
        apts[key]++;
        remainingApts--;
      }
      if (keys.every(k => apts[k] >= MAX_APTITUDE)) break;
    }

    // Randomize XP
    let spent = 0;
    let skills: Skill[] = [...STARTING_SKILLS];
    let reloads = 0;
    let remainingXP = ageStats.xp;

    // Try to buy some skills
    const numSkills = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numSkills; i++) {
      if (remainingXP >= XP_COSTS.NEW_SKILL) {
        const skillName = COMMON_SKILLS[Math.floor(Math.random() * COMMON_SKILLS.length)];
        if (!skills.find(s => s.name === skillName)) {
          skills.push({ name: skillName, level: 0 });
          remainingXP -= XP_COSTS.NEW_SKILL;
          spent += XP_COSTS.NEW_SKILL;
        }
      }
    }

    // Advance skills
    while (remainingXP >= XP_COSTS.ADVANCE_SKILL_5) {
      const skillIdx = Math.floor(Math.random() * skills.length);
      if (skills[skillIdx].level < MAX_SKILL_LEVEL) {
        skills[skillIdx].level += 5;
        remainingXP -= XP_COSTS.ADVANCE_SKILL_5;
        spent += XP_COSTS.ADVANCE_SKILL_5;
      } else {
        // Try to buy a reload point if skills are maxed
        if (reloads < 3 && remainingXP >= XP_COSTS.QUICK_RELOAD) {
          reloads++;
          remainingXP -= XP_COSTS.QUICK_RELOAD;
          spent += XP_COSTS.QUICK_RELOAD;
        } else {
          break; 
        }
      }
    }

    setChar({
      name,
      sex,
      age: Math.floor(Math.random() * 20) + 18,
      ethnicity: ETHNICITY_OPTIONS[Math.floor(Math.random() * ETHNICITY_OPTIONS.length)],
      religion: RELIGION_OPTIONS[Math.floor(Math.random() * RELIGION_OPTIONS.length)],
      ageCategory: randomAgeCat,
      aptitudes: apts,
      skills: skills,
      quickReloadPoints: reloads,
      handedness: HANDEDNESS_OPTIONS[Math.floor(Math.random() * HANDEDNESS_OPTIONS.length)],
      spentXP: spent,
      totalXP: ageStats.xp,
      wealth: ageStats.wealth
    });
    setStep(3); 
  };

  const currentAgeStats = AGE_TABLE[char.ageCategory];

  const remainingAptitudePoints = useMemo(() => {
    const values = Object.values(char.aptitudes) as number[];
    const spent = values.reduce((a, b) => a + b, 0) - (Object.keys(INITIAL_APTITUDES).length * 2);
    return currentAgeStats.aptitudePoints - spent;
  }, [char.aptitudes, char.ageCategory, currentAgeStats.aptitudePoints]);

  const remainingXP = char.totalXP - char.spentXP;

  const handleAgeSelect = (age: AgeCategory) => {
    setChar(prev => ({
      ...prev,
      ageCategory: age,
      totalXP: AGE_TABLE[age].xp,
      wealth: AGE_TABLE[age].wealth,
      aptitudes: { ...INITIAL_APTITUDES },
      spentXP: 0,
      skills: [...STARTING_SKILLS],
      quickReloadPoints: 0
    }));
  };

  const updateAptitude = (key: keyof typeof INITIAL_APTITUDES, delta: number) => {
    const newVal = char.aptitudes[key] + delta;
    if (newVal < 2 || newVal > MAX_APTITUDE) return;
    if (delta > 0 && remainingAptitudePoints <= 0) return;

    setChar(prev => ({
      ...prev,
      aptitudes: { ...prev.aptitudes, [key]: newVal }
    }));
  };

  const toggleSkill = (skillName: string) => {
    const existingIdx = char.skills.findIndex(s => s.name === skillName);
    
    if (existingIdx >= 0) {
      // Remove skill and refund everything
      const skill = char.skills[existingIdx];
      const refund = XP_COSTS.NEW_SKILL + (skill.level / 5) * XP_COSTS.ADVANCE_SKILL_5;
      
      setChar(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== existingIdx),
        spentXP: prev.spentXP - refund
      }));
    } else {
      // Add skill
      if (remainingXP < XP_COSTS.NEW_SKILL) return;
      setChar(prev => ({
        ...prev,
        skills: [...prev.skills, { name: skillName, level: 0 }],
        spentXP: prev.spentXP + XP_COSTS.NEW_SKILL
      }));
    }
  };

  const advanceSkill = (index: number) => {
    const skill = char.skills[index];
    if (skill.level >= MAX_SKILL_LEVEL) return;
    if (remainingXP < XP_COSTS.ADVANCE_SKILL_5) return;

    const newSkills = [...char.skills];
    newSkills[index].level = Math.min(MAX_SKILL_LEVEL, skill.level + 5);
    setChar(prev => ({
      ...prev,
      skills: newSkills,
      spentXP: prev.spentXP + XP_COSTS.ADVANCE_SKILL_5
    }));
  };

  const decreaseSkill = (index: number) => {
    const skill = char.skills[index];
    if (skill.level <= 0) return;

    const newSkills = [...char.skills];
    newSkills[index].level = Math.max(0, skill.level - 5);
    setChar(prev => ({
      ...prev,
      skills: newSkills,
      spentXP: prev.spentXP - XP_COSTS.ADVANCE_SKILL_5
    }));
  };

  const addReloadPoint = () => {
    if (char.quickReloadPoints >= 3) return;
    if (remainingXP < XP_COSTS.QUICK_RELOAD) return;
    setChar(prev => ({
      ...prev,
      quickReloadPoints: prev.quickReloadPoints + 1,
      spentXP: prev.spentXP + XP_COSTS.QUICK_RELOAD
    }));
  };

  const removeReloadPoint = () => {
    if (char.quickReloadPoints <= 0) return;
    setChar(prev => ({
      ...prev,
      quickReloadPoints: prev.quickReloadPoints - 1,
      spentXP: prev.spentXP - XP_COSTS.QUICK_RELOAD
    }));
  };

  const resetXP = () => {
    setChar(prev => ({
      ...prev,
      skills: [...STARTING_SKILLS],
      quickReloadPoints: 0,
      spentXP: 0
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const downloadCharacterSheet = async () => {
    try {
      const doc = new Document({
        background: {
          color: "f4f1ea",
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "IRON & BLOOD",
                  bold: true,
                  size: 48,
                  color: "3d332a",
                  font: "Georgia",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Character Dossier",
                  italics: true,
                  size: 24,
                  color: "8e7f6d",
                  font: "Georgia",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Identity Section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                insideHorizontal: { style: BorderStyle.DOTTED, size: 1, color: "d1c7b7" },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "NAME: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: char.name, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "ETHNICITY: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: char.ethnicity, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "SEX: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: char.sex, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "RELIGION: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: char.religion, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "AGE: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: `${char.age} (${char.ageCategory})`, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "HANDEDNESS: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: char.handedness, italics: true, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Aptitudes Section Header
            new Paragraph({
              children: [new TextRun({ text: "APTITUDES", bold: true, size: 24, color: "3d332a" })],
              spacing: { after: 200 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
              },
              rows: [
                new TableRow({
                  children: Object.keys(char.aptitudes).map(key => 
                    new TableCell({
                      width: { size: 100 / 6, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: key.toUpperCase(), bold: true, size: 16, color: "8e7f6d" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: String(char.aptitudes[key as keyof typeof char.aptitudes]), size: 32, bold: true, color: "3d332a" })],
                        }),
                      ],
                      verticalAlign: VerticalAlign.CENTER,
                    })
                  ),
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Skills Section
            new Paragraph({
              children: [new TextRun({ text: "TRAINED SKILLS", bold: true, size: 24, color: "3d332a" })],
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "3d332a" } },
              spacing: { after: 200 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: Array.from({ length: Math.ceil(char.skills.length / 3) }).map((_, rowIndex) => {
                const rowSkills = [...char.skills]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(rowIndex * 3, rowIndex * 3 + 3);
                
                return new TableRow({
                  children: [0, 1, 2].map(colIndex => {
                    const skill = rowSkills[colIndex];
                    return new TableCell({
                      width: { size: 33.33, type: WidthType.PERCENTAGE },
                      shading: skill ? { fill: "ffffff", type: ShadingType.CLEAR } : undefined,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: skill ? `${skill.name}: ` : "", size: 18, color: "3d332a" }),
                            new TextRun({ text: skill ? String(skill.level) : "", bold: true, size: 18, color: "3d332a" }),
                          ],
                          spacing: { before: 50, after: 50 },
                        }),
                      ],
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                    });
                  }),
                });
              }),
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Combat Section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "QUICK RELOAD POINTS: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: String(char.quickReloadPoints), size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "REMAINING XP: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: String(char.totalXP - char.spentXP), size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "WEALTH: ", bold: true, size: 20, color: "3d332a" }),
                            new TextRun({ text: `£${char.wealth}`, size: 20, color: "3d332a" }),
                          ],
                          spacing: { before: 100, after: 100 },
                        }),
                      ],
                      columnSpan: 2,
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Notes Section
            new Paragraph({
              children: [new TextRun({ text: "BLOODLINE AND CHARACTER NOTES", bold: true, size: 24, color: "3d332a" })],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ 
                              text: char.notes || "No notes recorded.", 
                              italics: true, 
                              size: 20, 
                              color: "3d332a" 
                            })
                          ],
                          spacing: { before: 200, after: 200 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Possessions Section
            new Paragraph({
              children: [new TextRun({ text: "POSSESSIONS AND EQUIPMENT", bold: true, size: 24, color: "3d332a" })],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "d1c7b7" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "ffffff", type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ 
                              text: char.possessions || "No possessions recorded.", 
                              italics: true, 
                              size: 20, 
                              color: "3d332a" 
                            })
                          ],
                          spacing: { before: 200, after: 200 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${char.name.replace(/\s+/g, '_') || 'Character'}_Iron_and_Blood.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate DOCX:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="max-w-4xl w-full text-center mb-12 relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-20">
          <Shield size={120} className="text-[#3d332a]" />
        </div>
        <h1 className="text-6xl md:text-7xl mb-4 tracking-tighter text-[#3d332a] font-serif italic">Iron & Blood</h1>
        <p className="text-xs uppercase tracking-[0.4em] text-[#8e7f6d] font-bold">
          Quick Character Creator
        </p>
        <div className="flex justify-center items-center gap-4 mt-8">
          <div className="h-px bg-[#d1c7b7] flex-1 max-w-[100px]" />
          <div className="w-2 h-2 rounded-full bg-[#3d332a] rotate-45" />
          <div className="h-px bg-[#d1c7b7] flex-1 max-w-[100px]" />
        </div>
      </header>

      <main className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="parchment-card p-8 space-y-6">
                <h2 className="text-2xl italic border-b border-[#e8dfd1] pb-2">I. Identity & Age</h2>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Character Name</label>
                        <button 
                          onClick={handleRandomName}
                          className="historical-btn py-1 px-4 text-[10px] flex items-center gap-1"
                        >
                          <Dices size={12} /> Random Name
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={char.name}
                        onChange={e => setChar(prev => ({ ...prev, name: e.target.value }))}
                        className="text-2xl font-serif italic bg-transparent border-b border-[#d1c7b7] focus:border-[#5a5a40] outline-none py-2"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Sex</label>
                      <div className="grid grid-cols-3 gap-2 h-full">
                        {SEX_OPTIONS.map(option => (
                          <button
                            key={option}
                            onClick={() => setChar(prev => ({ ...prev, sex: option }))}
                            className={cn(
                              "flex items-center justify-center rounded border transition-all text-sm font-serif italic py-2",
                              char.sex === option 
                                ? "bg-[#5a5a40] border-[#5a5a40] text-[#ffffff]" 
                                : "bg-[#ffffff] border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Ethnicity</label>
                        <button 
                          onClick={() => setChar(prev => ({ ...prev, ethnicity: ETHNICITY_OPTIONS[Math.floor(Math.random() * ETHNICITY_OPTIONS.length)] }))}
                          className="text-[10px] uppercase tracking-tighter text-[#5a5a40] hover:underline flex items-center gap-1"
                        >
                          <RotateCcw size={10} /> Random
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={char.ethnicity}
                        onChange={e => setChar(prev => ({ ...prev, ethnicity: e.target.value }))}
                        className="bg-[#ffffff] border border-[#e8dfd1] rounded p-2 font-serif italic text-sm outline-none focus:border-[#5a5a40]"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Religion</label>
                        <button 
                          onClick={() => setChar(prev => ({ ...prev, religion: RELIGION_OPTIONS[Math.floor(Math.random() * RELIGION_OPTIONS.length)] }))}
                          className="text-[10px] uppercase tracking-tighter text-[#5a5a40] hover:underline flex items-center gap-1"
                        >
                          <RotateCcw size={10} /> Random
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={char.religion}
                        onChange={e => setChar(prev => ({ ...prev, religion: e.target.value }))}
                        className="bg-[#ffffff] border border-[#e8dfd1] rounded p-2 font-serif italic text-sm outline-none focus:border-[#5a5a40]"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Handedness</label>
                      <div className="grid grid-cols-3 gap-1">
                        {HANDEDNESS_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setChar(prev => ({ ...prev, handedness: opt }))}
                            className={cn(
                              "py-2 text-[10px] border rounded transition-all font-serif italic",
                              char.handedness === opt 
                                ? "bg-[#5a5a40] border-[#5a5a40] text-[#ffffff]" 
                                : "bg-[#ffffff] border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs uppercase tracking-wider font-bold text-[#8e7f6d]">Select Starting Age</label>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {(Object.keys(AGE_TABLE) as AgeCategory[]).map((age) => (
                        <button
                          key={age}
                          onClick={() => handleAgeSelect(age)}
                          className={cn(
                            "flex flex-col items-center p-4 rounded-lg border transition-all",
                            char.ageCategory === age 
                              ? "bg-[#5a5a40] border-[#5a5a40] text-[#ffffff] shadow-md" 
                              : "bg-[#ffffff] border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
                          )}
                        >
                          <span className="text-sm font-bold">{age}</span>
                          <span className="text-[10px] opacity-80 mt-1">{AGE_TABLE[age].xp.toLocaleString()} XP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#f5f2ed] p-4 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#8e7f6d]">Aptitude Pts</div>
                    <div className="text-xl font-serif">{currentAgeStats.aptitudePoints}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#8e7f6d]">Starting XP</div>
                    <div className="text-xl font-serif">{currentAgeStats.xp.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#8e7f6d]">Wealth</div>
                    <div className="text-xl font-serif">£{currentAgeStats.wealth}</div>
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center">
                <button 
                  onClick={generateFullCharacter}
                  className="historical-btn flex items-center gap-2 bg-[#8e7f6d] border-[#8e7f6d]"
                >
                  <Sparkles size={16} /> Auto-Generate Full Character
                </button>
                <button 
                  onClick={nextStep}
                  disabled={!char.name}
                  className="historical-btn flex items-center gap-2"
                >
                  Continue to Aptitudes <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="parchment-card p-8 space-y-8">
                <div className="flex justify-between items-end border-b border-[#e8dfd1] pb-2">
                  <h2 className="text-2xl italic">II. Assign Aptitudes</h2>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-[#8e7f6d] block">Remaining Points</span>
                    <span className={cn("text-2xl font-serif", remainingAptitudePoints === 0 ? "text-[#15803d]" : "text-[#b91c1c]")}>
                      {remainingAptitudePoints}
                    </span>
                  </div>
                </div>

                <p className="text-sm italic text-[#8e7f6d]">
                  Each Aptitude starts at 2. Distribute your points. No aptitude may be raised above 10.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { key: 'vitality', label: 'Vitality', icon: Heart },
                    { key: 'control', label: 'Control', icon: Target },
                    { key: 'intelligence', label: 'Intelligence', icon: Scroll },
                    { key: 'attractiveness', label: 'Attractiveness', icon: User },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-6 p-4 rounded-lg bg-[#fdfaf6] border border-[#e8dfd1]">
                      <div className="p-3 bg-[#ffffff] rounded-full border border-[#e8dfd1]">
                        <Icon size={24} className="text-[#5a5a40]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg">{label}</h3>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateAptitude(key as any, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-2xl font-serif w-8 text-center">{char.aptitudes[key as keyof typeof INITIAL_APTITUDES]}</span>
                            <button 
                              onClick={() => updateAptitude(key as any, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-between">
                <button onClick={prevStep} className="flex items-center gap-2 text-[#8e7f6d] hover:text-[#5a5a40] transition-colors">
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  onClick={nextStep}
                  disabled={remainingAptitudePoints !== 0}
                  className="historical-btn flex items-center gap-2"
                >
                  Continue to XP <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="parchment-card p-8 space-y-8">
                <div className="flex justify-between items-end border-b border-[#e8dfd1] pb-2">
                  <h2 className="text-2xl italic">III. Character Level Up</h2>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-[#8e7f6d] block">Available XP</span>
                    <span className="text-2xl font-serif">{remainingXP.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-[#8e7f6d] flex items-center gap-2">
                      <BookOpen size={16} /> Available Skills
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {COMMON_SKILLS.filter(name => !char.skills.some(s => s.name === name)).map(skillName => {
                        return (
                          <button
                            key={skillName}
                            onClick={() => toggleSkill(skillName)}
                            disabled={remainingXP < XP_COSTS.NEW_SKILL}
                            className="text-left p-3 rounded-md border transition-all flex justify-between items-center group bg-[#ffffff] border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
                          >
                            <span className="text-sm italic">{skillName}</span>
                            <span className="text-[10px] font-bold opacity-60">{XP_COSTS.NEW_SKILL} XP</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-[#8e7f6d] flex items-center gap-2">
                      <Sparkles size={16} /> Trained Skills
                    </h3>
                    <div className="space-y-3">
                      {char.skills.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-[#d1c7b7] rounded-md text-[#8e7f6d] italic text-sm">
                          No skills learned yet.
                        </div>
                      )}
                      {char.skills.map((skill, idx) => (
                        <div key={idx} className="p-4 bg-[#fdfaf6] border border-[#e8dfd1] rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-serif italic text-lg">{skill.name}</span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => decreaseSkill(idx)}
                                disabled={skill.level <= 0}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] disabled:opacity-30 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-2xl font-serif text-[#5a5a40] w-8 text-center">{skill.level}</span>
                              <button 
                                onClick={() => advanceSkill(idx)}
                                disabled={remainingXP < XP_COSTS.ADVANCE_SKILL_5 || skill.level >= MAX_SKILL_LEVEL}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] disabled:opacity-30 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-[#e8dfd1]">
                            <span className="text-[10px] uppercase tracking-widest text-[#8e7f6d]">Advance: {XP_COSTS.ADVANCE_SKILL_5} XP</span>
                            <button 
                              onClick={() => toggleSkill(skill.name)}
                              className="text-[10px] uppercase tracking-widest font-bold text-[#b91c1c] hover:underline"
                            >
                              Remove Skill
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-[#e8dfd1] space-y-4">
                      <h3 className="text-sm uppercase tracking-widest font-bold text-[#8e7f6d] flex items-center gap-2">
                        <Sword size={16} /> Combat Training
                      </h3>
                      <div className="p-4 bg-[#fdfaf6] border border-[#e8dfd1] rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-serif italic text-lg">Quick Reload Points</span>
                          <p className="text-[10px] text-[#8e7f6d] uppercase tracking-wider">Max 3 points. {XP_COSTS.QUICK_RELOAD} XP each.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={removeReloadPoint}
                            disabled={char.quickReloadPoints <= 0}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] disabled:opacity-30 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-2xl font-serif text-[#5a5a40] w-8 text-center">{char.quickReloadPoints}</span>
                          <button 
                            onClick={addReloadPoint}
                            disabled={remainingXP < XP_COSTS.QUICK_RELOAD || char.quickReloadPoints >= 3}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-[#ffffff] disabled:opacity-30 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {char.skills.length > 0 && (
                      <button 
                        onClick={resetXP}
                        className="w-full py-2 text-[10px] uppercase tracking-widest font-bold text-[#8e7f6d] hover:text-[#b91c1c] flex items-center justify-center gap-2 border border-dashed border-[#d1c7b7] rounded"
                      >
                        <RotateCcw size={14} /> Reset All XP
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex justify-between">
                <button onClick={prevStep} className="flex items-center gap-2 text-[#8e7f6d] hover:text-[#5a5a40] transition-colors">
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  onClick={nextStep}
                  className="historical-btn flex items-center gap-2"
                >
                  Final Review <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <section ref={dossierRef} className="parchment-card p-12 space-y-8 relative overflow-hidden text-[#2c241e]">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl font-gothic leading-tight">Here lies the notaries of a soul whose fate lies with Iron & Blood</h2>
                </div>

                {/* Identity Section */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 border-b-2 border-dashed border-[#3d332a] pb-6">
                  <div className="space-y-1">
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Name:</span>
                      <input 
                        type="text"
                        value={char.name}
                        onChange={(e) => setChar(prev => ({ ...prev, name: e.target.value }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-full"
                      />
                    </div>
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Sex:</span>
                      <input 
                        type="text"
                        value={char.sex}
                        onChange={(e) => setChar(prev => ({ ...prev, sex: e.target.value }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-full"
                      />
                    </div>
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Age:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          value={char.age}
                          onChange={(e) => setChar(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                          className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-12"
                        />
                        <span className="font-serif italic opacity-50">({char.ageCategory})</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Ethnicity:</span>
                      <input 
                        type="text"
                        value={char.ethnicity}
                        onChange={(e) => setChar(prev => ({ ...prev, ethnicity: e.target.value }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-full"
                      />
                    </div>
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Religion:</span>
                      <input 
                        type="text"
                        value={char.religion}
                        onChange={(e) => setChar(prev => ({ ...prev, religion: e.target.value }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-full"
                      />
                    </div>
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Handedness:</span>
                      <input 
                        type="text"
                        value={char.handedness}
                        onChange={(e) => setChar(prev => ({ ...prev, handedness: e.target.value }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-full"
                      />
                    </div>
                    <div className="flex justify-between border-b border-dotted border-[#3d332a] items-center">
                      <span className="font-bold uppercase text-[10px] opacity-70">Quick Reload:</span>
                      <input 
                        type="number"
                        value={char.quickReloadPoints}
                        onChange={(e) => setChar(prev => ({ ...prev, quickReloadPoints: parseInt(e.target.value) || 0 }))}
                        className="font-serif italic bg-transparent border-none outline-none text-right focus:text-[#5a5a40] transition-colors w-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Aptitudes Section */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  {Object.entries(char.aptitudes).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="font-bold uppercase text-xs tracking-widest">{key}</div>
                      <input 
                        type="number"
                        value={val}
                        onChange={(e) => setChar(prev => ({
                          ...prev,
                          aptitudes: { ...prev.aptitudes, [key]: parseInt(e.target.value) || 0 }
                        }))}
                        className="text-3xl font-serif border-b-2 border-dotted border-[#3d332a] pb-1 bg-transparent text-center w-full outline-none focus:text-[#5a5a40] transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {/* Skills Grid */}
                <div className="space-y-4 border-t-2 border-[#3d332a] pt-4">
                  <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-[11px]">
                    {[...char.skills].sort((a, b) => a.name.localeCompare(b.name)).map((skill, idx) => (
                      <div key={idx} className="flex justify-between border-b border-dotted border-[#3d332a] py-1 items-center group">
                        <div className="flex items-center gap-1 flex-1">
                          <button 
                            onClick={() => {
                              const newSkills = char.skills.filter(s => s.name !== skill.name);
                              setChar(prev => ({ ...prev, skills: newSkills }));
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#b91c1c] transition-opacity"
                            title="Remove Skill"
                          >
                            <Minus size={10} />
                          </button>
                          <input 
                            type="text"
                            value={skill.name}
                            onChange={(e) => {
                              const newSkills = [...char.skills];
                              const skillIdx = char.skills.findIndex(s => s.name === skill.name);
                              if (skillIdx !== -1) {
                                newSkills[skillIdx].name = e.target.value;
                                setChar(prev => ({ ...prev, skills: newSkills }));
                              }
                            }}
                            className="truncate pr-1 bg-transparent border-none outline-none focus:text-[#5a5a40] transition-colors w-full"
                          />
                        </div>
                        <input 
                          type="number"
                          value={skill.level}
                          onChange={(e) => {
                            const newSkills = [...char.skills];
                            const skillIdx = char.skills.findIndex(s => s.name === skill.name);
                            if (skillIdx !== -1) {
                              newSkills[skillIdx].level = parseInt(e.target.value) || 0;
                              setChar(prev => ({ ...prev, skills: newSkills }));
                            }
                          }}
                          className="font-bold bg-transparent border-none outline-none text-right w-8 focus:text-[#5a5a40] transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const availableSkills = COMMON_SKILLS.filter(name => !char.skills.some(s => s.name === name));
                      if (availableSkills.length > 0) {
                        setNewSkillSelection({ name: availableSkills[0], level: 0 });
                      } else {
                        setNewSkillSelection({ name: `New Skill ${char.skills.length + 1}`, level: 0 });
                      }
                      setIsAddSkillModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#8e7f6d] hover:text-[#5a5a40] transition-colors border border-dashed border-[#d1c7b7] px-3 py-1 rounded-sm"
                  >
                    <Plus size={12} /> Add New Skill
                  </button>
                </div>

                <AnimatePresence>
                  {isAddSkillModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="parchment-card max-w-2xl w-full p-8 shadow-2xl space-y-6 border-2 border-[#3d332a]"
                      >
                        <div className="flex justify-between items-center border-b border-[#d1c7b7] pb-4">
                          <h3 className="text-xl font-gothic">Acquire New Skill</h3>
                          <button onClick={() => setIsAddSkillModalOpen(false)} className="text-[#8e7f6d] hover:text-[#b91c1c]">
                            <Minus size={20} />
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8e7f6d] flex items-center gap-2">
                              <BookOpen size={14} /> Available Skills
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {COMMON_SKILLS.filter(name => !char.skills.some(s => s.name === name)).map(name => (
                                <button
                                  key={name}
                                  onClick={() => setNewSkillSelection(prev => ({ ...prev, name }))}
                                  className={cn(
                                    "text-left p-3 rounded-md border transition-all flex flex-col gap-1 group",
                                    newSkillSelection.name === name 
                                      ? "bg-[#3d332a] text-[#f4f1ea] border-[#3d332a]" 
                                      : "bg-white border-[#d1c7b7] text-[#3d332a] hover:border-[#5a5a40]"
                                  )}
                                >
                                  <span className="text-sm font-serif italic">{name}</span>
                                  <span className={cn(
                                    "text-[9px] uppercase tracking-tighter transition-opacity h-3",
                                    newSkillSelection.name === name ? "opacity-80" : "opacity-40 group-hover:opacity-60"
                                  )}>
                                  </span>
                                </button>
                              ))}
                              {!COMMON_SKILLS.some(name => !char.skills.some(s => s.name === name)) && (
                                <div className="col-span-2 text-center py-8 border border-dashed border-[#d1c7b7] rounded text-[#8e7f6d] italic text-xs">
                                  All common skills have been acquired.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-[#8e7f6d] flex items-center gap-2">
                              <Target size={14} /> Select Proficiency Level
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {[0, 5, 10, 15].map(lvl => (
                                <button
                                  key={lvl}
                                  onClick={() => setNewSkillSelection(prev => ({ ...prev, level: lvl }))}
                                  className={cn(
                                    "py-2 border rounded font-serif transition-all flex flex-col items-center",
                                    newSkillSelection.level === lvl 
                                      ? "bg-[#5a5a40] text-white border-[#5a5a40]" 
                                      : "bg-white border-[#d1c7b7] text-[#3d332a] hover:border-[#5a5a40]"
                                  )}
                                >
                                  <span className="text-lg leading-none">{lvl}</span>
                                  <span className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">Level</span>
                                </button>
                              ))}
                            </div>
                            <div className="p-3 bg-[#f5f2ed] rounded border border-[#d1c7b7] text-[11px] italic text-[#8e7f6d] flex gap-2 items-start min-h-[3rem]">
                              <Scroll size={14} className="shrink-0 mt-0.5" />
                              <span>Level {newSkillSelection.level} Mastery: </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button 
                            onClick={() => setIsAddSkillModalOpen(false)}
                            className="flex-1 py-2 text-[10px] uppercase tracking-widest font-bold border border-[#d1c7b7] rounded hover:bg-[#f5f2ed]"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              setChar(prev => ({
                                ...prev,
                                skills: [...prev.skills, { ...newSkillSelection }]
                              }));
                              setIsAddSkillModalOpen(false);
                            }}
                            className="flex-1 py-2 text-[10px] uppercase tracking-widest font-bold bg-[#3d332a] text-[#f4f1ea] rounded hover:opacity-90"
                          >
                            Add Skill
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Resources Section */}
                <div className="grid grid-cols-2 gap-8 border-t-2 border-[#3d332a] pt-6">
                  <div className="text-center space-y-1">
                    <div className="font-bold uppercase text-[10px] tracking-widest text-[#8e7f6d]">Remaining Experience</div>
                    <div className="flex items-center justify-center gap-2">
                      <input 
                        type="number"
                        value={char.totalXP - char.spentXP}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          // Adjust totalXP to maintain the desired remainingXP
                          setChar(prev => ({ ...prev, totalXP: prev.spentXP + val }));
                        }}
                        className="text-3xl font-serif bg-transparent border-none outline-none text-center w-32 focus:text-[#5a5a40] transition-colors"
                      />
                      <span className="text-[10px] uppercase opacity-40 font-bold">XP</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="font-bold uppercase text-[10px] tracking-widest text-[#8e7f6d]">Current Wealth</div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xl font-serif text-[#8e7f6d]">£</span>
                      <input 
                        type="number"
                        value={char.wealth}
                        onChange={(e) => setChar(prev => ({ ...prev, wealth: parseInt(e.target.value) || 0 }))}
                        className="text-3xl font-serif bg-transparent border-none outline-none text-center w-32 focus:text-[#5a5a40] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t-2 border-dashed border-[#3d332a] text-center">
                  <h3 className="text-2xl font-gothic">Bloodline and Character Notes</h3>
                  <textarea 
                    value={char.notes}
                    onChange={(e) => setChar(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Record your deeds, wounds, and lineage here..."
                    className="w-full h-32 mt-4 border border-[#d1c7b7] bg-[rgba(255,255,255,0.3)] rounded-sm p-4 font-serif italic resize-none outline-none focus:border-[#5a5a40] transition-all placeholder:opacity-30"
                  />
                </div>

                <div className="pt-8 border-t-2 border-dashed border-[#3d332a] text-center">
                  <h3 className="text-2xl font-gothic">Possessions and Equipment</h3>
                  <textarea 
                    value={char.possessions}
                    onChange={(e) => setChar(prev => ({ ...prev, possessions: e.target.value }))}
                    placeholder="List your weapons, armor, and curiosities..."
                    className="w-full h-32 mt-4 border border-[#d1c7b7] bg-[rgba(255,255,255,0.3)] rounded-sm p-4 font-serif italic resize-none outline-none focus:border-[#5a5a40] transition-all placeholder:opacity-30"
                  />
                </div>
              </section>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={prevStep}
                  className="historical-btn flex items-center gap-2 bg-[#8e7f6d] border-[#8e7f6d]"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  onClick={downloadCharacterSheet}
                  className="historical-btn flex items-center gap-2"
                >
                  <FileText size={18} /> Download Character Sheet (.docx)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 text-center text-[10px] uppercase tracking-widest text-[#8e7f6d] opacity-50">
        &copy; Iron & Blood
      </footer>
    </div>
  );
}
