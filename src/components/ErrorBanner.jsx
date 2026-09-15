/**
 * ErrorBanner.jsx — Clean error display with icon and retry support
 */
export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-slide-up flex items-start gap-3 p-4 rounded-xl
                 bg-red-50 border border-red-200 text-red-700"
    >
      {/* Error icon */}
      <svg
        className="w-5 h-5 mt-0.5 shrink-0 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1.5 text-xs font-semibold text-red-600 hover:text-red-800
                       underline underline-offset-2 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
