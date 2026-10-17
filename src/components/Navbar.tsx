import React, { useState, useEffect } from 'react';
import {
  Compass,
  Bookmark,
  ShieldCheck,
  Search,
  Menu,
  X,
  Lock,
  Unlock,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { getSavedScholarships, subscribeToSavedItems } from '../utils/storage';
import { checkAdminStatus } from '../services/api';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activePage: 'home' | 'explore' | 'saved' | 'admin' | 'tests';
  onNavigate: (page: 'home' | 'explore' | 'saved' | 'admin' | 'tests') => void;
  onOpenSearchFocus?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate, onOpenSearchFocus }) => {
  const [savedCount, setSavedCount] = useState<number>(() => getSavedScholarships().length);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToSavedItems(() => {
      setSavedCount(getSavedScholarships().length);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    checkAdminStatus().then((status) => {
      setIsAdminAuthenticated(status.authenticated);
    });
  }, [activePage]);

  interface NavItem {
    id: 'home' | 'explore' | 'saved' | 'admin' | 'tests';
    label: string;
    badge?: number | null;
    badgeText?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }

  const navLinks: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore Scholarships' },
    {
      id: 'saved',
      label: 'My Scholarships',
      badge: savedCount > 0 ? savedCount : null,
      icon: Bookmark,
    },
    { id: 'tests', label: 'Test Suite', icon: CheckCircle2 },
    {
      id: 'admin',
      label: 'Admin Portal',
      icon: isAdminAuthenticated ? Unlock : Lock,
      badgeText: isAdminAuthenticated ? 'Auth' : undefined,
    },
  ];

  const handleNavClick = (page: 'home' | 'explore' | 'saved' | 'admin' | 'tests') => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 -ml-1"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
              <Compass className="w-5 h-5 text-teal-400 transition-transform group-hover:rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Scholarship<span className="text-teal-600">Atlas</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded">
                  Free Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
                Global Fully Funded Discovery
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-teal-300'
                          : item.id === 'admin' && isAdminAuthenticated
                          ? 'text-teal-600'
                          : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-xs font-semibold rounded-full ${
                        isActive ? 'bg-teal-500 text-slate-900' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.badgeText && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-100 text-teal-800">
                      {item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={() => {
                if (activePage !== 'explore') {
                  onNavigate('explore');
                }
                if (onOpenSearchFocus) {
                  setTimeout(onOpenSearchFocus, 100);
                }
              }}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search scholarships...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-teal-300' : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                      {item.badge}
                    </span>
                  )}
                  {item.badgeText && (
                    <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-teal-100 text-teal-800">
                      {item.badgeText}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-slate-100">
            <PWAInstallButton variant="mobile" />
          </div>
        </div>
      )}
    </header>
  );
};
