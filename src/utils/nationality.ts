import { NationalityEligibility, Scholarship } from '../types/scholarship';

export interface EligibilityResult {
  isEligible: boolean | null; // true: eligible, false: ineligible, null: unknown/unconfirmed
  statusLabel: 'Eligible (Worldwide)' | 'Eligible' | 'Ineligible' | 'Unconfirmed';
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  details: string;
}

/**
 * Standard list of countries for student discovery & filtering
 */
export const POPULAR_STUDENT_NATIONALITIES = [
  'India',
  'Nigeria',
  'Pakistan',
  'Bangladesh',
  'Indonesia',
  'Ghana',
  'Kenya',
  'Egypt',
  'Philippines',
  'Vietnam',
  'Brazil',
  'Mexico',
  'Colombia',
  'Turkey',
  'South Africa',
  'Nepal',
  'Sri Lanka',
  'Kazakhstan',
  'Ukraine',
  'Ethiopia',
  'Rwanda',
  'Tanzania',
  'Uzbekistan',
  'Morocco',
  'Malaysia',
  'Thailand',
  'China',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'South Korea',
] as const;

/**
 * Evaluates whether a student with a specific citizenship/nationality qualifies.
 *
 * Rules:
 * 1. Worldwide: All citizens qualify unless explicitly listed in ineligibleCountries.
 * 2. Selected: ONLY citizens whose country is in eligibleCountries qualify. Never assume eligibility by absence!
 * 3. Unknown: Status is unconfirmed. Do NOT assume eligibility.
 */
export function checkNationalityEligibility(
  scholarship: Pick<Scholarship, 'nationalityEligibility'>,
  studentNationality: string | null | undefined
): EligibilityResult {
  const eligibility = scholarship.nationalityEligibility;

  // If no student nationality is specified, show general policy
  if (!studentNationality || studentNationality.trim() === '') {
    if (eligibility.mode === 'worldwide') {
      return {
        isEligible: true,
        statusLabel: 'Eligible (Worldwide)',
        badgeStyle: {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        },
        details: 'Open to eligible applicants from any country worldwide.',
      };
    }
    if (eligibility.mode === 'selected') {
      const count = eligibility.eligibleCountries?.length || 0;
      return {
        isEligible: null,
        statusLabel: 'Unconfirmed',
        badgeStyle: {
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
        },
        details: `Specific to ${count} designated countries. Select your citizenship to check.`,
      };
    }
    return {
      isEligible: null,
      statusLabel: 'Unconfirmed',
      badgeStyle: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      },
      details: 'Official nationality guidelines require manual source review.',
    };
  }

  const cleanCountry = studentNationality.trim().toLowerCase();

  // Mode: Worldwide
  if (eligibility.mode === 'worldwide') {
    const isExcluded = eligibility.ineligibleCountries?.some(
      (c) => c.toLowerCase() === cleanCountry
    );

    if (isExcluded) {
      return {
        isEligible: false,
        statusLabel: 'Ineligible',
        badgeStyle: {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
        },
        details: `Citizens of ${studentNationality} are specifically excluded by the provider.`,
      };
    }

    return {
      isEligible: true,
      statusLabel: 'Eligible (Worldwide)',
      badgeStyle: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      },
      details: `Open worldwide. Citizens of ${studentNationality} are eligible to apply.`,
    };
  }

  // Mode: Selected Countries Only
  if (eligibility.mode === 'selected') {
    const isIncluded = eligibility.eligibleCountries?.some(
      (c) => c.toLowerCase() === cleanCountry || c.toLowerCase().includes(cleanCountry) || cleanCountry.includes(c.toLowerCase())
    );

    if (isIncluded) {
      return {
        isEligible: true,
        statusLabel: 'Eligible',
        badgeStyle: {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        },
        details: `${studentNationality} is on the official list of eligible countries.`,
      };
    }

    const preview = eligibility.eligibleCountries?.slice(0, 3).join(', ') || 'selected nations';
    const total = eligibility.eligibleCountries?.length || 0;
    return {
      isEligible: false,
      statusLabel: 'Ineligible',
      badgeStyle: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      },
      details: `${studentNationality} is not listed among the ${total} eligible countries (${preview}${total > 3 ? '...' : ''}).`,
    };
  }

  // Mode: Unknown
  return {
    isEligible: null,
    statusLabel: 'Unconfirmed',
    badgeStyle: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    details: 'Eligibility criteria unconfirmed for this nationality. Please check official source.',
  };
}
