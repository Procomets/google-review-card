import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Link as LinkIcon, MessageSquare, Settings, LogOut, Plus, Search, ExternalLink, QrCode, Copy, Edit2, Menu, X, Users } from 'lucide-react';
import ReviewLinkGenerator from '../ReviewLinkGenerator.jsx';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserModule from './UserModule.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const { currentUser, logout, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/admin/review-links', icon: LinkIcon, label: 'Link Generator' },
    { path: '/admin/feedback', icon: MessageSquare, label: 'Private Feedback' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex text-gray-200">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Dashboard
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                location.pathname.startsWith(item.path)
                  ? 'bg-brand-900/30 text-brand-400'
                  : 'text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#3a3a3a]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#1f1f1f]">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#2a2a2a] border-b border-[#3a3a3a] p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-gray-400 p-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <Routes>
            <Route path="review-links" element={<ReviewLinkGenerator />} />
            <Route path="feedback" element={<FeedbackManager />} />
            <Route path="users" element={<UserModule />} />
            <Route path="/" element={<Navigate to="review-links" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// Removed AdminLogin component

// ─────────────────────────────────────────────────────────────────────────────
//  Feedback Manager
// ─────────────────────────────────────────────────────────────────────────────
import { auth } from '../firebase';

function FeedbackManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [qrModalUrl, setQrModalUrl] = useState(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (showCreate || editingPage) {
    return <CreateFeedbackPage initialData={editingPage} onBack={() => { setShowCreate(false); setEditingPage(null); fetchPages(); }} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback Pages</h1>
          <p className="text-gray-400 mt-1">Manage private feedback campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={20} />
          <span>Create New</span>
        </button>
      </div>

      <div className="bg-[#2a2a2a] rounded-2xl shadow-sm border border-[#3a3a3a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-gray-500" size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No feedback pages yet</h3>
            <p className="text-gray-400 mb-6">Create your first feedback page to start collecting reviews.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
              <span>Create Feedback Page</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-none border border-[#3a3a3a]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1f1f1f]">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Company</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Location</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Short Link</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Google Link</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Greeting</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Description</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a] whitespace-nowrap">Threshold</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a]">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-300 border border-[#3a3a3a] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => {
                  const url = `${window.location.origin}/f/${page.slug}`;
                  return (
                    <tr key={page.id} className="hover:bg-[#3a3a3a] transition-colors">
                      <td className="px-4 py-3 min-w-[150px] border border-[#3a3a3a]">
                        <div className="font-medium text-white">{page.companyName}</div>
                      </td>
                      <td className="px-4 py-3 border border-[#3a3a3a]">
                        <div className="text-sm text-gray-400">{page.location || '-'}</div>
                      </td>
                      <td className="px-4 py-3 border border-[#3a3a3a] whitespace-nowrap">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-brand-400 bg-brand-900/30 hover:bg-brand-900/50 px-2 py-1 rounded transition-colors inline-block" title="Open Page">
                          /f/{page.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] border border-[#3a3a3a] truncate">
                        <a href={page.googleReviewLink} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-sm truncate block" title={page.googleReviewLink}>
                          {page.googleReviewLink}
                        </a>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] border border-[#3a3a3a] truncate text-sm text-gray-300" title={page.greeting}>
                        {page.greeting}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] border border-[#3a3a3a] truncate text-sm text-gray-300" title={page.description}>
                        {page.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border border-[#3a3a3a] text-center">
                        <span className="inline-flex items-center gap-1 bg-yellow-900/30 text-yellow-500 border border-yellow-900/50 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {page.reviewCTAThreshold} Stars +
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border border-[#3a3a3a] text-center">
                        {page.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-gray-600"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center border border-[#3a3a3a]">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditingPage(page)} className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors" title="Edit Page">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => copyToClipboard(url)} className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors" title="Copy Link">
                            <Copy size={18} />
                          </button>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors" title="Open Page">
                            <ExternalLink size={18} />
                          </a>
                          <button onClick={() => setQrModalUrl(url)} className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors" title="QR Code">
                            <QrCode size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1f1f]/80 backdrop-blur-sm p-4">
          <div className="bg-[#2a2a2a] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center border border-[#3a3a3a]">
            <h3 className="text-xl font-bold text-white mb-6">Scan to Review</h3>
            <div className="bg-white p-4 rounded-xl inline-block border border-[#3a3a3a] shadow-sm mb-6">
              <QRCodeSVG value={qrModalUrl} size={200} level="M" />
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  const svg = document.querySelector('.qrcode-svg-container svg');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = 'qrcode.png';
                      downloadLink.href = `${pngFile}`;
                      downloadLink.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors"
              >
                Download QR Code
              </button>
              <button 
                onClick={() => setQrModalUrl(null)}
                className="w-full py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
            {/* Hidden container for QR code serialization */}
            <div className="hidden qrcode-svg-container">
              <QRCodeSVG value={qrModalUrl} size={1024} level="M" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Create / Edit Feedback Page Form
// ─────────────────────────────────────────────────────────────────────────────
function CreateFeedbackPage({ onBack, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    location: initialData?.location || '',
    greeting: initialData?.greeting || "We'd love to hear from you!",
    description: initialData?.description || 'Please take a moment to share your experience with us.',
    googleReviewLink: initialData?.googleReviewLink || '',
    reviewCTAThreshold: initialData?.reviewCTAThreshold || 4,
    isActive: initialData !== undefined ? initialData.isActive : true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const url = isEditing 
        ? `${API_BASE_URL}/admin/feedback/${initialData.slug || initialData.id}`
        : `${API_BASE_URL}/admin/feedback`;
        
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onBack();
      } else {
        setError(data.error || 'Failed to create page');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-white">{isEditing ? 'Edit Feedback Page' : 'Create Feedback Page'}</h1>
      </div>

      <div className="bg-[#2a2a2a] p-6 sm:p-8 rounded-2xl shadow-sm border border-[#3a3a3a]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-xl">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="e.g. New York Branch" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Google Review Link <span className="text-red-500">*</span></label>
              <input type="url" name="googleReviewLink" required value={formData.googleReviewLink} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="https://search.google.com/local/writereview?placeid=..." />
              <p className="text-xs text-gray-500 mt-1">Generate this using the Link Generator tool.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#3a3a3a]">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Review CTA Threshold</label>
                <select name="reviewCTAThreshold" value={formData.reviewCTAThreshold} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value={5}>5 Stars only</option>
                  <option value={4}>4 Stars and above</option>
                  <option value={3}>3 Stars and above</option>
                  <option value={2}>2 Stars and above</option>
                  <option value={1}>1 Star and above</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Ratings at or above this will see the Google Review CTA.</p>
              </div>
              
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#3a3a3a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">Active Page</span>
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#3a3a3a] space-y-4">
              <h3 className="text-sm font-semibold text-white">Customization</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Greeting</label>
                <input type="text" name="greeting" value={formData.greeting} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={2} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] text-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"></textarea>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#3a3a3a] flex justify-end gap-3">
            <button type="button" onClick={onBack} className="px-6 py-2 border border-[#3a3a3a] rounded-xl text-gray-300 hover:bg-[#3a3a3a] transition-colors font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-brand-500/10">
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Feedback Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
