import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, PlayCircle, Home, Building2, Sprout, Settings, Users, 
  BookOpen, Users2, Trophy, BarChart, FileText, Calendar, Clock, Link as LinkIcon,
  CheckCircle2, ChevronRight, PlusSquare, FilePlus, MapPin, FolderPlus, CreditCard,
  Target, Activity, Gift, Library, MonitorPlay, Laptop, Cake, Medal, UserPlus, Award, Heart
} from 'lucide-react';

export default function LightMockupSection() {
  return (
    <div className="w-full bg-[#f9fafc] text-gray-900 font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* 1. Mountain Hero Section */}
      <div className="relative w-full h-[600px]">
        {/* Placeholder for Mountain Hero - using dusk bg */}
        <Image src="/hero-bg-dusk.jpg" alt="Mountain Hero" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 h-full flex flex-col justify-center pb-24">
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-gray-300 mb-6 uppercase">
            <span>PEOPLE</span>
            <span className="text-gray-400">|</span>
            <span>PROJECTS</span>
            <span className="text-gray-400">|</span>
            <span>SUSTAINABLE LIVING</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            We Don't Just<br/>
            <span className="text-yellow-500">Build Spaces</span>.<br/>
            We <span className="text-yellow-500">Build People</span>.
          </h1>
          <p className="text-lg text-gray-200 max-w-xl mb-10 font-medium leading-relaxed">
            At Minion, every idea, every effort and every team member creates smarter homes, greener spaces and happier lives.
          </p>
          
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full flex items-center gap-2 transition-colors">
              My Work <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-full flex items-center gap-2 transition-colors">
              <PlayCircle className="w-5 h-5" /> Explore Minion
            </button>
          </div>

          {/* Script Text right side */}
          <div className="absolute right-20 top-1/3 hidden lg:block text-5xl font-serif italic text-white/90 transform -rotate-6">
            One <br/>Team <br/>Many <br/>Possibilities
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-[#111111] flex items-center">
          <div className="max-w-[1400px] mx-auto w-full px-6 md:px-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-yellow-500 rounded-md">
                <Home className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">SMART HOMES</span>
                <span className="text-xs text-gray-400 mt-1">Automation for<br/>a better living</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-yellow-500 rounded-md">
                <Building2 className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">INTERIORS</span>
                <span className="text-xs text-gray-400 mt-1">Beautiful spaces<br/>that inspire</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-yellow-500 rounded-md">
                <Sprout className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">LANDSCAPING</span>
                <span className="text-xs text-gray-400 mt-1">Greener spaces<br/>for brighter days</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-yellow-500 rounded-md">
                <Settings className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">AUTOMATION</span>
                <span className="text-xs text-gray-400 mt-1">Smarter living<br/>with technology</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-yellow-500 rounded-md">
                <Users className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">OUR PEOPLE</span>
                <span className="text-xs text-gray-400 mt-1">The true strength<br/>of Minion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Journey Section */}
      <div className="w-full bg-[#f9fafc] py-24 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          
          <div className="w-full lg:w-[25%] flex flex-col">
            <h2 className="text-4xl font-black text-[#111111] leading-tight mb-4 tracking-tight">
              Your Journey<br/>at <span className="text-yellow-500">Minion</span>
            </h2>
            <p className="text-gray-600 font-medium mb-10">
              More than a job. It's a journey of learning, doing, growing and making an impact.
            </p>
            <div className="text-4xl font-serif italic text-[#111111] transform -rotate-6">
              Better People<br/>Build Better<br/><span className="text-yellow-500">Spaces</span>
            </div>
          </div>

          <div className="w-full lg:w-[50%] flex justify-center relative py-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <BookOpen className="w-5 h-5 text-gray-700" />
              <div className="flex flex-col"><span className="text-xs font-bold">Learn</span><span className="text-[10px] text-gray-500">Develop new skills</span></div>
            </div>

            <div className="absolute top-1/4 -left-4 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <Users2 className="w-5 h-5 text-gray-700" />
              <div className="flex flex-col"><span className="text-xs font-bold">Team</span><span className="text-[10px] text-gray-500">Work together</span></div>
            </div>

            <div className="absolute top-1/4 -right-4 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <BarChart className="w-5 h-5 text-gray-700" />
              <div className="flex flex-col"><span className="text-xs font-bold">Performance</span><span className="text-[10px] text-gray-500">Track your impact</span></div>
            </div>

            <div className="w-48 h-48 bg-[#111111] rounded-full flex flex-col items-center justify-center text-white relative z-10 border-4 border-[#f9fafc] shadow-xl">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round"/>
                <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00"/>
              </svg>
              <span className="text-sm font-bold tracking-widest text-center">YOUR<br/>JOURNEY</span>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <FileText className="w-5 h-5 text-gray-700" />
              <div className="flex flex-col"><span className="text-xs font-bold">Projects</span><span className="text-[10px] text-gray-500">Create real value</span></div>
            </div>

            <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
              <Trophy className="w-5 h-5 text-gray-700" />
              <div className="flex flex-col"><span className="text-xs font-bold">Growth</span><span className="text-[10px] text-gray-500">Unlock new opportunities</span></div>
            </div>
            
            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none" style={{ opacity: 0.15 }}>
              <circle cx="50%" cy="50%" r="140" fill="none" stroke="#111111" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="50%" y2="0" stroke="#111111" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="0" y2="25%" stroke="#111111" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="100%" y2="25%" stroke="#111111" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="25%" y2="100%" stroke="#111111" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="75%" y2="100%" stroke="#111111" strokeWidth="2" />
            </svg>
          </div>

          <div className="w-full lg:w-[25%] flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-[#111111] mb-1">Your Growth</h3>
            <h3 className="text-2xl font-bold text-yellow-500 mb-6">Starts Here</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              From learning and collaboration to performance and recognition, every step at Minion is designed to help you become the best version of yourself.
            </p>
            <button className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full flex items-center justify-center gap-2 transition-colors text-sm">
              Explore Your Journey <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. Founder Message */}
      <div className="w-full bg-white py-24 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/3 relative rounded-2xl overflow-hidden aspect-square bg-[#111111]">
            <Image src="/founder_1790176549557.jpg" alt="Sivabalan Subramanian" fill className="object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white text-center">
              <div className="font-bold text-xl">SIVABALAN SUBRAMANIAN</div>
              <div className="text-yellow-500 text-sm font-semibold">Founder & Managing Director</div>
            </div>
            <div className="absolute top-8 right-8 text-3xl font-serif italic text-white/90 transform -rotate-12 text-right">
              "Let's Build<br/>a Smarter<br/>Tomorrow"
            </div>
          </div>
          
          <div className="w-full lg:w-2/3 flex flex-col">
            <h2 className="text-3xl font-black text-[#111111] mb-4">A Message From <span className="text-yellow-500">Our Founder</span></h2>
            <p className="text-lg text-gray-600 font-medium mb-12 italic">
              "Every role, every idea and every effort matters. Together we build smarter homes, greener spaces and happier lives."
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h4 className="font-bold text-[#111111] mb-2">Our Vision</h4>
                <p className="text-sm text-gray-600 leading-relaxed">To be the most trusted and preferred brand for smart living solutions in India.</p>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#111111]" />
                </div>
                <h4 className="font-bold text-[#111111] mb-2">Our Mission</h4>
                <p className="text-sm text-gray-600 leading-relaxed">To deliver innovative, sustainable and high-quality solutions that enhance everyday living.</p>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3.1 9 1.6-2.8L9 2l4.3 4.3c1.3 1.3 3.5 1.3 4.8 0L20 4.4 22 7l-2 10.6-9.4 4.4L2.3 17 3.1 9Z"/></svg>
                </div>
                <h4 className="font-bold text-[#111111] mb-3">Our Values</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> Integrity in everything we do</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> Customer first</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> Teamwork and respect</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> Continuous learning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /> Sustainable growth</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Light Dashboard */}
      <div className="w-full bg-[#f4f5f7] py-20 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          
          <div className="flex items-end justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-[#111111] tracking-tight">Your Day at Minion</h2>
              <p className="text-gray-500 font-medium">Everything you need to focus on, in one place.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-sm font-bold text-[#111111]">
              <Calendar className="w-4 h-4" /> Wednesday, 23 Sep 2026
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-[#111111]"><FileText className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">8</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Today's Tasks</span><span className="text-[10px] text-green-500 font-bold mt-1">↑ 2</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center text-yellow-500"><MapPin className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">3</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Site Visits</span><span className="text-[10px] text-green-500 font-bold mt-1">↑ 1</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center text-yellow-500"><Clock className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">5</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Follow-ups</span><span className="text-[10px] text-green-500 font-bold mt-1">↑ 2</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-[#111111]"><FilePlus className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">2</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Quotes Pending</span><span className="text-[10px] text-gray-400 font-bold mt-1">→ 0</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center text-yellow-500"><CreditCard className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">4</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Project Actions</span><span className="text-[10px] text-green-500 font-bold mt-1">↑ 1</span></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center text-yellow-500"><Users2 className="w-6 h-6" /></div>
              <div className="flex flex-col"><span className="text-2xl font-black text-[#111111] leading-none mb-1">1</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Meeting Today</span><span className="text-[10px] text-gray-400 font-bold mt-1">→ 0</span></div>
            </div>
          </div>

          {/* 3 Columns Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* My Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><CheckCircle2 className="w-5 h-5 text-yellow-500" /> My Tasks</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  { text: "Follow up with Mr. Kumar (Interior)", time: "Today", color: "text-yellow-600" },
                  { text: "Site measurement - Anna Nagar", time: "Today", color: "text-yellow-600" },
                  { text: "Send revised quotation - Smart Lock", time: "Tomorrow", color: "text-gray-400" },
                  { text: "Team meeting notes", time: "Tomorrow", color: "text-gray-400" },
                  { text: "Update project photos", time: "This Week", color: "text-gray-400" }
                ].map((task, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5 cursor-pointer"></div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium text-gray-800">{task.text}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${task.color}`}>{task.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ongoing Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><FolderPlus className="w-5 h-5 text-yellow-500" /> Ongoing Projects</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {[
                  { title: "Mr. Ramesh Residence", sub: "Interior & Automation", p: 65, img: "/project_interior_1790169331764.jpg" },
                  { title: "Blue Lotus Villa", sub: "Landscaping", p: 40, img: "/project_landscaping_1790169351850.jpg" },
                  { title: "Venkatesh Apartment", sub: "False Ceiling & Interior", p: 85, img: "/project_ceiling_1790169374938.jpg" },
                  { title: "Green View Villa", sub: "Pergola & Garden", p: 55, img: "/project_landscaping_1790169351850.jpg" }
                ].map((proj, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-gray-200 overflow-hidden relative flex-shrink-0">
                      <Image src={proj.img} alt={proj.title} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold text-[#111111] truncate">{proj.title}</span>
                      <span className="text-[10px] text-gray-500 truncate">{proj.sub}</span>
                    </div>
                    <div className="flex flex-col items-end w-20">
                      <span className="text-xs font-bold text-[#111111] mb-1">{proj.p}%</span>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${proj.p}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><Calendar className="w-5 h-5 text-yellow-500" /> Upcoming Events</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="p-5 flex flex-col gap-6">
                {[
                  { date: "23", month: "SEP", title: "Company Growth & Awards Meeting", time: "10:00 AM - 12:00 PM | Conference Hall" },
                  { date: "24", month: "SEP", title: "Product Training - FARE Panels", time: "4:00 PM - 7:00 PM | Google Meet" },
                  { date: "27", month: "SEP", title: "Quarterly Team Meet", time: "10:00 AM - 1:30 PM | Minion Office" },
                  { date: "01", month: "OCT", title: "Holiday - Ayudha Pooja", time: "Office Closed", isHoliday: true }
                ].map((ev, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                      <span className="text-xl font-black text-[#111111] leading-none">{ev.date}</span>
                      <span className="text-[10px] font-bold text-gray-500 mt-1">{ev.month}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${ev.isHoliday ? 'text-red-500' : 'text-[#111111]'}`}>{ev.title}</span>
                      <span className={`text-xs ${ev.isHoliday ? 'text-red-400 font-medium' : 'text-gray-500'}`}>{ev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Widget Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Learning & Growth */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><Library className="w-5 h-5 text-yellow-500" /> Learning & Growth</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                <div className="w-[120px] flex-shrink-0 snap-start flex flex-col gap-2 cursor-pointer group">
                  <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
                    <Image src="/learning_pare_1790177459122.jpg" alt="FARE" fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><PlayCircle className="w-6 h-6 text-white opacity-80" /></div>
                  </div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold text-[#111111] leading-tight">FARE Soffit Panels</span><span className="text-[9px] text-gray-500">Product Training</span></div>
                </div>
                <div className="w-[120px] flex-shrink-0 snap-start flex flex-col gap-2 cursor-pointer group">
                  <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
                    <Image src="/learning_auto_1790177976288.jpg" alt="Automation" fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><PlayCircle className="w-6 h-6 text-white opacity-80" /></div>
                  </div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold text-[#111111] leading-tight">Home Automation Basics</span></div>
                </div>
                <div className="w-[120px] flex-shrink-0 snap-start flex flex-col gap-2 cursor-pointer group">
                  <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
                    <Image src="/team_photo_1790176531800.jpg" alt="Communication" fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><PlayCircle className="w-6 h-6 text-white opacity-80" /></div>
                  </div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold text-[#111111] leading-tight">Customer Communication</span></div>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><Gift className="w-5 h-5 text-yellow-500" /> Rewards & Milestones</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View Details <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-4xl border border-gray-200">🏍️</div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Your Next Milestone</span>
                  <span className="text-sm font-bold text-[#111111]">Bike Eligibility</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full w-[78%]"></div>
                    </div>
                    <span className="text-xs font-bold text-[#111111]">78%</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]"><div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" /> Employee Base</div><span className="font-bold text-[#111111]">5 / 5 ✓</span></div>
                <div className="flex items-center justify-between text-[11px]"><div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" /> Impact Points</div><span className="font-bold text-[#111111]">42 / 50</span></div>
                <div className="flex items-center justify-between text-[11px]"><div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" /> Staff/End Meetings</div><span className="font-bold text-[#111111]">61 / 70</span></div>
              </div>
            </div>

            {/* Impact & Wellbeing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-[#111111]"><Activity className="w-5 h-5 text-yellow-500" /> Impact & Wellbeing</div>
                <button className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 hover:text-[#111111]">View All <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Heart className="w-4 h-4 text-gray-700" /></div>
                    <div className="flex flex-col"><span className="text-lg font-black text-[#111111] leading-none">38</span><span className="text-[10px] text-gray-500 font-bold">Impact Points</span></div>
                  </div>
                  <span className="text-xs font-bold text-green-500">+ 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Cake className="w-4 h-4 text-gray-700" /></div>
                    <div className="flex flex-col"><span className="text-lg font-black text-[#111111] leading-none">5</span><span className="text-[10px] text-gray-500 font-bold">Wellness Activities</span></div>
                  </div>
                  <span className="text-xs font-bold text-green-500">+ 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Activity className="w-4 h-4 text-gray-700" /></div>
                    <div className="flex flex-col"><span className="text-lg font-black text-[#111111] leading-none">12</span><span className="text-[10px] text-gray-500 font-bold">Volunteering Hours</span></div>
                  </div>
                  <span className="text-xs font-bold text-green-500">+ 3</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
