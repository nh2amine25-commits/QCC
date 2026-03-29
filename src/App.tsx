import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  Sparkles
} from 'lucide-react';
import { AGE_TABLE, INITIAL_APTITUDES, MAX_APTITUDE, MAX_SKILL_LEVEL, XP_COSTS, STARTING_SKILLS, COMMON_SKILLS, HISTORICAL_NAMES, SEX_OPTIONS } from './constants';
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
    ageCategory: 'Young Adult',
    aptitudes: { ...INITIAL_APTITUDES },
    skills: [...STARTING_SKILLS],
    quickReloadPoints: 0,
    spentXP: 0,
    totalXP: AGE_TABLE['Young Adult'].xp,
    wealth: AGE_TABLE['Young Adult'].wealth,
  });

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
    setChar(prev => ({ ...prev, name, sex }));
  };

  const generateFullCharacter = () => {
    const ages = Object.keys(AGE_TABLE) as AgeCategory[];
    const randomAge = ages[Math.floor(Math.random() * ages.length)];
    const ageStats = AGE_TABLE[randomAge];
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
      ageCategory: randomAge,
      aptitudes: apts,
      skills: skills,
      quickReloadPoints: reloads,
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
    if (!dossierRef.current) return;
    
    // Add a temporary class to ensure styling is correct for capture
    dossierRef.current.classList.add('pdf-capture');
    
    try {
      const canvas = await html2canvas(dossierRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fdfaf6',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${char.name.replace(/\s+/g, '_') || 'Character'}_Iron_and_Blood.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      dossierRef.current.classList.remove('pdf-capture');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="max-w-4xl w-full text-center mb-12 relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-20">
          <Shield size={120} className="text-[#3d332a]" />
        </div>
        <h1 className="text-6xl md:text-7xl mb-4 tracking-tighter text-[#3d332a] font-serif italic">Iron and Blood</h1>
        <p className="text-xs uppercase tracking-[0.4em] text-[#8e7f6d] font-bold">
          Character Creation Protocol — 1500–1875
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
                        placeholder="e.g. Captain Horace Vernet"
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
                              "flex items-center justify-center rounded border transition-all text-sm font-serif italic",
                              char.sex === option 
                                ? "bg-[#5a5a40] border-[#5a5a40] text-white" 
                                : "bg-white border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
                            )}
                          >
                            {option}
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
                              ? "bg-[#5a5a40] border-[#5a5a40] text-white shadow-md" 
                              : "bg-white border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
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
                    <span className={cn("text-2xl font-serif", remainingAptitudePoints === 0 ? "text-green-700" : "text-red-700")}>
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
                      <div className="p-3 bg-white rounded-full border border-[#e8dfd1]">
                        <Icon size={24} className="text-[#5a5a40]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg">{label}</h3>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateAptitude(key as any, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-2xl font-serif w-8 text-center">{char.aptitudes[key as keyof typeof INITIAL_APTITUDES]}</span>
                            <button 
                              onClick={() => updateAptitude(key as any, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white transition-colors"
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
                            className="text-left p-3 rounded-md border transition-all flex justify-between items-center group bg-white border-[#e8dfd1] hover:border-[#5a5a40] text-[#5a5a40]"
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
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white disabled:opacity-30 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-2xl font-serif text-[#5a5a40] w-8 text-center">{skill.level}</span>
                              <button 
                                onClick={() => advanceSkill(idx)}
                                disabled={remainingXP < XP_COSTS.ADVANCE_SKILL_5 || skill.level >= MAX_SKILL_LEVEL}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white disabled:opacity-30 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-[#e8dfd1]">
                            <span className="text-[10px] uppercase tracking-widest text-[#8e7f6d]">Advance: {XP_COSTS.ADVANCE_SKILL_5} XP</span>
                            <button 
                              onClick={() => toggleSkill(skill.name)}
                              className="text-[10px] uppercase tracking-widest font-bold text-red-700 hover:underline"
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
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white disabled:opacity-30 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-2xl font-serif text-[#5a5a40] w-8 text-center">{char.quickReloadPoints}</span>
                          <button 
                            onClick={addReloadPoint}
                            disabled={remainingXP < XP_COSTS.QUICK_RELOAD || char.quickReloadPoints >= 3}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d1c7b7] hover:bg-white disabled:opacity-30 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {char.skills.length > 0 && (
                      <button 
                        onClick={resetXP}
                        className="w-full py-2 text-[10px] uppercase tracking-widest font-bold text-[#8e7f6d] hover:text-red-700 flex items-center justify-center gap-2 border border-dashed border-[#d1c7b7] rounded"
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
              <section ref={dossierRef} className="parchment-card p-12 space-y-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5a5a40]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="text-center space-y-2 relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[#8e7f6d] font-bold">Character Dossier</div>
                  <h2 className="text-5xl font-serif italic text-[#3d332a]">{char.name || 'Unnamed Adventurer'}</h2>
                  <p className="text-lg text-[#8e7f6d] italic">{char.sex} — {char.ageCategory}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-[#8e7f6d] border-b border-[#e8dfd1] mb-4 pb-1">Aptitudes</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(char.aptitudes).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="capitalize text-sm font-medium">{key}</span>
                            <span className="text-2xl font-serif">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-[#8e7f6d] border-b border-[#e8dfd1] mb-4 pb-1">Assets</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2"><Coins size={14} /> Wealth</span>
                          <span className="text-lg font-serif">£{char.wealth}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2"><RotateCcw size={14} /> Quick Reloads</span>
                          <span className="text-lg font-serif">{char.quickReloadPoints}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#8e7f6d] border-b border-[#e8dfd1] mb-4 pb-1">Skills</h3>
                    <div className="space-y-2">
                      {char.skills.map((s, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-[#f5f2ed] py-1">
                          <span className="text-sm italic">{s.name}</span>
                          <span className="font-serif">{s.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#e8dfd1] text-center">
                  <p className="text-sm italic text-[#8e7f6d]">
                    "Iron is the price of progress; Blood is the ink of history."
                  </p>
                </div>
              </section>

              <div className="flex justify-center gap-4">
                <button onClick={() => setStep(0)} className="px-8 py-3 border border-[#d1c7b7] rounded-full text-sm font-bold uppercase tracking-widest hover:bg-white transition-all">
                  Start Over
                </button>
                <button 
                  onClick={downloadCharacterSheet}
                  className="historical-btn px-12"
                >
                  Download Character Sheet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 text-center text-[10px] uppercase tracking-widest text-[#8e7f6d] opacity-50">
        &copy; 1500—1875 Iron & Blood Historical Roleplaying
      </footer>
    </div>
  );
}
