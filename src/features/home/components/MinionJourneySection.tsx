"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Target, BookOpen, Settings, Users, BarChart, Trophy, TrendingUp, Leaf } from 'lucide-react';

const journeySteps = [
  {
    id: '01',
    label: 'DISCOVER',
    title: 'Discover Your Starting Point',
    description: 'Understand your current role, strengths and opportunities. Know where you stand and where you want to go.',
    icon: Target,
    sideCardTitle: 'CLARITY',
    sideCardDesc: 'Know your current position and next steps.',
    img: '/hero-bg-dusk.jpg'
  },
  {
    id: '02',
    label: 'LEARN',
    title: 'Learn & Develop',
    description: 'Build new skills through product training, technical knowledge, sales skills and leadership programs.',
    icon: BookOpen,
    sideCardTitle: 'LEARNING',
    sideCardDesc: 'Build skills for a brighter future.',
    img: '/learning_pare_1790177459122.jpg'
  },
  {
    id: '03',
    label: 'WORK',
    title: 'Work on Real Projects',
    description: 'Turn learning into action. Be part of exciting projects in homes, interiors, landscaping and automation.',
    icon: Settings,
    sideCardTitle: 'EXPERIENCE',
    sideCardDesc: 'Apply your knowledge on real projects.',
    img: '/project_interior_1790169331764.jpg'
  },
  {
    id: '04',
    label: 'COLLABORATE',
    title: 'Collaborate & Contribute',
    description: 'Work with a supportive team. Share ideas, solve challenges and create better solutions together.',
    icon: Users,
    sideCardTitle: 'TEAMWORK',
    sideCardDesc: 'Grow together with trust and respect.',
    img: '/team_photo_1790176531800.jpg'
  },
  {
    id: '05',
    label: 'PERFORM',
    title: 'Perform & Make an Impact',
    description: 'Track your performance in tasks, meetings, projects and customer satisfaction. Make a real difference every day.',
    icon: BarChart,
    sideCardTitle: 'PERFORMANCE',
    sideCardDesc: 'Turn effort into impact.',
    img: '/learning_auto_1790177976288.jpg'
  },
  {
    id: '06',
    label: 'GROW',
    title: 'Grow With Recognition',
    description: 'Be recognized for your efforts. Achieve milestones, unlock rewards like bike, car and leadership opportunities.',
    icon: Trophy,
    sideCardTitle: 'REWARDS',
    sideCardDesc: 'Your efforts are noticed and celebrated.',
    img: '/project_ceiling_1790169374938.jpg'
  },
  {
    id: '07',
    label: 'LEAD',
    title: 'Lead & Inspire',
    description: "Take on bigger responsibilities. Mentor others. Create future leaders. Be part of Minion's long-term growth.",
    icon: TrendingUp,
    sideCardTitle: 'LEADERSHIP',
    sideCardDesc: 'Create opportunities for others.',
    img: '/profile_dinesh_1790169304436.jpg'
  },
  {
    id: '08',
    label: 'BUILD',
    title: 'Build a Better Tomorrow',
    description: 'Together, we build smarter homes, greener communities and happier lives. Your journey helps shape the future.',
    icon: Leaf,
    sideCardTitle: 'LEGACY',
    sideCardDesc: 'Leave a lasting impact.',
    img: '/project_landscaping_1790169351850.jpg'
  }
];

export default function MinionJourneySection() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!stepRefs.current) return;

      const viewportHeight = window.innerHeight;
      const triggerPoint = viewportHeight * 0.5; // middle of screen

      stepRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();

        // If the top of the element is above the middle of the screen
        // and the bottom of the element is below the middle of the screen
        if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
          setActiveStep(idx);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="w-full max-w-[1400px] mx-auto bg-black text-white py-24 font-sans relative z-10">
      <div className="px-6 md:px-12 flex flex-col lg:flex-row gap-12 lg:gap-16 relative">

        {/* Left & Center Merged Column: Sticky Background, Text, and Steps */}
        <div className="hidden lg:block lg:w-7/12 lg:sticky lg:top-16 h-[85vh] rounded-3xl overflow-hidden relative border border-white/10 z-10">

          {/* Background Images */}
          <div className="absolute inset-0">
            {[
              '/journey/walking_step_1_1790266064662.jpg',
              '/journey/walking_step_2_1790266147996.jpg',
              '/journey/walking_step_3_1790266159941.jpg',
              '/journey/walking_step_4_1790266172512.jpg',
              '/journey/walking_step_5_1790266184263.jpg',
              '/journey/walking_step_6_1790266202584.jpg',
              '/journey/walking_step_7_1790266258459.jpg',
              '/journey/walking_step_8_1790266275122.jpg',
            ].map((imgSrc, idx) => (
              <Image
                key={imgSrc}
                src={imgSrc}
                alt={`Staircase step ${idx + 1}`}
                fill
                className={`object-cover transition-opacity duration-700 ease-in-out ${activeStep === idx ? 'opacity-80' : 'opacity-0'
                  }`}
              />
            ))}

            {/* Dark gradient for text legibility on the left */}
            <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-[#11161A] via-[#11161A]/80 to-transparent z-10 pointer-events-none"></div>
            {/* Top and Bottom fades */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#11161A] via-transparent to-[#11161A] z-10 pointer-events-none"></div>
          </div>

          {/* Left Text Content */}
          <div className="absolute top-12 left-10 z-20 max-w-sm pointer-events-none">
            <p className="text-gray-400 text-xs tracking-[0.2em] font-bold uppercase mb-6">THE MINION JOURNEY</p>
            <h2 className="text-5xl md:text-[3.5rem] font-black leading-[1.05] mb-8">
              Learn<br />
              Work<br />
              <span className="text-[#FFCC00]">Grow</span><br />
              Belong
            </h2>
            <p className="text-gray-300 text-base leading-relaxed mb-12">
              A journey of possibilities.<br />
              For you. For our customers.<br />
              For a better tomorrow.
            </p>

            <div className="mt-12 transform -rotate-[10deg] ml-4">
              <p className="font-[family-name:var(--font-caveat)] text-4xl text-white opacity-90 leading-tight">
                Stronger<br />People<br />Brighter<br />Tomorrows
              </p>
              {/* Yellow brush underline approximation */}
              <div className="w-[80%] h-1.5 bg-[#FFCC00] mt-3 transform -rotate-2 rounded-full"></div>
            </div>
          </div>

          {/* SVG Dotted Line (Curve) */}
          <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path
              d="M 50 82 Q 60 76 56 68 Q 53 60 58 53 Q 66 45 61 36 Q 56 26 66 18 Q 75 12 75 5"
              stroke="#FFCC00"
              strokeWidth="0.3"
              strokeDasharray="1, 1.5"
              fill="none"
              className="opacity-60"
            />
          </svg>

          {/* Step Bubbles */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {journeySteps.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;

              // Coordinates matched roughly to the path above
              const positions = [
                { left: '50%', top: '82%' }, // 01
                { left: '56%', top: '68%' }, // 02
                { left: '58%', top: '53%' }, // 03
                { left: '66%', top: '45%' }, // 04
                { left: '61%', top: '36%' }, // 05
                { left: '66%', top: '24%' }, // 06
                { left: '66%', top: '15%' }, // 07
                { left: '75%', top: '5%' },  // 08
              ];
              const pos = positions[idx];

              return (
                <div
                  key={step.id}
                  className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700
                    ${isActive ? 'opacity-100 scale-110' : (isPast ? 'opacity-100 scale-100' : 'opacity-50 scale-95')}`}
                  style={{
                    left: pos.left,
                    top: pos.top
                  }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all duration-500 mb-2
                    ${isActive || isPast ? 'bg-[#FFCC00] text-black shadow-[0_0_20px_rgba(255,204,0,0.6)]' : 'bg-[#11161A] text-[#FFCC00] border-2 border-[#FFCC00]/50'}`}>
                    {step.id}
                  </div>
                  <span className={`font-bold tracking-widest text-xs uppercase transition-colors duration-500 whitespace-nowrap
                    ${isActive || isPast ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Scrolling Cards */}
        <div className="lg:w-5/12 flex flex-col gap-24 py-[20vh] z-20" ref={containerRef}>
          {journeySteps.map((step, idx) => (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[idx] = el; }}
              className={`flex flex-col xl:flex-row gap-6 transition-all duration-700
                ${activeStep === idx ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}
            >
              {/* Image Card */}
              <div className="xl:w-1/2 rounded-2xl overflow-hidden aspect-[4/3] relative border border-white/10 group">
                <Image
                  src={step.img}
                  alt={step.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-700"></div>

                {/* Overlay Mini Logo */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
                    <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00" />
                  </svg>
                  <span className="text-white font-black tracking-widest text-[10px]">MINION</span>
                </div>
              </div>

              {/* Text Card */}
              <div className="xl:w-1/2 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 text-yellow-500">
                    {step.id}
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">{step.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Side Info */}
                <div className="flex gap-4 items-start">
                  <step.icon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide mb-1">{step.sideCardTitle}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {step.sideCardDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
