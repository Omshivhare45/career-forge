import GlobalLoader from '../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiExternalLink, FiGift, FiAward, FiInfo, FiSearch, FiFilter, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get('/cloud-credits');
      setResources(res.data.data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         res.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || res.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = ['all', 'cloud', 'education', 'hosting', 'database'];

  if (loading) return <GlobalLoader fullScreen={false} title="Loading resources" />;

  return (
    <div className="fade-in max-w-7xl mx-auto py-10 px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-[var(--land-text)] tracking-tight mb-4 flex items-center gap-4">
          Free Perks & Tools
        </h1>
        <p className="text-[var(--text-muted)] text-lg font-medium max-w-2xl">
          Exclusive credits, premium software, and developer tools curated for the CareerForge engineering community.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="relative flex-1 group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98a2b3] group-focus-within:text-[var(--brand-green)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, platform or tool..." 
            className="input-field pl-12 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border whitespace-nowrap ${filter === cat ? 'bg-[var(--brand-green)] text-[var(--dashboard-on-accent)] border-[var(--brand-green)] ' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-green)]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.map((res) => (
            <div key={res._id} className="card p-7 hover:border-[var(--brand-green)] hover:shadow-md transition-all duration-300 flex flex-col group bg-white border-soft">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--land-bg-alt)] border border-[var(--border)] flex items-center justify-center text-3xl shadow-sm group-hover:bg-green-50 group-hover:text-[var(--brand-green)] transition-colors">
                  {res.icon || '🎁'}
                </div>
                <div className="badge badge-gray bg-[#f9fafb] text-[#344054] font-bold py-1 px-3 text-[10px] uppercase tracking-widest border border-[var(--border)]">
                  {res.category}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[var(--land-text)] mb-3 group-hover:text-[var(--brand-green)] transition-colors tracking-tight">{res.title}</h3>
              <p className="text-[var(--text-muted)] text-sm mb-8 flex-1 leading-relaxed">{res.description}</p>
              
              {res.eligibility && (
                <div className="mb-8 p-4 rounded-xl bg-[var(--land-bg-alt)] border border-[var(--border)] flex items-start gap-3">
                  <FiInfo className="text-[var(--brand-green)] shrink-0 mt-0.5" />
                  <span className="text-[11px] font-bold text-[#475467] leading-relaxed uppercase tracking-wide">Eligible for {res.eligibility}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[#f2f4f7]">
                <div className="text-[10px] font-black text-[#98a2b3] uppercase tracking-[0.15em]">{res.platform}</div>
                <a 
                  href={res.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-[var(--brand-green)] hover:text-[var(--brand-green-hover)] font-extrabold text-sm transition-colors"
                >
                  Claim Reward <FiChevronRight />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 card bg-white border-soft">
          <div className="text-6xl mb-6 opacity-20">🔍</div>
          <h3 className="text-2xl font-bold text-[var(--land-text)] mb-2 tracking-tight">No resources found</h3>
          <p className="text-[var(--text-muted)] font-medium text-lg">Try adjusting your filters or search keywords.</p>
        </div>
      )}

      {/* Advisory Note */}
      <div className="mt-16 card p-8 app-advisory border-none flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-green)]/10 rounded-full blur-[100px]"></div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 border border-white/10">💡</div>
        <div>
          <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Strategic Tip for Engineers</h4>
          <p className="text-green-100/70 leading-relaxed font-medium">
            Use these cloud credits to build and host your portfolio projects. Having a live, accessible project is 10x more valuable than a local one during interviews. 
            <span className="text-white font-bold ml-1">Remember to use your student email for maximum eligibility.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Resources;
