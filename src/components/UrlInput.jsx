/**
 * UrlInput.jsx — Google Maps URL input field with validation and submit
 */
import { useState } from 'react';
import Spinner from './Spinner.jsx';

const ALLOWED_HOSTS = [
  'maps.app.goo.gl',
  'goo.gl',
  'google.com',
  'www.google.com',
  'maps.google.com',
];

function isValidGoogleMapsUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

export default function UrlInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = isValidGoogleMapsUrl(value.trim());
  const showError = touched && value.trim() && !isValid;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!value.trim() || !isValid) return;
    onSubmit(value.trim());
  }

  function handlePaste(e) {
    // Immediately trigger on paste for a snappy UX
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted && isValidGoogleMapsUrl(pasted.trim())) {
      setValue(pasted.trim());
      setTouched(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          {/* Link icon */}
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101
                   m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>

          <input
            id="maps-url-input"
            type="url"
            value={value}
            onChange={(e) => { setValue(e.target.value); setTouched(false); }}
            onBlur={() => setTouched(true)}
            onPaste={handlePaste}
            placeholder="Paste Google Maps link here..."
            aria-label="Google Maps URL"
            aria-describedby={showError ? 'url-error' : undefined}
            aria-invalid={showError}
            className={`input-field pl-10 ${
              showError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                : ''
            }`}
            disabled={isLoading}
            maxLength={2048}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          id="generate-btn"
          type="submit"
          className="btn-primary sm:shrink-0 sm:w-auto w-full"
          disabled={isLoading || !value.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span>Finding business…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              Generate Review Link
            </>
          )}
        </button>
      </div>

      {showError && (
        <p id="url-error" role="alert" className="mt-2 text-xs text-red-600 font-medium">
          Please enter a valid Google Maps link (maps.app.goo.gl, goo.gl/maps, google.com/maps…)
        </p>
      )}
    </form>
  );
}
