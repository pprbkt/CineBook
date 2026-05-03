import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Eye, RotateCcw } from 'lucide-react';
import { showtimesAPI, bookingsAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { getSocket, connectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

/* ---- Realistic 3D Cinema ---- */
function CinemaScene({ selectedSeat, venue }: { selectedSeat: any; venue: any }) {
  const sW = venue?.screenWidth || 16;
  const sH = venue?.screenHeight || 9;
  const rows = venue?.seatLayout ? Math.max(...venue.seatLayout.map((s: any) => s.row.charCodeAt(0) - 64)) : 10;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <spotLight position={[0, 12, -2]} intensity={0.6} angle={0.5} penumbra={0.5} castShadow color="#ffeedd" />
      <pointLight position={[-8, 6, 8]} intensity={0.3} color="#4488ff" />
      <pointLight position={[8, 6, 8]} intensity={0.3} color="#4488ff" />
      <pointLight position={[0, 1, -2]} intensity={0.8} color="#ffffff" distance={15} />

      {/* Cinema screen — glowing white */}
      <mesh position={[0, sH / 2 + 2, -1]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Screen frame */}
      <mesh position={[0, sH / 2 + 2, -1.05]}>
        <planeGeometry args={[sW + 0.4, sH + 0.4]} />
        <meshStandardMaterial color="#111111" side={THREE.DoubleSide} />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, rows * 0.6]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 14, rows * 0.3]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 14, 7, rows * 0.3]} rotation={[0, -side * Math.PI / 2, 0]}>
          <planeGeometry args={[30, 16]} />
          <meshStandardMaterial color="#1a1010" roughness={0.9} />
        </mesh>
      ))}

      {/* Seat rows — 3D boxes */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <group key={rowIdx} position={[0, rowIdx * 0.15, rowIdx * 1.2 + 2]}>
          {Array.from({ length: 14 }).map((_, colIdx) => {
            const x = (colIdx - 6.5) * 1.0;
            return (
              <group key={colIdx} position={[x, 0, 0]}>
                {/* Seat back */}
                <mesh position={[0, 0.5, -0.15]} castShadow>
                  <boxGeometry args={[0.7, 0.7, 0.1]} />
                  <meshStandardMaterial color="#cc2222" roughness={0.7} />
                </mesh>
                {/* Seat bottom */}
                <mesh position={[0, 0.15, 0.1]} castShadow>
                  <boxGeometry args={[0.7, 0.1, 0.4]} />
                  <meshStandardMaterial color="#aa1111" roughness={0.7} />
                </mesh>
                {/* Armrests */}
                {[-0.38, 0.38].map((ax) => (
                  <mesh key={ax} position={[ax, 0.3, 0]}>
                    <boxGeometry args={[0.06, 0.5, 0.5]} />
                    <meshStandardMaterial color="#333" roughness={0.5} metalness={0.3} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      ))}

      {/* Aisle lights */}
      {Array.from({ length: rows }).map((_, i) => (
        <pointLight key={i} position={[-7, 0.1, i * 1.2 + 2]} intensity={0.1} color="#f5c518" distance={3} />
      ))}

      {/* Camera from selected seat */}
      {selectedSeat && (
        <PerspectiveCamera
          makeDefault
          position={[
            (selectedSeat.number - 7.5) * 1.0,
            (selectedSeat.row.charCodeAt(0) - 65) * 0.15 + 1.2,
            (selectedSeat.row.charCodeAt(0) - 65) * 1.2 + 2
          ]}
          fov={60} near={0.1} far={100}
        />
      )}

      <OrbitControls
        target={[0, sH / 2 + 2, -1]}
        maxPolarAngle={Math.PI * 0.55}
        minDistance={2}
        maxDistance={20}
        enablePan={false}
      />
    </>
  );
}

export default function SeatSelection() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
  const [previewSeat, setPreviewSeat] = useState<any>(null);
  const [show3D, setShow3D] = useState(false);
  const [booking, setBooking] = useState(false);

  const { data } = useQuery({ queryKey: ['showtime', showtimeId], queryFn: () => showtimesAPI.getOne(showtimeId!), enabled: !!showtimeId });
  const { data: recData } = useQuery({ queryKey: ['seat-rec', showtimeId], queryFn: () => showtimesAPI.getSeatRecommendations(showtimeId!), enabled: !!showtimeId });

  const showtime = data?.data?.data?.showtime;
  const venue = showtime?.venue;
  const event = showtime?.event;
  const bookedSeats = showtime?.bookedSeats || [];
  const seatLayout = venue?.seatLayout || [];
  const recSeats = recData?.data?.data?.recommendations || [];
  const recSeatIds = new Set(recSeats.map((r: any) => r.seat._id));

  useEffect(() => {
    if (!showtimeId || !token) return;
    const socket = connectSocket(token);
    socket.emit('showtime:join', showtimeId);
    socket.emit('seats:getLocks', showtimeId);
    socket.on('seats:currentLocks', (d: any) => setLockedSeats(d.locks || {}));
    socket.on('seat:locked', (d: any) => { if (d.userId !== user?._id) setLockedSeats(p => ({ ...p, [d.seatId]: d.userId })); });
    socket.on('seat:unlocked', (d: any) => { setLockedSeats(p => { const n = { ...p }; delete n[d.seatId]; return n; }); });
    socket.on('seats:booked', () => toast('Seats updated by another user', { icon: '🔄' }));
    return () => { socket.emit('showtime:leave', showtimeId); socket.off('seats:currentLocks'); socket.off('seat:locked'); socket.off('seat:unlocked'); socket.off('seats:booked'); };
  }, [showtimeId, token, user]);

  const toggleSeat = useCallback((seatId: string) => {
    const socket = getSocket();
    if (selectedSeats.includes(seatId)) { setSelectedSeats(p => p.filter(i => i !== seatId)); socket.emit('seat:unlock', { showtimeId, seatId }); }
    else { if (selectedSeats.length >= 10) { toast.error('Max 10 seats'); return; } socket.emit('seat:lock', { showtimeId, seatId }); setSelectedSeats(p => [...p, seatId]); }
  }, [selectedSeats, showtimeId]);

  const handleBooking = async () => {
    if (!selectedSeats.length) { toast.error('Select seats first'); return; }
    setBooking(true);
    try { const res = await bookingsAPI.create({ showtimeId, seatIds: selectedSeats }); navigate(`/checkout/${res.data.data.booking._id}`); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Booking failed'); } finally { setBooking(false); }
  };

  const rows = seatLayout.reduce((acc: Record<string, any[]>, s: any) => { if (!acc[s.row]) acc[s.row] = []; acc[s.row].push(s); return acc; }, {});

  const getSeatColor = (seat: any): { bg: string; border: string; text: string } => {
    const id = seat._id;
    if (bookedSeats.includes(id)) return { bg: '#e5e5e5', border: '#ccc', text: '#aaa' };
    if (selectedSeats.includes(id)) return { bg: 'var(--imdb-yellow)', border: '#c9a300', text: '#000' };
    if (lockedSeats[id] && lockedSeats[id] !== user?._id) return { bg: '#ffcdd2', border: '#e57373', text: '#c62828' };
    if (recSeatIds.has(id)) return { bg: '#c8e6c9', border: '#66bb6a', text: '#2e7d32' };
    if (seat.type === 'vip') return { bg: '#fff3e0', border: '#ffb74d', text: '#e65100' };
    if (seat.type === 'premium') return { bg: '#e3f2fd', border: '#64b5f6', text: '#1565c0' };
    return { bg: '#fff', border: '#ddd', text: '#333' };
  };

  const totalPrice = selectedSeats.reduce((s, id) => s + (seatLayout.find((x: any) => x._id === id)?.price || 0), 0);

  if (!showtime) return <div style={{ paddingTop: 56, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></div>;

  return (
    <div style={{ paddingTop: 56, paddingBottom: selectedSeats.length > 0 ? 80 : 40 }}>
      <div className="container-main" style={{ paddingTop: 24 }}>
        {/* Header */}
        <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={event?.posterUrl} alt="" style={{ width: 48, height: 72, borderRadius: 4, objectFit: 'cover' }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{event?.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{venue?.name} · {new Date(showtime.dateTime).toLocaleString()}</p>
          </div>
          <button onClick={() => setShow3D(!show3D)} className="btn-secondary" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 13 }}>
            <Eye style={{ width: 16, height: 16 }} /> {show3D ? 'Hide' : '3D View'}
          </button>
        </div>

        {/* 3D Preview */}
        {show3D && previewSeat && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 420 }} className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
              🎬 View from Seat {previewSeat.row}{previewSeat.number} — Drag to look around
            </div>
            <Suspense fallback={<div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading 3D cinema...</div>}>
              <Canvas shadows style={{ height: 380, background: '#0a0a0a' }}>
                <CinemaScene selectedSeat={previewSeat} venue={venue} />
              </Canvas>
            </Suspense>
          </motion.div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          {[
            { l: 'Standard', bg: '#fff', b: '#ddd' }, { l: 'Premium', bg: '#e3f2fd', b: '#64b5f6' },
            { l: 'VIP', bg: '#fff3e0', b: '#ffb74d' }, { l: 'Selected', bg: '#f5c518', b: '#c9a300' },
            { l: 'Booked', bg: '#e5e5e5', b: '#ccc' }, { l: 'Recommended', bg: '#c8e6c9', b: '#66bb6a' },
          ].map(x => <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 20, height: 20, borderRadius: 4, background: x.bg, border: `2px solid ${x.b}` }} />{x.l}</div>)}
        </div>

        {/* Screen indicator */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ maxWidth: 400, margin: '0 auto', height: 4, background: 'linear-gradient(90deg, transparent 0%, var(--imdb-yellow) 20%, var(--imdb-yellow) 80%, transparent 100%)', borderRadius: 4 }} />
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-light)', marginTop: 6 }}>SCREEN THIS WAY</p>
        </div>

        {/* Seat map */}
        <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 500 }}>
            {Object.entries(rows).sort().map(([row, seats]: [string, any[]]) => (
              <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 20, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 8 }}>{row}</span>
                {seats.sort((a, b) => a.number - b.number).map(seat => {
                  const id = seat._id;
                  const disabled = bookedSeats.includes(id) || (lockedSeats[id] && lockedSeats[id] !== user?._id);
                  const c = getSeatColor(seat);
                  return (
                    <button key={id} disabled={disabled}
                      onClick={() => { toggleSeat(id); setPreviewSeat(seat); if (!show3D) setShow3D(true); }}
                      style={{
                        width: 32, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: c.bg, border: `2px solid ${c.border}`, color: c.text,
                        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title={`${seat.row}${seat.number} · ${seat.type} · ₹${seat.price}`}>
                      {seat.number}
                    </button>
                  );
                })}
                <span style={{ width: 20, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 8 }}>{row}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations */}
        {recSeats.length > 0 && selectedSeats.length === 0 && (
          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles style={{ width: 18, height: 18, color: 'var(--imdb-yellow)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Smart Seat Picks</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {recSeats.slice(0, 5).map((r: any) => (
                <button key={r.seat._id}
                  onClick={() => { toggleSeat(r.seat._id); setPreviewSeat(r.seat); setShow3D(true); }}
                  className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontWeight: 700 }}>{r.seat.row}{r.seat.number}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{r.seat.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom checkout bar */}
      {selectedSeats.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            background: '#fff', borderTop: '2px solid var(--imdb-yellow)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', padding: '12px 0',
          }}>
          <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected</p><p style={{ fontSize: 22, fontWeight: 700 }}>₹{totalPrice}</p></div>
            <button onClick={handleBooking} disabled={booking} className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
              {booking ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
