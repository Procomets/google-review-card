import { useState } from 'react';
import { generateReviewLink } from './api.js';
import UrlInput from './components/UrlInput.jsx';
import BusinessConfirm from './components/BusinessConfirm.jsx';
import ResultCard from './components/ResultCard.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import Spinner from './components/Spinner.jsx';

// ─────────────────────────────────────────────────────────────────────────────
//  Page states
// ─────────────────────────────────────────────────────────────────────────────
const STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  CONFIRM: 'confirm',
  RESULT: 'result',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="text-center mb-8">
      {/* Logo mark */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                      bg-gradient-to-br from-brand-500 to-brand-700
                      shadow-lg shadow-brand-500/30 mb-4">
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0
               00.475.345l5.518.442c.499.04.701.663.321.988l-4.204
               3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0
               01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982
               20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0
               00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563
               0 00.475-.345L11.48 3.5z" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
        Google Review Link
        <span className="text-blue-200">
          {' '}Generator
        </span>
      </h1>
      <p className="mt-2 text-slate-400 text-base max-w-md mx-auto leading-relaxed">
        Convert any Google Maps business link into a direct Google review link.
      </p>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Loading overlay
// ─────────────────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="animate-fade-in flex flex-col items-center py-10 gap-4">
      <Spinner size="lg" />
      <div className="text-center">
        <p className="text-slate-200 font-semibold">Finding your business…</p>
        <p className="text-slate-400 text-sm mt-1">Searching Google Places</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [uiState, setUiState] = useState(STATE.IDLE);
  const [error, setError] = useState('');
  const [confirmData, setConfirmData] = useState(null);  // { candidates, extractedName }
  const [resultData, setResultData] = useState(null);    // { business, reviewUrl }

  function reset() {
    setUiState(STATE.IDLE);
    setError('');
    setConfirmData(null);
    setResultData(null);
  }

  async function handleSubmit(mapsUrl) {
    setUiState(STATE.LOADING);
    setError('');
    setConfirmData(null);
    setResultData(null);

    try {
      const data = await generateReviewLink(mapsUrl);

      if (!data.success) {
        setError(data.error || 'An unexpected error occurred.');
        setUiState(STATE.IDLE);
        return;
      }

      if (data.needsConfirmation) {
        setConfirmData({
          candidates: data.candidates,
          extractedName: data.extractedName,
        });
        setUiState(STATE.CONFIRM);
      } else {
        setResultData({
          business: data.business,
          reviewUrl: data.reviewUrl,
        });
        setUiState(STATE.RESULT);
      }
    } catch (err) {
      setError(err.message || 'Network connection problem. Please try again.');
      setUiState(STATE.IDLE);
    }
  }

  function handleConfirmed(data) {
    setResultData({
      business: data.business,
      reviewUrl: data.reviewUrl,
    });
    setUiState(STATE.RESULT);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12 sm:py-16">

      <div className="relative w-full max-w-lg">
        <Header />

        {/* Main card */}
        <div className="mt-8 glass-card p-6 sm:p-8 space-y-6">

          {/* Always-visible URL input (hidden while loading / showing results) */}
          {(uiState === STATE.IDLE || uiState === STATE.LOADING) && (
            <div className="space-y-4">
              <UrlInput
                onSubmit={handleSubmit}
                isLoading={uiState === STATE.LOADING}
              />

              {error && (
                <ErrorBanner
                  message={error}
                  onRetry={() => setError('')}
                />
              )}
            </div>
          )}

          {/* Loading */}
          {uiState === STATE.LOADING && <LoadingState />}

          {/* Confirmation */}
          {uiState === STATE.CONFIRM && confirmData && (
            <BusinessConfirm
              candidates={confirmData.candidates}
              extractedName={confirmData.extractedName}
              onConfirmed={handleConfirmed}
              onReset={reset}
            />
          )}

          {/* Result */}
          {uiState === STATE.RESULT && resultData && (
            <ResultCard
              business={resultData.business}
              reviewUrl={resultData.reviewUrl}
              onReset={reset}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Powered by Google Places API (New)</p>
          <p>Your Google API key is never exposed in the browser.</p>
        </footer>
      </div>
    </div>
  );
}
