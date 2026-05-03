import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { bookingsAPI } from '../lib/api';
import { format } from 'date-fns';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ['booking', id], queryFn: () => bookingsAPI.getOne(id!), enabled: !!id });
  const b = data?.data?.data?.booking;

  if (!b) return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>;

  return (
    <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, width: '100%', padding: '0 16px' }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{b.event?.title}</h1>
            <span className="cat-chip" style={{ background: b.status === 'confirmed' ? '#e8f5e9' : '#fff3e0', color: b.status === 'confirmed' ? '#2e7d32' : '#e65100', marginTop: 8, textTransform: 'capitalize' }}>{b.status}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Row label="Venue" value={b.venue?.name} />
            <Row label="Date" value={b.showtime?.dateTime ? format(new Date(b.showtime.dateTime), 'EEEE, MMM d, yyyy h:mm a') : 'N/A'} />
            <Row label="Seats" value={b.seats?.map((s: any) => `${s.row}${s.number}`).join(', ')} />
            <Row label="Total" value={`₹${b.totalAmount}`} />
            <Row label="Ticket Code" value={b.ticketCode} highlight />
            {b.refundAmount != null && <Row label="Refund" value={`₹${b.refundAmount}`} />}
          </div>
          {b.qrCode && <div style={{ textAlign: 'center', marginTop: 20 }}><img src={b.qrCode} alt="QR" style={{ width: 140, height: 140, borderRadius: 8 }} /><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Present at venue</p></div>}
          <div style={{ marginTop: 24 }}><Link to="/bookings" className="btn-secondary" style={{ width: '100%', padding: 12 }}>← Back to Bookings</Link></div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight ? 'var(--accent)' : 'var(--text)', fontFamily: highlight ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}
