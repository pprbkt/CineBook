import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Plus, Film, Calendar, MapPin, Users } from 'lucide-react';
import { eventsAPI, bookingsAPI, venuesAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'events' | 'bookings' | 'venues'>('events');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'movie', genre: '', duration: 120, language: 'English', rating: 'PG-13', cast: '', director: '', posterUrl: '', trailerUrl: '', tags: '' });

  const { data: evD } = useQuery({ queryKey: ['admin-events'], queryFn: () => eventsAPI.getAll({ limit: 50 }) });
  const { data: bkD } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => bookingsAPI.getAll() });
  const { data: vnD } = useQuery({ queryKey: ['admin-venues'], queryFn: () => venuesAPI.getAll() });
  const events = evD?.data?.data?.events || []; const bookings = bkD?.data?.data?.bookings || []; const venues = vnD?.data?.data?.venues || [];

  const createEvent = useMutation({ mutationFn: (d: any) => eventsAPI.create(d), onSuccess: () => { toast.success('Created!'); qc.invalidateQueries({ queryKey: ['admin-events'] }); setShowForm(false); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Failed') });
  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); createEvent.mutate({ ...form, genre: form.genre.split(',').map(s => s.trim()), cast: form.cast.split(',').map(s => s.trim()), tags: form.tags.split(',').map(s => s.trim()), duration: Number(form.duration) }); };

  if (user?.role !== 'admin') return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Admin access required</p></div>;

  return (
    <div style={{ paddingTop: 56 }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 24, height: 24, color: 'var(--imdb-yellow)' }} /> Admin Panel
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[{ l: 'Events', v: events.length, icon: <Film style={{ width: 20, height: 20 }} />, c: '#5799ef' }, { l: 'Bookings', v: bookings.length, icon: <Calendar style={{ width: 20, height: 20 }} />, c: '#2e7d32' }, { l: 'Venues', v: venues.length, icon: <MapPin style={{ width: 20, height: 20 }} />, c: '#e65100' }]
              .map(s => <div key={s.l} className="card" style={{ padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: s.c, fontSize: 14 }}>{s.icon} {s.l}</div><p style={{ fontSize: 28, fontWeight: 700 }}>{s.v}</p></div>)}
          </div>
          <div className="pill-tabs" style={{ marginBottom: 20 }}>
            {(['events', 'bookings', 'venues'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`pill-tab ${tab === t ? 'active' : ''}`} style={{ textTransform: 'capitalize' }}>{t}</button>)}
          </div>

          {tab === 'events' && (<div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: 16, fontSize: 13, padding: '8px 18px' }}><Plus style={{ width: 16, height: 16 }} /> Add Event</button>
            {showForm && (
              <form onSubmit={handleCreate} className="card" style={{ padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ k: 'title', l: 'Title', t: 'text' }, { k: 'category', l: 'Category', t: 'select', o: ['movie', 'concert', 'sports', 'theatre'] }, { k: 'genre', l: 'Genres (comma)', t: 'text' }, { k: 'duration', l: 'Duration (min)', t: 'number' }, { k: 'language', l: 'Language', t: 'text' }, { k: 'rating', l: 'Rating', t: 'text' }, { k: 'director', l: 'Director', t: 'text' }, { k: 'cast', l: 'Cast (comma)', t: 'text' }, { k: 'posterUrl', l: 'Poster URL', t: 'text' }, { k: 'trailerUrl', l: 'Trailer URL', t: 'text' }]
                  .map(f => <div key={f.k}><label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{f.l}</label>
                    {f.t === 'select' ? <select value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} className="input">{f.o?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                      : <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} className="input" />}</div>)}
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input" style={{ height: 80, resize: 'none' }} /></div>
                <div style={{ gridColumn: '1/-1' }}><button type="submit" className="btn-primary">Create Event</button></div>
              </form>
            )}
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}><th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Rating</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Reviews</th></tr></thead>
                <tbody>{events.map((e: any) => <tr key={e._id} style={{ borderBottom: '1px solid var(--border-light)' }}><td style={{ padding: '10px 16px', fontWeight: 500 }}>{e.title}</td><td style={{ padding: '10px 16px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{e.category}</td><td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{e.avgRating?.toFixed(1) || '-'}</td><td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{e.totalReviews}</td></tr>)}</tbody>
              </table>
            </div>
          </div>)}

          {tab === 'bookings' && (<div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}><th style={{ padding: '12px 16px', fontWeight: 600 }}>User</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Event</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th><th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th></tr></thead>
              <tbody>{bookings.map((b: any) => <tr key={b._id} style={{ borderBottom: '1px solid var(--border-light)' }}><td style={{ padding: '10px 16px', fontWeight: 500 }}>{b.user?.name}</td><td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{b.event?.title}</td><td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>₹{b.totalAmount}</td><td style={{ padding: '10px 16px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{b.status}</td></tr>)}</tbody>
            </table>
          </div>)}

          {tab === 'venues' && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {venues.map((v: any) => <div key={v._id} className="card" style={{ padding: 16 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{v.name}</h3><p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{v.location}, {v.city}</p><div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}><span>Capacity: {v.capacity}</span><span>Type: {v.hallType}</span></div></div>)}
          </div>)}
        </motion.div>
      </div>
    </div>
  );
}
