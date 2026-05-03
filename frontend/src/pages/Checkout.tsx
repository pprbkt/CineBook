import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Ticket } from 'lucide-react';
import { bookingsAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { data } = useQuery({ queryKey: ['booking', bookingId], queryFn: () => bookingsAPI.getOne(bookingId!), enabled: !!bookingId });
  const booking = data?.data?.data?.booking;

  const handleConfirm = async () => { setConfirming(true); try { await bookingsAPI.confirm(bookingId!); setConfirmed(true); toast.success('Booking confirmed!'); } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); } finally { setConfirming(false); } };
  const handleDownload = async () => { try { const r = await bookingsAPI.downloadTicket(bookingId!); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `CineBook_${booking?.ticketCode}.pdf`; a.click(); } catch { toast.error('Download failed'); } };

  if (!booking) return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>;

  if (confirmed || booking.status === 'confirmed') return (
    <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 420, width: '100%', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#2e7d32' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your tickets are ready</p>
        <div className="card" style={{ padding: 24, textAlign: 'left', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{booking.event?.title}</h3>
          <Row label="Venue" value={booking.venue?.name} />
          <Row label="Seats" value={booking.seats?.map((s: any) => `${s.row}${s.number}`).join(', ')} />
          <Row label="Ticket" value={booking.ticketCode} highlight />
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
            <span>Total</span><span>₹{booking.totalAmount}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleDownload} className="btn-primary" style={{ flex: 1, padding: 12 }}><Ticket style={{ width: 16, height: 16 }} /> Download</button>
          <button onClick={() => navigate('/bookings')} className="btn-secondary" style={{ flex: 1, padding: 12 }}>My Bookings</button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 440, width: '100%', padding: '0 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Checkout</h1>
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{booking.event?.title}</h3>
          <Row label="Venue" value={booking.venue?.name} />
          <Row label="Date" value={booking.showtime?.dateTime && new Date(booking.showtime.dateTime).toLocaleString()} />
          <Row label="Seats" value={booking.seats?.map((s: any) => `${s.row}${s.number} (${s.type})`).join(', ')} />
          <div style={{ borderTop: '2px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            {booking.seats?.map((s: any) => <div key={s.seatId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}><span>{s.row}{s.number} ({s.type})</span><span>₹{s.price}</span></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}><span>Total</span><span>₹{booking.totalAmount}</span></div>
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard style={{ width: 20, height: 20, color: 'var(--imdb-yellow)' }} />
          <div><p style={{ fontSize: 14, fontWeight: 500 }}>Payment</p><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Demo — click confirm to simulate</p></div>
        </div>
        <button onClick={handleConfirm} disabled={confirming} className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 15 }}>
          {confirming ? 'Processing...' : `Pay ₹${booking.totalAmount} & Confirm`}
        </button>
      </motion.div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: highlight ? 'var(--accent)' : 'var(--text)', fontFamily: highlight ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}
