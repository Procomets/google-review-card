/**
 * ResultCard.jsx — Shows the found business info and generated review URL
 * with copy-to-clipboard and open-in-new-tab actions.
 */
import { useState } from 'react';

function InfoRow({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      {mono ? (
        <p className="mono-snippet">{value}</p>
      ) : (
        <p className="text-sm font-medium text-slate-200">{value}</p>
      )}
    </div>
  );
}

export default function ResultCard({ business, reviewUrl, onReset }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = reviewUrl;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleOpen() {
    window.open(reviewUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Business Found</h2>
          <p className="text-xs text-slate-400">Your review link is ready to share</p>
        </div>
      </div>

      {/* Business info card */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-3.5">
        <InfoRow label="Business Name" value={business.name} />
        {business.address && (
          <InfoRow label="Address" value={business.address} />
        )}
        <InfoRow label="Place ID" value={business.placeId} mono />
      </div>

      {/* Review URL section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Direct Google Review Link
        </p>
        <div
          id="review-url-display"
          className="mono-snippet cursor-pointer hover:bg-brand-900/20 hover:border-brand-500
                     transition-colors duration-150 select-all"
          onClick={handleCopy}
          title="Click to copy"
          role="button"
          tabIndex={0}
          aria-label="Review URL — click to copy"
          onKeyDown={(e) => e.key === 'Enter' && handleCopy()}
        >
          {reviewUrl}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          id="copy-link-btn"
          onClick={handleCopy}
          className={`btn-primary flex-1 ${
            copied
              ? 'from-green-600 to-green-500 shadow-green-500/30'
              : ''
          }`}
          aria-live="polite"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Review link copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638
                     m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0
                     01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11
                     1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25
                     2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057
                     1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy Review Link
            </>
          )}
        </button>

        <button
          id="open-review-btn"
          onClick={handleOpen}
          className="btn-ghost flex-1"
          aria-label="Open the review page in a new tab"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0
                 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21
                 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open Review Page
        </button>
      </div>

      {/* Generate another */}
      <button
        id="generate-another-btn"
        onClick={onReset}
        className="btn-secondary w-full"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993
               0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25
               8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Generate Another
      </button>
    </div>
  );
}
