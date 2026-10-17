import { DeadlineInfo, DeadlineStatus, Scholarship } from '../types/scholarship';

/**
 * Calculates dynamic deadline status based on current time and scholarship deadline.
 *
 * Current system reference date: October 15, 2026.
 *
 * Requirements:
 * - Dynamically determines: 'Open', 'Closing Soon', 'Closed', or 'Deadline Not Confirmed'
 * - Does NOT treat unknown deadlines as open.
 * - Expired scholarships marked as 'Closed'.
 * - Closing Soon defined as 30 days or fewer remaining.
 */

export function calculateDeadlineInfo(
  scholarship: Pick<Scholarship, 'deadline' | 'deadlineTimezone' | 'deadlineNotConfirmed'>,
  referenceDate: Date = new Date()
): DeadlineInfo {
  // If explicitly flagged as not confirmed or deadline is missing
  if (scholarship.deadlineNotConfirmed || !scholarship.deadline) {
    return {
      status: 'Deadline Not Confirmed',
      daysRemaining: null,
      formattedDeadline: 'Deadline Not Confirmed',
      badgeColor: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      },
    };
  }

  const deadlineDate = new Date(scholarship.deadline);

  // If date string is invalid
  if (isNaN(deadlineDate.getTime())) {
    return {
      status: 'Deadline Not Confirmed',
      daysRemaining: null,
      formattedDeadline: 'Invalid Deadline Format',
      badgeColor: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      },
    };
  }

  // Calculate millisecond difference
  const diffMs = deadlineDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const tzSuffix = scholarship.deadlineTimezone ? ` (${scholarship.deadlineTimezone})` : '';
  const dateStr = deadlineDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (diffMs <= 0) {
    return {
      status: 'Closed',
      daysRemaining: diffDays,
      formattedDeadline: `Closed: ${dateStr}${tzSuffix}`,
      badgeColor: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-300',
      },
    };
  }

  if (diffDays <= 30) {
    const dayLabel = diffDays === 1 ? '1 day' : `${diffDays} days`;
    return {
      status: 'Closing Soon',
      daysRemaining: diffDays,
      formattedDeadline: `Closes in ${dayLabel} (${dateStr})${tzSuffix}`,
      badgeColor: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      },
    };
  }

  return {
    status: 'Open',
    daysRemaining: diffDays,
    formattedDeadline: `${dateStr}${tzSuffix}`,
    badgeColor: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
  };
}

/**
 * Checks whether a scholarship is considered currently active and open for applications.
 * Expired and closed scholarships are excluded from default search.
 */
export function isScholarshipOpen(scholarship: Scholarship, referenceDate: Date = new Date()): boolean {
  const info = calculateDeadlineInfo(scholarship, referenceDate);
  return info.status === 'Open' || info.status === 'Closing Soon';
}
