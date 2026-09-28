'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, ArrowRight, Search } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  sectionId?: string;
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', sectionId: 'home' },
  { label: 'About Us', href: '/#about', hasDropdown: true },
  { label: 'Automation', href: '/#smart-home', hasDropdown: true },
  { label: 'Interior Design', href: '/#interiors', hasDropdown: true },
  { label: 'More', href: '#', hasDropdown: true },
  { label: 'Contact', href: '/contact' },
];

function useScrolled(threshold = 20): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, [threshold]);
  return scrolled;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled(20);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const reducedMotion = useReducedMotion();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const onNavClick = useCallback(
    (e: React.MouseEvent, item: NavItem) => {
      setMenuOpen(false);
      if (item.href === '/' && isHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        return;
      }
      if (isHome && item.sectionId) {
        e.preventDefault();
        document.getElementById(item.sectionId)?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      }
    },
    [isHome, reducedMotion],
  );

  const dur = reducedMotion ? 0 : 0.3;
  const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300 ease-in-out',
          scrolled ? 'bg-black/95 backdrop-blur-xl shadow-lg border-b border-white/10' : 'bg-transparent',
        ].join(' ')}
      >
        <div className="w-full max-w-full mx-auto px-4 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => onNavClick(e, { label: 'Home', href: '/' })}
              className="flex items-center gap-3 flex-shrink-0 relative z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBB03B] rounded-sm group"
              aria-label="Minion - Return to home page"
            >
              {/* Geometric M Logo */}
              <svg width="48" height="48" viewBox="0 0 100 100" className="text-[#FBB03B] fill-current transform transition-transform group-hover:scale-105">
                {/* Center Triangle */}
                <path d="M50 15 L35 75 L65 75 Z" />
                {/* Left Triangle */}
                <path d="M30 75 L15 35 L0 75 Z" />
                {/* Right Triangle */}
                <path d="M70 75 L85 35 L100 75 Z" />
                {/* Bottom bars for structure */}
                <rect x="0" y="80" width="100" height="5" />
              </svg>
              <div className="flex flex-col pt-1">
                <span className="text-2xl font-black tracking-tight text-[#FBB03B] leading-none uppercase">Minion</span>
                <span className="text-[0.45rem] font-bold text-gray-400 tracking-wider leading-[1.2] mt-1 max-w-[160px] uppercase">
                  Smart Home Solutions<br/>And Landscaping Private Limited
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-8" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => onNavClick(e, item)}
                  className={[
                    'group relative py-2 text-sm font-medium tracking-wide rounded-lg flex items-center gap-1.5',
                    'transition-colors duration-300',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBB03B]',
                    scrolled ? 'text-gray-300 hover:text-white' : 'text-white hover:text-gray-200',
                  ].join(' ')}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-6">
                
                {/* Search Bar */}
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search the site..." 
                    className="w-48 xl:w-64 bg-white/10 border border-white/20 text-white text-sm rounded-full pl-5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c89f59] focus:bg-white/20 transition-all placeholder:text-gray-400"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
                </div>

                {/* Get In Touch Button */}
                <Link
                  href="/contact"
                  className="px-7 py-3 text-sm font-bold rounded-full bg-[#c89f59] text-white hover:bg-[#b58b4b] transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,159,89,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white flex items-center gap-2"
                >
                  Get In Touch <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                ref={toggleRef}
                onClick={() => setMenuOpen(prev => !prev)}
                className={["lg:hidden relative z-[60] w-11 h-11 flex items-center justify-center -mr-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBB03B] text-white"].join(' ')}
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                <div className="w-[20px] h-[14px] relative flex flex-col justify-between">
                  <motion.span
                    className="block h-[2px] rounded-full origin-center bg-current"
                    animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }}
                    transition={{ duration: dur, ease }}
                  />
                  <motion.span
                    className="block h-[2px] rounded-full origin-center bg-current"
                    animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0.3 : 1 }}
                    transition={{ duration: dur, ease }}
                  />
                  <motion.span
                    className="block h-[2px] rounded-full origin-center bg-current"
                    animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }}
                    transition={{ duration: dur, ease }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 z-40 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease }}
            role="dialog"
            aria-modal="true"
          >
            <div className="h-full flex flex-col pt-24 pb-10 px-6 sm:px-8 overflow-y-auto">
              
              <div className="mb-8">
                <input 
                  type="text" 
                  placeholder="Search the site..." 
                  className="w-full bg-white/10 border border-white/20 text-white text-base rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#c89f59]"
                />
              </div>

              <nav className="flex-1 flex flex-col justify-center -mt-10" aria-label="Mobile navigation">
                <ul className="space-y-2">
                  {NAV_ITEMS.map((item, i) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : i * 0.04, ease }}
                    >
                      <Link
                        href={item.href}
                        onClick={(e) => onNavClick(e, item)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl text-xl font-medium transition-colors duration-300 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        {item.label}
                        {item.hasDropdown && <ChevronDown className="w-5 h-5 opacity-50" />}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                className="pt-8 border-t border-white/10 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.25, ease }}
              >
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-base font-semibold text-white bg-[#c89f59] hover:bg-[#b58b4b] rounded-xl transition-colors duration-300"
                >
                  Get In Touch <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
