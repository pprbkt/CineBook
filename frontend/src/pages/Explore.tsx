import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { eventsAPI } from '../lib/api';
import EventCard from '../components/EventCard';

const categories = ['all', 'movie', 'concert', 'sports', 'theatre'];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || 'all';

  const { data, isLoading } = useQuery({
    queryKey: ['events', category, search],
    queryFn: () => eventsAPI.getAll({ ...(category !== 'all' && { category }), ...(search && { search }), limit: 30 }),
  });
  const events = data?.data?.data?.events || [];

  const setCategory = (cat: string) => { const p = new URLSearchParams(searchParams); if (cat === 'all') p.delete('category'); else p.set('category', cat); setSearchParams(p); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); const p = new URLSearchParams(searchParams); if (search) p.set('search', search); else p.delete('search'); setSearchParams(p); };

  return (
    <div style={{ paddingTop: 56 }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Explore</h1>
        <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 600 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-light)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input" placeholder="Search events, movies, concerts..." style={{ paddingLeft: 44, fontSize: 15 }} />
          </div>
        </form>
        <div className="pill-tabs" style={{ marginBottom: 24 }}>
          {categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`pill-tab ${(category === cat || (cat === 'all' && !searchParams.get('category'))) ? 'active' : ''}`} style={{ textTransform: 'capitalize' }}>{cat === 'all' ? 'All' : cat}</button>)}
        </div>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i}><div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 8 }} /></div>)}
          </div>
        ) : events.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {events.map((event: any, i: number) => <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}><EventCard event={event} /></motion.div>)}
          </div>
        ) : <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No events found</p>}
      </div>
    </div>
  );
}
