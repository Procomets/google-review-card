import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Info, Camera } from 'lucide-react';

const SharpStar = ({ size = 40, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    stroke="currentColor"
    strokeWidth="1"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);
import Spinner from '../components/Spinner.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function PublicFeedbackPage() {
  const { slug } = useParams();
  const [status, setStatus] = useState('loading'); // loading, idle, submitting, success, error
  const [pageData, setPageData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`${API_BASE_URL}/feedback/${slug}`);
        const data = await res.json();
        
        if (data.success) {
          setPageData(data.feedbackPage);
          setStatus('idle');
        } else {
          setErrorMsg(data.error || 'Feedback page not found');
          setStatus('error');
        }
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
        setStatus('error');
      }
    }
    fetchPage();
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) return;
    
    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE_URL}/feedback/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message })
      });
      const data = await res.json();
      
      if (data.success) {
        setSubmitResult(data);
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Failed to submit feedback');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg('Network error while submitting.');
      setStatus('error');
    }
  }

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
    if (pageData && selectedRating >= pageData.reviewCTAThreshold) {
      window.location.href = pageData.googleReviewLink;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1f1f1f]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-[#1f1f1f] text-gray-200">
        <header className="flex items-center p-4 border-b border-gray-800">
          <ArrowLeft size={24} className="text-gray-300 mr-4" />
          <h1 className="text-lg font-medium truncate">Error</h1>
        </header>
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
           <p className="text-gray-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && submitResult) {
    return (
      <div className="min-h-screen flex flex-col bg-[#1f1f1f] text-gray-200">
        <header className="flex items-center p-4 border-b border-gray-800">
          <ArrowLeft size={24} className="text-gray-300 mr-4 cursor-pointer" onClick={() => window.location.reload()} />
          <h1 className="text-lg font-medium truncate">{pageData.companyName}</h1>
        </header>
        
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-medium text-white mb-2">Thanks for sharing!</h2>
          
          {submitResult.showGoogleReviewCTA ? (
            <>
              <p className="text-gray-400 mb-8 max-w-sm">
                Your feedback helps others make better decisions. Would you like to post this publicly on Google?
              </p>
              <a 
                href={submitResult.googleReviewLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full max-w-sm py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors text-center"
              >
                Post on Google
              </a>
              <button 
                onClick={() => window.location.reload()}
                className="w-full max-w-sm py-3 px-4 mt-3 bg-transparent border border-gray-700 hover:bg-gray-800 text-blue-400 font-medium rounded-full transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <p className="text-gray-400 mb-8 max-w-sm">We appreciate your feedback and will use it to improve our service.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-gray-200 flex flex-col font-sans relative">
      {/* Header */}
      <header className="flex items-center p-4">
        <ArrowLeft size={24} className="text-gray-300 mr-4 cursor-pointer" />
        <h1 className="text-lg font-medium text-white truncate">{pageData.companyName}</h1>
      </header>

      <form className="flex-1 flex flex-col px-4 pb-20" onSubmit={handleSubmit}>
        
        {/* Greeting */}
        <div className="flex justify-center mt-4 mb-8">
          <div className="text-xl font-medium text-white text-center">{pageData.greeting}</div>
        </div>

        {/* Stars */}
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              className="focus:outline-none p-1 transition-transform active:scale-95"
            >
              <SharpStar
                size={40}
                className={`${
                  rating >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-transparent text-gray-400'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Text Area */}
        <div className="relative mb-4">
          <textarea
            className="w-full bg-transparent border border-gray-600 rounded-lg p-4 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none min-h-[140px]"
            placeholder="Share details of your own experience at this place"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>



        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1f1f1f] border-t border-[#303134] flex justify-center">
          <button
            type="submit"
            disabled={rating === 0 || status === 'submitting'}
            className={`w-full max-w-md py-2.5 rounded-full font-medium transition-colors ${
              rating > 0 && status !== 'submitting'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-[#303134] text-gray-500 cursor-not-allowed'
            }`}
          >
            {status === 'submitting' ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
