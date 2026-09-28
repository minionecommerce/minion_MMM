import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  Bell, 
  Home, 
  Briefcase, 
  Users, 
  LayoutDashboard, 
  Target, 
  Activity, 
  FileText, 
  Gift, 
  Library, 
  ArrowRight, 
  ArrowUpRight,
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  Building2, 
  PaintBucket, 
  TreePine, 
  Crown,
  CheckCircle2,
  ChevronRight,
  PlusSquare,
  FilePlus,
  MapPin,
  FolderPlus,
  CreditCard,
  BookOpen,
  Sprout,
  Handshake,
  Settings
} from "lucide-react";

export default function CoordinatorDashboard() {
  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111111]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round"/>
                <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none tracking-wide text-white">MINION</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest mt-0.5">SMART HOME SOLUTIONS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-semibold tracking-wider text-gray-400">
            <Link href="#" className="flex flex-col items-center gap-1.5 text-yellow-500">
              <Home className="w-5 h-5" />
              <span>HOME</span>
              <div className="h-0.5 w-full bg-yellow-500 rounded-t-full mt-1"></div>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <Briefcase className="w-5 h-5" />
              <span>MY WORK</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <Target className="w-5 h-5" />
              <span>CRM</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <LayoutDashboard className="w-5 h-5" />
              <span>PROJECTS</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <TreePine className="w-5 h-5" />
              <span>PARKS</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <CheckCircle2 className="w-5 h-5" />
              <span>TASKS</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <Users className="w-5 h-5" />
              <span>TEAM</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <BookOpen className="w-5 h-5" />
              <span>LEARNING</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <Gift className="w-5 h-5" />
              <span>REWARDS</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1.5 hover:text-white transition-colors pb-1.5">
              <Library className="w-5 h-5" />
              <span>RESOURCES</span>
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 border-l border-white/10 pl-6 cursor-pointer">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
              <Image 
                src="/dashboard/profile.jpg" 
                alt="Dinesh" 
                width={36} 
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Welcome,</span>
              <span className="text-sm font-semibold text-white">Dinesh</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <section className="relative w-full h-[450px] overflow-hidden">
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
              Build Better Spaces <br/>
              For A <span className="text-yellow-500">Smarter</span> <br/>
              <span className="text-yellow-500">Tomorrow.</span>
            </h1>
            
            <p className="text-lg text-gray-300 max-w-xl mb-12">
              Together we create smarter homes, greener spaces <br/>
              and happier lives.
            </p>

            {/* Bottom Hero Features */}
            <div className="absolute bottom-8 left-10 right-10 flex items-end justify-between">
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-3">
                  <Home className="w-8 h-8 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">SMART HOMES</span>
                    <span className="text-[10px] text-gray-400">Automation for<br/>a better living</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">INTERIORS</span>
                    <span className="text-[10px] text-gray-400">Beautiful spaces<br/>that inspire</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sprout className="w-8 h-8 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">LANDSCAPING</span>
                    <span className="text-[10px] text-gray-400">Greener spaces<br/>for brighter days</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">OUR PEOPLE</span>
                    <span className="text-[10px] text-gray-400">The true strength<br/>of Minion</span>
                  </div>
                </div>
              </div>

              {/* Script Text right side */}
              <div className="flex flex-col items-end">
                <div className="text-3xl font-serif italic text-white/80 opacity-70 mb-2 transform -rotate-3 translate-y-4">
                  One <br/>Team <br/>Many <br/>Possibilities
                </div>
              </div>
            </div>
            
            {/* Logo Watermark right side bottom */}
            <div className="absolute right-10 bottom-12 flex flex-col items-center bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 hidden lg:flex">
                <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15L85 85H15L50 15Z" stroke="#FFCC00" strokeWidth="4" strokeLinejoin="round"/>
                  <path d="M50 35L70 75H30L50 35Z" fill="#FFCC00"/>
                </svg>
                <span className="text-lg font-bold leading-none tracking-wide text-white mt-2">MINION</span>
                <span className="text-[8px] text-gray-300 font-medium tracking-widest mt-1">SMART HOME SOLUTIONS</span>
            </div>

          </div>
        </section>

        <div className="px-10 pb-10">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 -mt-8 relative z-20">
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
                    3 Completed <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> 2</span>
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
                    3 On Track <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> 2</span>
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
                    5 Follow-ups <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> 3</span>
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
                    This Month <span className="text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> 8%</span>
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
                    Next Milestone <span className="text-gray-400 flex items-center ml-1"><ArrowRight className="w-3 h-3"/></span>
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
                Good Afternoon,<br/>Let's make progress today!
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
  );
}