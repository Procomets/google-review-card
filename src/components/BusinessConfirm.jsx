/**
 * BusinessConfirm.jsx — Shown when the backend returns multiple candidates
 * and needs the user to pick the correct business.
 */
import { confirmBusiness } from '../api.js';
import { useState } from 'react';
import Spinner from './Spinner.jsx';

function DistanceBadge({ distanceKm }) {
  if (distanceKm === undefined || distanceKm === null) return null;

  const color =
    distanceKm < 1
      ? 'bg-green-100 text-green-700'
      : distanceKm < 5
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-slate-800 text-slate-300';

  return (
    <span className={`badge ${color}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      {distanceKm} km away
    </span>
  );
}

export default function BusinessConfirm({ candidates, extractedName, onConfirmed, onReset }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  async function handleSelect(candidate) {
    setLoadingId(candidate.placeId);
    setError('');
    try {
      const data = await confirmBusiness({
        placeId: candidate.placeId,
        name: candidate.name,
        address: candidate.address,
      });
      if (data.success) {
        onConfirmed(data);
      } else {
        setError(data.error || 'Failed to confirm business.');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Please confirm the business</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            We found multiple businesses matching{' '}
            <span className="font-semibold text-slate-300">&ldquo;{extractedName}&rdquo;</span>.
            Select the correct one.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Candidate cards */}
      <ul className="space-y-3" aria-label="Business candidates">
        {candidates.map((candidate, i) => {
          const isLoading = loadingId === candidate.placeId;
          return (
            <li key={candidate.placeId || i}>
              <div
                className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-700
                           hover:border-brand-500 hover:bg-brand-900/20
                           transition-all duration-200 cursor-pointer"
                onClick={() => !loadingId && handleSelect(candidate)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${candidate.name}`}
                onKeyDown={(e) => e.key === 'Enter' && !loadingId && handleSelect(candidate)}
              >
                {/* Index number */}
                <span className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-brand-900/40 text-slate-300
                                 group-hover:text-brand-300 flex items-center justify-center
                                 text-xs font-bold shrink-0 transition-colors">
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-200 text-sm leading-snug">{candidate.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{candidate.address}</p>
                  {candidate.distanceKm !== undefined && (
                    <div className="mt-1.5">
                      <DistanceBadge distanceKm={candidate.distanceKm} />
                    </div>
                  )}
                </div>

                <button
                  id={`select-business-${i}`}
                  className="shrink-0 self-center btn-ghost text-xs px-3 py-1.5"
                  onClick={(e) => { e.stopPropagation(); !loadingId && handleSelect(candidate); }}
                  disabled={!!loadingId}
                  aria-label={`Select ${candidate.name}`}
                >
                  {isLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    'Select'
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Start over */}
      <button
        id="try-different-link-btn"
        onClick={onReset}
        className="btn-secondary w-full"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Try a different link
      </button>
    </div>
  );
}
