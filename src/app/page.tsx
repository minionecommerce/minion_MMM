import { requirePageAccess } from "@/lib/auth";
import MinionJourneySection from '../features/home/components/MinionJourneySection';
import Image from "next/image";
import Link from "next/link";
import {
  Search, Bell, Home, Briefcase, Users, LayoutDashboard, Target, Activity, FileText, Gift, Library, ArrowRight, ArrowUpRight, Calendar, Clock, Link as LinkIcon, Building2, PaintBucket, TreePine, Crown, CheckCircle2, ChevronRight, PlusSquare, FilePlus, MapPin, FolderPlus, CreditCard, BookOpen, Sprout, Handshake, Settings, Lightbulb, TrendingUp, Heart, BadgeCheck, Leaf, Trophy, Check, MonitorPlay, Laptop, Cake, Medal, UserPlus, Award, BarChart
} from "lucide-react";

export default async function CoordinatorDashboard() {
  await requirePageAccess(["dashboard"]);
  return (
    <div className="w-full min-h-screen font-sans selection:bg-yellow-500 selection:text-black flex flex-col">

      <div className="bg-[#111111] text-white w-full flex-1 flex flex-col">
        {/* Main Content Area */}
        <main className="w-full max-w-[1600px] mx-auto">
          {/* Hero Section */}
          <section className="relative w-full h-[550px] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/dashboard/hero.jpg"
                alt="Modern Smart Home at Dusk"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-10 pt-10">
              <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-gray-300 mb-6 uppercase">
                <span>People</span>
                <span className="text-yellow-500">|</span>
                <span>Projects</span>
                <span className="text-yellow-500">|</span>
                <span>Innovation</span>
                <span className="text-yellow-500">|</span>
                <span>Sustainability</span>
                <span className="text-yellow-500">|</span>
                <span>A Smarter Tomorrow</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white max-w-2xl leading-[1.1] mb-6">
                Build Better Spaces <br />
                For A <span className="text-yellow-500">Smarter</span> <br />
                <span className="text-yellow-500">Tomorrow.</span>
              </h1>

              <p className="text-lg text-gray-300 max-w-xl mb-12">
                Together we create smarter homes, greener spaces <br />
                and happier lives.
              </p>

              {/* Bottom Hero Features */}
              <div className="absolute bottom-8 left-10 right-10 flex items-end justify-between">
                <div className="flex items-center gap-12">
                  <div className="flex items-center gap-3">
                    <Home className="w-8 h-8 text-yellow-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">SMART HOMES</span>
                      <span className="text-[10px] text-gray-400">Automation for<br />a better living</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-yellow-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">INTERIORS</span>
                      <span className="text-[10px] text-gray-400">Beautiful spaces<br />that inspire</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sprout className="w-8 h-8 text-yellow-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">LANDSCAPING</span>
                      <span className="text-[10px] text-gray-400">Greener spaces<br />for brighter days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-yellow-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">OUR PEOPLE</span>
                      <span className="text-[10px] text-gray-400">The true strength<br />of Minion</span>
                    </div>
                  </div>
                </div>

                {/* Script Text right side */}
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-serif italic text-white/80 opacity-70 mb-2 transform -rotate-3 translate-y-4">
                    One <br />Team <br />Many <br />Possibilities
                  </div>
                </div>
              </div>

              {/* Logo Watermark right side bottom */}
              <div className="absolute right-10 bottom-12 flex flex-col items-center bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 hidden lg:flex">
                <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00" />
                </svg>
                <span className="text-lg font-bold leading-none tracking-wide text-white mt-2">MINION</span>
                <span className="text-[8px] text-gray-300 font-medium tracking-widest mt-1">SMART HOME SOLUTIONS</span>
              </div>

            </div>
          </section>

          <div className="px-10 pb-10">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 relative z-20">
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg text-black group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Today's Tasks</div>
                    <div className="text-2xl font-bold leading-none mt-1">8</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      3 Completed <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> 2</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg text-black group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Active Projects</div>
                    <div className="text-2xl font-bold leading-none mt-1">12</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      3 On Track <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> 2</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg text-black group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">New Leads</div>
                    <div className="text-2xl font-bold leading-none mt-1">15</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      5 Follow-ups <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> 3</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg text-black group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">My Performance</div>
                    <div className="text-2xl font-bold leading-none mt-1">92%</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      This Month <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> 8%</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg text-black group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rewards Progress</div>
                    <div className="text-2xl font-bold leading-none mt-1">60%</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      Next Milestone <span className="text-gray-400 flex items-center ml-1"><ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>

              {/* Card 6 - Date */}
              <div className="bg-yellow-400 rounded-xl p-4 flex flex-col justify-center shadow-lg text-black cursor-pointer hover:-translate-y-1 transition-transform overflow-hidden relative">
                <div className="flex items-center gap-3 z-10">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Wednesday</div>
                    <div className="text-xl font-bold leading-none mt-1">23 Sep 2026</div>
                  </div>
                </div>
                <div className="text-[11px] font-medium mt-2 z-10 opacity-80">
                  Good Afternoon,<br />Let's make progress today!
                </div>
                {/* Background accent */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-300 rounded-full blur-2xl opacity-50"></div>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

              {/* My Tasks (Col span 3) */}
              <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">My Tasks</h3>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-yellow-500 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    { title: "Follow up with Mr. Kumar (Interior)", time: "Today", highlight: true },
                    { title: "Site measurement - Anna Nagar", time: "Today", highlight: true },
                    { title: "Send revised quotation - Smart Lock", time: "Tomorrow", highlight: false },
                    { title: "Team meeting notes", time: "Tomorrow", highlight: false },
                    { title: "Update project photos", time: "This Week", highlight: false },
                  ].map((task, i) => (
                    <div key={i} className="flex items-start justify-between group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 ${task.highlight ? 'border-yellow-500' : 'border-gray-500 group-hover:border-yellow-500'} transition-colors`}></div>
                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-tight">{task.title}</span>
                      </div>
                      <span className={`text-[10px] whitespace-nowrap ml-2 ${task.highlight ? 'text-yellow-500' : 'text-gray-500'}`}>{task.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ongoing Projects (Col span 4) */}
              <div className="lg:col-span-4 bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-white">
                    <Building2 className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Ongoing Projects</h3>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-yellow-500 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { name: "Mr. Ramesh Residence", desc: "Interior & Automation", progress: 65, img: "/dashboard/interior.jpg" },
                    { name: "Blue Lotus Villa", desc: "Landscaping", progress: 40, img: "/dashboard/landscaping.jpg" },
                    { name: "Venkatesh Apartment", desc: "False Ceiling & Interior", progress: 80, img: "/dashboard/ceiling.jpg" },
                  ].map((project, i) => (
                    <div key={i} className="flex items-center gap-4 bg-[#222222] p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-md overflow-hidden relative flex-shrink-0 border border-white/10">
                        <Image src={project.img} alt={project.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{project.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{project.desc}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-white w-8 text-right">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Announcements (Col span 3) */}
              <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-white">
                    <Bell className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-sm">Company Announcements</h3>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-yellow-500 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { title: "Monthly Growth & Awards Meeting", time: "27 Sep 2026, 10:00 AM", icon: Calendar },
                    { title: "New Product Training - PARE Panels", time: "24 Sep 2026, 6:00 PM", icon: Calendar },
                    { title: "Employee Wellness Program", time: "Details Coming Soon", icon: Users },
                  ].map((announcement, i) => {
                    const Icon = announcement.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 group cursor-pointer">
                        <div className="mt-0.5 text-yellow-500 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-300 group-hover:text-yellow-400 transition-colors">{announcement.title}</span>
                          <span className="text-[10px] text-gray-500 mt-1">{announcement.time}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-600 ml-auto mt-1 group-hover:text-yellow-500" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links (Col span 2) */}
              <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-2 text-white mb-5">
                  <LinkIcon className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-semibold text-sm">Quick Links</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Create Lead", icon: PlusSquare },
                    { name: "Add Task", icon: FilePlus },
                    { name: "Log Site Visit", icon: MapPin },
                    { name: "New Project", icon: FolderPlus },
                    { name: "Request Payment", icon: CreditCard },
                    { name: "Knowledge Base", icon: BookOpen },
                  ].map((link, i) => {
                    const Icon = link.icon;
                    return (
                      <button key={i} className="flex flex-col items-center justify-center gap-2 p-3 bg-[#222222] border border-white/5 rounded-lg hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all text-gray-400 group">
                        <Icon className="w-5 h-5 group-hover:text-black text-gray-300 transition-colors" />
                        <span className="text-[9px] font-medium text-center leading-tight transition-colors">{link.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer Section */}
            <footer className="mt-6 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-6 pb-6 relative">
              <div className="flex flex-col">
                <p className="text-xl font-serif italic text-gray-300 max-w-md leading-snug">
                  "Small efforts every day create extraordinary results."
                </p>
                <span className="text-xs text-yellow-500 mt-2 font-medium">— Minion Culture</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">TRUST</span>
                    <span className="text-[8px] text-gray-500 uppercase">In Every Relationship</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">QUALITY</span>
                    <span className="text-[8px] text-gray-500 uppercase">In Every Detail</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">PEOPLE</span>
                    <span className="text-[8px] text-gray-500 uppercase">In Every Success</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">A GREENER</span>
                    <span className="text-[8px] text-gray-500 uppercase">Tomorrow</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 md:mt-0 right-0 bottom-6 md:absolute">
                <div className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase">
                  Spaces <span className="text-yellow-500 mx-2">|</span> People <span className="text-yellow-500 mx-2">|</span> Possibilities
                </div>
                <div className="w-8 h-1 bg-yellow-500 rounded-full"></div>
              </div>
            </footer>

          </div>
        </main>
      </div>

      {/* Company Culture & Updates Section */}
      <section className="w-full bg-[#f9fafc] text-[#1a1a1a] pb-20 font-sans selection:bg-yellow-500 selection:text-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16">

          {/* Culture Hero */}
          <div className="flex flex-col items-start lg:flex-row justify-between lg:items-end mb-12">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">
                <span>People</span>
                <span className="text-gray-300">|</span>
                <span>Projects</span>
                <span className="text-gray-300">|</span>
                <span>Smarter Living</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#111111] leading-tight mb-2 tracking-tight">
                Together We Build<br />
                <span className="text-yellow-500">Smarter Spaces</span>
              </h2>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Homes. Offices. Communities. A Better Tomorrow.</h3>
              <p className="text-sm text-gray-600 max-w-md">
                At Minion, every idea, effort and collaboration creates smarter homes and happier lives.
              </p>
            </div>
            <div className="hidden lg:block text-3xl font-serif italic text-gray-300 opacity-60 transform -rotate-6 mt-6 lg:mt-0">
              One <br />Team <br />Many <br />Possibilities
            </div>
          </div>

          {/* Value Icons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {[
              { label: "Customer\nFirst", icon: Target },
              { label: "Work\nTogether", icon: Users },
              { label: "Deliver\nQuality", icon: Settings },
              { label: "Innovate\nAlways", icon: Lightbulb, iconColor: "text-yellow-500 fill-yellow-500" },
              { label: "Build\nSustainably", icon: Leaf },
              { label: "Grow\nTogether", icon: BarChart },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-yellow-50 transition-colors">
                  <item.icon className={`w-6 h-6 transition-colors ${item.iconColor || "text-gray-900 group-hover:text-yellow-500"}`} />
                </div>
                <span className="text-[11px] font-bold text-gray-800 whitespace-pre-line leading-tight">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Team Banner */}
          <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-16 shadow-lg">
            <Image
              src="/dashboard/team_photo.jpg"
              alt="Minion Team"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60"></div>

            <div className="absolute top-8 left-0 right-0 flex justify-center">
              <div className="flex flex-col items-center">
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
                  <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00" />
                </svg>
                <span className="text-sm font-bold text-white tracking-widest mt-1">MINION</span>
              </div>
            </div>

            <div className="absolute left-8 md:left-12 bottom-12 flex flex-col">
              <span className="text-xl md:text-3xl font-black text-white leading-tight">
                SMART<br />HOMES<br />BEAUTIFUL<br />SPACES<br />HAPPIER<br />PEOPLE
              </span>
              <div className="w-12 h-1.5 bg-yellow-500 mt-4 rounded-full"></div>
            </div>

            <div className="absolute right-8 md:right-12 top-1/3 flex flex-col text-right">
              <span className="text-lg md:text-xl font-bold text-gray-200 leading-relaxed tracking-wider">
                IDEAS<br />DESIGN<br />AUTOMATE<br />BUILD<br />GROW
              </span>
            </div>
          </div>

          {/* Founder Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            <div className="lg:col-span-4 relative rounded-3xl overflow-hidden h-[400px] shadow-lg group">
              <Image
                src="/dashboard/founder.jpg"
                alt="Sivabalan Subramanian"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              <div className="absolute top-8 right-8 text-white/80 font-serif italic text-3xl text-right leading-tight transform rotate-[-5deg]">
                Let's <br />Build a <br />Smarter <br />Tomorrow
              </div>

              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="font-bold text-sm tracking-widest uppercase">SIVABALAN SUBRAMANIAN</h4>
                <p className="text-[10px] text-gray-300 mt-0.5">Founder & Managing Director</p>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col justify-center">
              <h3 className="text-2xl font-black mb-3">Message From <span className="text-yellow-500">Our Founder</span></h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8 max-w-3xl">
                At Minion Smart Home Solutions, we don't just build spaces, we build better lives. Every role, every idea and every effort matters. Together let's create smarter homes, greener spaces and happier communities.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50/50 rounded-2xl p-6 border border-yellow-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-bold text-sm text-gray-900 tracking-widest uppercase">OUR VALUES</h4>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {[
                      "Integrity in everything we do",
                      "Customer first",
                      "Teamwork and respect",
                      "Continuous learning",
                      "Sustainable growth"
                    ].map((val, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-yellow-500" /> {val}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
                    <Trophy className="w-6 h-6 text-black mt-1" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 tracking-widest uppercase mb-1">OUR VISION</h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed">To be the most trusted and preferred brand for smart living solutions in India.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
                    <Target className="w-6 h-6 text-black mt-1" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 tracking-widest uppercase mb-1">OUR MISSION</h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed">To deliver innovative, sustainable and high-quality solutions that enhance everyday living.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Spotlight & Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
            <div className="flex flex-col">
              <span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full w-fit tracking-wider uppercase mb-4">Employee Spotlight</span>
              <h3 className="text-4xl md:text-5xl font-black text-[#111111] leading-tight mb-4">
                Great People <br />Build <span className="text-yellow-500">Great Spaces</span>
              </h3>
              <p className="text-gray-600 text-sm mb-8 max-w-md">
                Meet the people who make Minion stronger. Your ideas, dedication and teamwork drive our success.
              </p>
              <button className="bg-[#111111] text-white px-6 py-3 rounded-full text-xs font-bold w-fit hover:bg-gray-800 transition-colors flex items-center gap-2">
                Meet Our Team <ArrowRight className="w-3 h-3" />
              </button>

              <div className="flex flex-wrap gap-4 mt-10">
                {[
                  { label: "Birthdays", icon: Cake },
                  { label: "Work Anniversaries", icon: Medal },
                  { label: "New Joiners", icon: UserPlus },
                  { label: "Achievements", icon: Award }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-[10px] font-semibold text-gray-700 shadow-sm cursor-pointer hover:border-yellow-400 hover:text-black transition-colors">
                    <item.icon className="w-3 h-3 text-gray-400" /> {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">
              <div className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">THIS MONTH</div>
              <h4 className="text-lg font-black text-gray-900 mb-8">Team Progress</h4>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Circular Chart Placeholder */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="20.096" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 leading-none">92%</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Overall</span>
                  </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-4">
                  {[
                    { label: "Leads", icon: Users, progress: 85, color: "bg-gray-800" },
                    { label: "Projects", icon: Building2, progress: 90, color: "bg-yellow-500" },
                    { label: "Tasks", icon: CheckCircle2, progress: 76, color: "bg-gray-800" },
                    { label: "Customer Satisfaction", icon: Heart, progress: 95, color: "bg-yellow-500" },
                  ].map((bar, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <bar.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex flex-col flex-1 gap-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-700">{bar.label}</span>
                          <span className="text-gray-900">{bar.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-6 right-6 font-serif italic text-xl text-gray-300 transform -rotate-3 opacity-60">
                Small Efforts <br /> Extraordinary Results
              </div>
            </div>
          </div>

          {/* Updates & Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400 p-2 rounded-lg">
                    <Bell className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Latest Updates</h3>
                    <p className="text-[10px] text-gray-500">Stay informed. Stay aligned. Stay ahead.</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-gray-500 flex items-center gap-1 hover:text-black transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { title: "New Product Training - PARE Panels", desc: "Learn about the latest PARE walls, fluted and louver panels.", tag: "Training", date: "24 Sep 2026", img: "/dashboard/thumb_training.jpg" },
                  { title: "Monthly Growth & Awards Meeting", desc: "Join us for our monthly review and celebrations.", tag: "Company", date: "27 Sep 2026", img: "/dashboard/thumb_growth.jpg" },
                  { title: "Employee Wellness Program", desc: "Your health and happiness matters.", tag: "Wellness", date: "30 Sep 2026", img: "/dashboard/thumb_wellness.jpg" },
                  { title: "New CRM Workflow Update", desc: "Improved lead to project flow for better collaboration.", tag: "System", date: "02 Oct 2026", img: "/dashboard/thumb_system.jpg" },
                ].map((update, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-24 h-16 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image src={update.img} alt={update.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-gray-900 truncate mb-0.5">{update.title}</h4>
                      <p className="text-[10px] text-gray-500 truncate mb-2">{update.desc}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
                          <Calendar className="w-3 h-3" /> {update.date}
                        </span>
                        <span className="bg-yellow-50 text-yellow-700 text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{update.tag}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 mr-2 group-hover:text-yellow-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#1A1A1A] rounded-3xl p-6 shadow-xl flex flex-col text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-black" />
                </div>
                <h3 className="text-base font-black">Important Announcements</h3>
              </div>

              <div className="flex flex-col gap-5 flex-1">
                {[
                  { day: "23", month: "SEP", title: "Company Growth & Awards Meeting", time: "10:00 AM - 12:00 PM", loc: "Conference Hall", highlight: true },
                  { day: "24", month: "SEP", title: "New Product Training - PARE Panels", time: "6:00 PM - 7:00 PM", loc: "Online (Google Meet)", highlight: true },
                  { day: "27", month: "SEP", title: "Quarterly Team Meet", time: "10:00 AM - 1:00 PM", loc: "Minion Office", highlight: false },
                  { day: "01", month: "OCT", title: "Holiday - Ayudha Pooja", time: "Office Closed", loc: "", highlight: false, red: true },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex flex-col items-center justify-center border border-white/10 rounded-xl w-12 h-12 flex-shrink-0 bg-white/5">
                      <span className={`text-lg font-black leading-none ${item.highlight ? 'text-yellow-500' : (item.red ? 'text-red-500' : 'text-white')}`}>{item.day}</span>
                      <span className="text-[8px] font-bold text-gray-400 tracking-wider mt-0.5">{item.month}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-white mb-0.5 group-hover:text-yellow-400 transition-colors">{item.title}</h4>
                      {item.red ? (
                        <p className="text-[10px] text-red-400 font-medium">{item.time}</p>
                      ) : (
                        <>
                          <p className="text-[10px] text-gray-400">{item.time}</p>
                          <p className="text-[10px] text-gray-500">{item.loc}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2">
                View All Announcements <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </section>

      <MinionJourneySection />

      {/* New Global Footer */}
      <footer className="relative w-full overflow-hidden mt-0">
        {/* Top Dark Image Section */}
        <div className="relative w-full h-[400px]">
          <Image
            src="/hero-bg-dusk.jpg"
            alt="Smart Spaces"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70"></div>

          <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">

              <div className="flex flex-col">
                <span className="text-white/80 font-bold tracking-widest text-sm mb-1 uppercase">SMART SPACES</span>
                <span className="text-white font-black tracking-widest text-xl mb-4 uppercase">BRIGHTER TOMORROWS</span>
                <div className="w-12 h-1.5 bg-yellow-500 rounded-full"></div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                {[
                  { label: "Homes\nFor Families", icon: Home },
                  { label: "Spaces\nFor Businesses", icon: Building2 },
                  { label: "Greener\nCommunities", icon: Sprout },
                  { label: "Happier\nLives", icon: Heart }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 text-center group cursor-pointer hover:-translate-y-1 transition-transform">
                    <item.icon className="w-8 h-8 text-white group-hover:text-yellow-500 transition-colors" />
                    <span className="text-white font-medium text-xs whitespace-pre-line group-hover:text-yellow-500 transition-colors">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl text-white font-serif italic transform -rotate-3">#TeamMinion</span>
                <div className="w-48 h-1 bg-yellow-500 mt-2 transform -rotate-3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Black Bar */}
        <div className="bg-[#111111] w-full py-10 border-t-2 border-yellow-500">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
                <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00" />
              </svg>
              <div className="flex flex-col">
                <span className="text-white font-black text-xl tracking-widest leading-none">MINION</span>
                <span className="text-gray-400 text-[8px] uppercase tracking-widest mt-1">SMART HOME SOLUTIONS</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
              <span className="hover:text-white cursor-pointer transition-colors">People</span>
              <span className="text-gray-600">|</span>
              <span className="hover:text-white cursor-pointer transition-colors">Projects</span>
              <span className="text-gray-600">|</span>
              <span className="hover:text-white cursor-pointer transition-colors">Innovation</span>
              <span className="text-gray-600">|</span>
              <span className="hover:text-white cursor-pointer transition-colors">Sustainability</span>
              <span className="text-gray-600">|</span>
              <span className="hover:text-white cursor-pointer transition-colors">A Smarter Tomorrow</span>
            </div>

            <div className="text-2xl md:text-3xl text-gray-300 font-serif italic opacity-70 transform -rotate-6">
              Build <br /> Smarter <br /> Together
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
