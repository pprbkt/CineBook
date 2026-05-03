import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, ChevronRight, Play, TrendingUp, Sparkles } from 'lucide-react';
import { eventsAPI } from '../lib/api';
import EventCard from '../components/EventCard';

export default function Home() {
  const { data: featured } = useQuery({ queryKey: ['featured'], queryFn: () => eventsAPI.getFeatured() });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations'], queryFn: () => eventsAPI.getRecommendations() });
  const { data: movies } = useQuery({ queryKey: ['events', 'movie'], queryFn: () => eventsAPI.getAll({ category: 'movie', limit: 8 }) });
  const { data: concerts } = useQuery({ queryKey: ['events', 'concert'], queryFn: () => eventsAPI.getAll({ category: 'concert', limit: 8 }) });

  const featuredEvents = featured?.data?.data?.events || [];
  const recommendedEvents = recommendations?.data?.data?.events || [];
  const movieList = movies?.data?.data?.events || [];
  const concertList = concerts?.data?.data?.events || [];
  const hero = featuredEvents[0];

  return (
    <div style={{ paddingTop: 56 }}>
      {/* Hero / Featured Today */}
      {hero && (
        <section style={{ background: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d)', padding: '40px 0' }}>
          <div className="container-main">
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {/* Hero content */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--imdb-yellow)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  ▶ Featured Today
                </p>
                <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
                  {hero.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  {hero.avgRating > 0 && (
                    <span className="rating-badge" style={{ color: '#fff' }}>
                      <Star style={{ width: 18, height: 18 }} /> {hero.avgRating.toFixed(1)}
                    </span>
                  )}
                  <span style={{ color: '#aaa', fontSize: 14 }}>{hero.genre?.join(' · ')}</span>
                  {hero.duration && <span style={{ color: '#aaa', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 14, height: 14 }} /> {hero.duration} min</span>}
                </div>
                <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.6, marginBottom: 20, maxWidth: 500 }}>
                  {hero.description?.slice(0, 160)}...
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link to={`/event/${hero._id}`} className="btn-primary">
                    Book Now <ChevronRight style={{ width: 16, height: 16 }} />
                  </Link>
                  {hero.trailerUrl && (
                    <a href={hero.trailerUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ color: '#fff', borderColor: '#555' }}>
                      <Play style={{ width: 16, height: 16 }} /> Trailer
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Hero poster */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="hidden md:block" style={{ width: 240, flexShrink: 0 }}>
                <img src={hero.posterUrl} alt={hero.title}
                  style={{ width: '100%', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Main content area */}
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Featured */}
        {featuredEvents.length > 0 && (
          <Section title="Featured Events" link="/explore">
            <div className="carousel-row">
              {featuredEvents.map((event: any, i: number) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ width: 180 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* Recommended for You */}
        {recommendedEvents.length > 0 && (
          <Section title="Top Picks for You" icon={<Sparkles style={{ width: 20, height: 20, color: 'var(--imdb-yellow)' }} />}>
            <div className="carousel-row">
              {recommendedEvents.slice(0, 8).map((event: any, i: number) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ width: 180 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* Movies */}
        {movieList.length > 0 && (
          <Section title="Movies" link="/movies">
            <div className="carousel-row">
              {movieList.map((event: any, i: number) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ width: 180 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* Concerts */}
        {concertList.length > 0 && (
          <Section title="Live Concerts" link="/concerts">
            <div className="carousel-row">
              {concertList.map((event: any, i: number) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ width: 180 }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: 'var(--imdb-dark)', padding: '40px 0', borderTop: '1px solid #333' }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <div style={{ background: 'var(--imdb-yellow)', display: 'inline-block', borderRadius: 4, padding: '4px 10px', fontWeight: 900, fontSize: 20, color: '#000', marginBottom: 12 }}>CB</div>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
            Built by Abhilasha A, Akash J, Darshan IC & Dhanush HS — Dept. of CSE AI/ML, VVCE
          </p>
          <p style={{ color: '#555', fontSize: 12 }}>© {new Date().getFullYear()} CineBook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, link, icon, children }: { title: string; link?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div className="section-header">
        <div className="bar" />
        <h2>{title}</h2>
        {icon}
        {link && (
          <Link to={link} className="see-more">
            See more <ChevronRight style={{ width: 16, height: 16 }} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
