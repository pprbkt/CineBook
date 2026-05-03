import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, XCircle, Download, Eye, Star } from 'lucide-react';
import { bookingsAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusColor: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
  pending: { bg: '#fff3e0', color: '#e65100' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
  refunded: { bg: '#f5f5f5', color: '#999' },
};

export default function MyBookings() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['myBookings'], queryFn: () => bookingsAPI.getMyBookings(), enabled: isAuthenticated });
  const bookings = data?.data?.data?.bookings || [];

  const handleCancel = async (id: string) => { if (!confirm('Cancel this booking?')) return; try { const r = await bookingsAPI.cancel(id); toast.success(`Cancelled. Refund: ₹${r.data.data.refundAmount}`); refetch(); } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); } };
  const handleDownload = async (id: string, code: string) => { try { const r = await bookingsAPI.downloadTicket(id); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `CineBook_${code}.pdf`; a.click(); } catch { toast.error('Download failed'); } };

  if (!isAuthenticated) return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Login Required</h2><Link to="/login" style={{ color: 'var(--accent)' }}>Sign in to view bookings</Link></div></div>;

  return (
    <div style={{ paddingTop: 56 }}>
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 900 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>My Bookings</h1>
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 8, marginBottom: 12 }} />)
          : bookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map((b: any, i: number) => {
                const st = statusColor[b.status] || statusColor.pending;
                return (
                  <motion.div key={b._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'start' }}>
                    <img src={b.event?.posterUrl} alt="" style={{ width: 64, height: 96, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>{b.event?.title}</h3>
                        <span className="cat-chip" style={{ background: st.bg, color: st.color, textTransform: 'capitalize' }}>{b.status}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 13, height: 13 }} />{b.venue?.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar style={{ width: 13, height: 13 }} />{b.showtime?.dateTime ? format(new Date(b.showtime.dateTime), 'MMM d, h:mm a') : 'N/A'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ticket style={{ width: 13, height: 13 }} />{b.seats?.map((s: any) => `${s.row}${s.number}`).join(', ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>₹{b.totalAmount}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link to={`/booking/${b._id}`} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}><Eye style={{ width: 14, height: 14 }} /> View</Link>
                          {b.status === 'confirmed' && <>
                            <button onClick={() => handleDownload(b._id, b.ticketCode)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}><Download style={{ width: 14, height: 14 }} /> Ticket</button>
                            <button onClick={() => handleCancel(b._id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12, color: '#c62828', borderColor: '#ef9a9a' }}><XCircle style={{ width: 14, height: 14 }} /> Cancel</button>
                          </>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Ticket style={{ width: 56, height: 56, color: 'var(--text-light)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No bookings yet</p>
              <Link to="/explore" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>Explore Events →</Link>
            </div>
          )}
      </div>
    </div>
  );
}
