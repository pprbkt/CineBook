import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { eventsAPI } from '../lib/api';
import EventCard from '../components/EventCard';

export default function Movies() {
  const { data, isLoading } = useQuery({ queryKey: ['movies-page'], queryFn: () => eventsAPI.getAll({ category: 'movie', limit: 30 }) });
  const movies = data?.data?.data?.events || [];
  const nowShowing = movies.filter((m: any) => m.releaseDate && new Date(m.releaseDate) <= new Date());
  const comingSoon = movies.filter((m: any) => m.releaseDate && new Date(m.releaseDate) > new Date());

  return (
    <div style={{ paddingTop: 56 }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Movies</h1>

        {nowShowing.length > 0 && (
          <Section title="Now Showing">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {nowShowing.map((e: any, i: number) => (
                <motion.div key={e._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <EventCard event={e} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {comingSoon.length > 0 && (
          <Section title="Coming Soon">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {comingSoon.map((e: any, i: number) => (
                <motion.div key={e._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <EventCard event={e} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {isLoading && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i}><div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 8 }} /></div>)}
        </div>}
        {!isLoading && movies.length === 0 && <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No movies available</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div className="section-header"><div className="bar" /><h2>{title}</h2></div>
      {children}
    </section>
  );
}
