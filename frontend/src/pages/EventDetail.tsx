import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, MapPin, Play, ChevronRight, Users } from 'lucide-react';
import { eventsAPI, showtimesAPI, reviewsAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import EventCard from '../components/EventCard';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({ queryKey: ['event', id], queryFn: () => eventsAPI.getOne(id!), enabled: !!id });
  const { data: similarData } = useQuery({ queryKey: ['similar', id], queryFn: () => eventsAPI.getSimilar(id!), enabled: !!id });
  const { data: reviewsData, refetch: refetchReviews } = useQuery({ queryKey: ['reviews', id], queryFn: () => reviewsAPI.getByEvent(id!), enabled: !!id });

  const event = data?.data?.data?.event;
  const showtimes = data?.data?.data?.showtimes || [];
  const reviews = reviewsData?.data?.data?.reviews || [];
  const similar = similarData?.data?.data?.events || [];

  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0]; });
  const filteredShowtimes = selectedDate ? showtimes.filter((s: any) => new Date(s.dateTime).toISOString().split('T')[0] === selectedDate) : showtimes;

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setSubmitting(true);
    try { await reviewsAPI.create({ eventId: id, ...reviewForm }); toast.success('Review submitted!'); refetchReviews(); setReviewForm({ rating: 5, title: '', comment: '' }); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  if (!event) return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>;

  return (
    <div style={{ paddingTop: 56 }}>
      {/* Hero header - IMDb style */}
      <div style={{ background: '#1c1c1c' }}>
        <div className="container-main" style={{ padding: '32px 24px', display: 'flex', gap: 32 }}>
          {/* Poster */}
          <div style={{ width: 200, flexShrink: 0 }} className="hidden sm:block">
            <img src={event.posterUrl} alt={event.title} style={{ width: '100%', borderRadius: 8 }} />
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: 8 }}>{event.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <span className={`cat-chip cat-${event.category}`}>{event.category}</span>
              {event.rating && <span style={{ color: '#aaa', fontSize: 14, border: '1px solid #555', padding: '1px 6px', borderRadius: 4 }}>{event.rating}</span>}
              {event.duration && <span style={{ color: '#aaa', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 14, height: 14 }} /> {event.duration} min</span>}
              {event.language && <span style={{ color: '#aaa', fontSize: 14 }}>{event.language}</span>}
            </div>
            {event.avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--imdb-yellow)', borderRadius: 4, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star style={{ width: 16, height: 16, fill: '#000', color: '#000' }} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#000' }}>{event.avgRating.toFixed(1)}</span>
                </div>
                <span style={{ color: '#888', fontSize: 13 }}>{event.totalReviews} reviews</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {event.genre?.map((g: string) => <span key={g} style={{ color: 'var(--accent)', fontSize: 14 }}>{g}</span>)}
            </div>
            <p style={{ color: '#bbb', fontSize: 15, lineHeight: 1.6, marginBottom: 16, maxWidth: 600 }}>{event.description}</p>
            {event.cast?.length > 0 && <p style={{ color: '#888', fontSize: 14, marginBottom: 4 }}><strong style={{ color: '#ccc' }}>Stars:</strong> {event.cast.join(', ')}</p>}
            {event.director && <p style={{ color: '#888', fontSize: 14 }}><strong style={{ color: '#ccc' }}>Director:</strong> {event.director}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {event.trailerUrl && <a href={event.trailerUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ color: '#fff', borderColor: '#555' }}><Play style={{ width: 16, height: 16 }} /> Trailer</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Showtimes */}
        <section style={{ marginBottom: 40 }}>
          <div className="section-header"><div className="bar" /><h2>Showtimes & Tickets</h2></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
            {dates.map((d) => {
              const dt = new Date(d);
              const active = selectedDate === d;
              return (
                <button key={d} onClick={() => setSelectedDate(active ? '' : d)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px',
                    borderRadius: 8, border: active ? '2px solid var(--imdb-yellow)' : '1px solid var(--border)',
                    background: active ? 'var(--imdb-yellow)' : 'var(--bg-white)', cursor: 'pointer',
                    color: active ? '#000' : 'var(--text)', minWidth: 56, transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{format(dt, 'EEE')}</span>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{format(dt, 'd')}</span>
                  <span style={{ fontSize: 11 }}>{format(dt, 'MMM')}</span>
                </button>
              );
            })}
          </div>
          {filteredShowtimes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(filteredShowtimes.reduce((acc: any, s: any) => { const vn = s.venue?.name || 'Unknown'; if (!acc[vn]) acc[vn] = { venue: s.venue, times: [] }; acc[vn].times.push(s); return acc; }, {}))
                .map(([vn, g]: [string, any]) => (
                  <div key={vn} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div><h3 style={{ fontSize: 16, fontWeight: 600 }}>{vn}</h3><p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 12, height: 12 }} /> {g.venue?.location}</p></div>
                      <span className="cat-chip" style={{ background: '#f5f5f1', color: 'var(--text-muted)' }}>{g.venue?.hallType?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {g.times.map((s: any) => (
                        <Link key={s._id} to={isAuthenticated ? `/seats/${s._id}` : '/login'}
                          style={{
                            padding: '8px 20px', borderRadius: 6, border: '1px solid var(--accent)',
                            color: 'var(--accent)', fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}>
                          {format(new Date(s.dateTime), 'h:mm a')}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No showtimes available{selectedDate ? ' for this date' : ''}</p>}
        </section>

        {/* Reviews */}
        <section style={{ marginBottom: 40 }}>
          <div className="section-header"><div className="bar" /><h2>User Reviews</h2></div>
          {isAuthenticated && (
            <form onSubmit={handleReview} className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Your Rating</span>
                <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setReviewForm(f => ({...f, rating: s}))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Star style={{ width: 24, height: 24, color: s <= reviewForm.rating ? '#f5c518' : '#ddd', fill: s <= reviewForm.rating ? '#f5c518' : 'none' }} /></button>)}</div>
              </div>
              <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm(f => ({...f, title: e.target.value}))} className="input" placeholder="Review headline" style={{ marginBottom: 10 }} />
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(f => ({...f, comment: e.target.value}))} className="input" placeholder="Write your review..." style={{ marginBottom: 10, height: 80, resize: 'none' }} />
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Review'}</button>
            </form>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((r: any) => (
              <div key={r._id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--imdb-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#000' }}>{r.user?.name?.[0]}</div>
                  <div><p style={{ fontSize: 14, fontWeight: 600 }}>{r.user?.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} style={{ width: 14, height: 14, color: i < r.rating ? '#f5c518' : '#ddd', fill: i < r.rating ? '#f5c518' : 'none' }} />)}
                    </div>
                  </div>
                </div>
                {r.title && <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.title}</p>}
                {r.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>}
              </div>
            ))}
            {reviews.length === 0 && <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No reviews yet</p>}
          </div>
        </section>

        {/* Similar */}
        {similar.length > 0 && (
          <section>
            <div className="section-header"><div className="bar" /><h2>More Like This</h2></div>
            <div className="carousel-row">
              {similar.map((e: any) => <div key={e._id} style={{ width: 160 }}><EventCard event={e} /></div>)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
