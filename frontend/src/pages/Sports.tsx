import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { eventsAPI } from '../lib/api';
import EventCard from '../components/EventCard';

export default function Sports() {
  const { data, isLoading } = useQuery({ queryKey: ['sports-page'], queryFn: () => eventsAPI.getAll({ category: 'sports', limit: 30 }) });
  const events = data?.data?.data?.events || [];
  return (
    <div style={{ paddingTop: 56 }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Sports Events</h1>
        <div className="section-header"><div className="bar" /><h2>All Sports</h2></div>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i}><div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 8 }} /></div>)}
          </div>
        ) : events.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {events.map((e: any, i: number) => <motion.div key={e._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}><EventCard event={e} /></motion.div>)}
          </div>
        ) : <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No sports events right now</p>}
      </div>
    </div>
  );
}
