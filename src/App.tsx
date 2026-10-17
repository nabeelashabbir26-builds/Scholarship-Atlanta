import React, { useState, useEffect, useCallback } from 'react';
import { FilterState, Scholarship, DegreeLevel } from './types/scholarship';
import { fetchScholarships } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SavedScholarshipsView } from './components/SavedScholarshipsView';
import { AdminDashboard } from './components/AdminDashboard';
import { TestRunner } from './components/TestRunnerModal';
import { ScholarshipDetailModal } from './components/ScholarshipDetailModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_SCHOLARSHIPS } from './data/initialScholarships';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  applicantNationality: '',
  destinationCountry: '',
  degreeLevels: [],
  subjects: [],
  fundingRequirements: {
    mustCoverTuition: false,
    mustCoverStipend: false,
    mustCoverTravel: false,
    mustCoverAccommodation: false,
    mustBeFullyFundedVerified: false,
  },
  deadlineFilter: 'all',
  includeExpired: false, // Requirement 4: Expired hidden by default
  onlyVerified: false,
  includeSampleRecords: true,
};

export default function App() {
  const [activePage, setActivePage] = useState<'home' | 'explore' | 'saved' | 'admin' | 'tests'>('home');
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => INITIAL_SCHOLARSHIPS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchScholarships();
      if (Array.isArray(data) && data.length > 0) {
        setScholarships(data);
      }
    } catch (e) {
      console.warn('Error loading scholarships:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global hotkey: Cmd/Ctrl + K to navigate to Explore with search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActivePage('explore');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHeroFilterPreset = (preset: {
    searchQuery?: string;
    applicantNationality?: string;
    destinationCountry?: string;
    degreeLevels?: DegreeLevel[];
    deadlineFilter?: 'all' | 'open_only' | 'closing_soon';
  }) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: preset.searchQuery ?? prev.searchQuery,
      applicantNationality: preset.applicantNationality ?? prev.applicantNationality,
      destinationCountry: preset.destinationCountry ?? prev.destinationCountry,
      degreeLevels: preset.degreeLevels ?? prev.degreeLevels,
      deadlineFilter: preset.deadlineFilter ?? prev.deadlineFilter,
    }));
    setActivePage('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearchFocus={() => {
          setActivePage('explore');
        }}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            scholarships={scholarships}
            onViewDetails={(s) => setSelectedScholarship(s)}
            onExploreFilter={handleHeroFilterPreset}
          />
        )}

        {activePage === 'explore' && (
          <ExplorePage
            scholarships={scholarships}
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            onViewDetails={(s) => setSelectedScholarship(s)}
          />
        )}

        {activePage === 'saved' && (
          <SavedScholarshipsView
            scholarships={scholarships}
            onViewDetails={(s) => setSelectedScholarship(s)}
            onExploreMore={() => setActivePage('explore')}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            scholarships={scholarships}
            onRefreshData={loadData}
            onViewDetails={(s) => setSelectedScholarship(s)}
          />
        )}

        {activePage === 'tests' && <TestRunner scholarships={scholarships} />}
      </main>

      {/* Detail Modal */}
      {selectedScholarship && (
        <ScholarshipDetailModal
          scholarship={selectedScholarship}
          initialNationality={filters.applicantNationality}
          onClose={() => setSelectedScholarship(null)}
        />
      )}

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Platform Footer */}
      <Footer onNavigate={(page) => {
        setActivePage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}
