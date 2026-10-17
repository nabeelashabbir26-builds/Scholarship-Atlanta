import React from 'react';
import { Compass, ShieldCheck, ExternalLink, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  onNavigate: (page: 'home' | 'explore' | 'saved' | 'admin' | 'tests') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Compass className="w-5 h-5 text-teal-400" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Scholarship<span className="text-teal-400">Atlas</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              A transparent, zero-fee global discovery platform dedicated exclusively to legitimate fully funded scholarships for international students. Every opportunity is grounded in verified official sources and detailed funding breakdowns.
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Our Integrity Guarantee</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We never charge students for access, never fabricate university logos or statistics, and never claim an opportunity is fully funded unless verified by official terms.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-teal-400 transition-colors"
                >
                  All Verified Scholarships
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('saved')}
                  className="hover:text-teal-400 transition-colors"
                >
                  My Saved & Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tests')}
                  className="hover:text-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Verification Test Suite</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-teal-900 text-teal-300 rounded">10/10 Tests</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Editorial Admin Dashboard
                </button>
              </li>
              <li className="pt-2">
                <PWAInstallButton variant="card" />
              </li>
              <li className="pt-1">
                <a
                  href="/api/download-zip"
                  download="scholarship-atlas.zip"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Download Codebase (.ZIP)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Student Advisory & Privacy */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Student Advisory
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Scholarship applications are always submitted through the official government or university portals. Real scholarships will <strong className="text-slate-200">never</strong> ask you to pay an application fee.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/80">
              <p>Reference date: October 2026</p>
              <p className="mt-1">Saved items stored privately in your browser storage.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Scholarship Atlas. Built for global students with transparent public education data.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <span>Made for equal educational access</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
