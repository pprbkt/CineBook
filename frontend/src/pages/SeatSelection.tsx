import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Eye, RotateCcw, Maximize2 } from 'lucide-react';
import { showtimesAPI, bookingsAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { getSocket, connectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

/* ---- Animated Camera ---- */
function AnimatedCamera({ target, lookAt, fov = 60, controlsRef }: { target: [number,number,number]; lookAt: [number,number,number]; fov?: number; controlsRef: any }) {
  const { camera } = useThree();
  const posRef = useRef(new THREE.Vector3(...target));
  const lookRef = useRef(new THREE.Vector3(...lookAt));
  useEffect(() => { posRef.current.set(...target); lookRef.current.set(...lookAt); }, [target, lookAt]);
  useFrame(() => {
    // Only animate if far from target so user can still manually drag around once arrived
    if (camera.position.distanceTo(posRef.current) > 0.05) {
      camera.position.lerp(posRef.current, 0.04);
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((camera as THREE.PerspectiveCamera).fov, fov, 0.04);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    if (controlsRef.current && controlsRef.current.target.distanceTo(lookRef.current) > 0.05) {
      controlsRef.current.target.lerp(lookRef.current, 0.04);
      controlsRef.current.update();
    }
  });
  return null;
}

/* ---- Realistic Cinema Seat ---- */
function Seat3D({ position, color, emissive, selected, onClick, booked }: any) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useFrame(() => {
    if (!ref.current) return;
    const s = selected ? 1.12 : hovered ? 1.06 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
  });
  const velvet = { roughness: 0.85, metalness: 0.0 };
  const metal = { roughness: 0.3, metalness: 0.8, color: '#2a2a2a' };
  const ei = selected ? 0.4 : hovered ? 0.15 : 0.03;
  return (
    <group ref={ref} position={position} rotation={[0, Math.PI, 0]} onClick={onClick}
      onPointerOver={() => { if (!booked) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}>
      {/* Backrest - slightly curved using cylinder slice */}
      <mesh position={[0, 0.52, -0.16]} castShadow>
        <boxGeometry args={[0.68, 0.72, 0.1]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} {...velvet} />
      </mesh>
      {/* Backrest top padding (rounded) */}
      <mesh position={[0, 0.9, -0.16]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.1, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} {...velvet} />
      </mesh>
      {/* Seat cushion (thicker, slightly angled) */}
      <mesh position={[0, 0.14, 0.06]} rotation={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[0.68, 0.14, 0.4]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei * 0.7} {...velvet} />
      </mesh>
      {/* Left armrest */}
      <group position={[-0.4, 0, 0]}>
        <mesh position={[0, 0.32, -0.04]}>
          <boxGeometry args={[0.07, 0.5, 0.5]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* Armrest pad */}
        <mesh position={[0, 0.58, 0.05]}>
          <boxGeometry args={[0.09, 0.04, 0.32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Cup holder ring */}
        <mesh position={[0, 0.59, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.012, 8, 16]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </group>
      {/* Right armrest */}
      <group position={[0.4, 0, 0]}>
        <mesh position={[0, 0.32, -0.04]}>
          <boxGeometry args={[0.07, 0.5, 0.5]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.58, 0.05]}>
          <boxGeometry args={[0.09, 0.04, 0.32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.59, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.012, 8, 16]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </group>
      {/* Pedestal leg (center) */}
      <mesh position={[0, -0.08, -0.02]}>
        <cylinderGeometry args={[0.04, 0.06, 0.2, 8]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, -0.18, -0.02]}>
        <boxGeometry args={[0.5, 0.02, 0.35]} />
        <meshStandardMaterial {...metal} />
      </mesh>
    </group>
  );
}

/* ---- Full Cinema Scene ---- */
function CinemaScene({ seatLayout, bookedSeats, selectedSeats, lockedSeats, userId, recSeatIds, onSeatClick, viewMode, selectedSeatObj, venue }: any) {
  const controlsRef = useRef<any>(null);
  const sW = venue?.screenWidth || 16, sH = venue?.screenHeight || 9;
  const rowLetters = [...new Set(seatLayout.map((s: any) => s.row))].sort() as string[];
  const numRows = rowLetters.length || 10;
  const maxCols = Math.max(...seatLayout.map((s: any) => s.number), 12);
  const rowSpacing = 1.3, colSpacing = 1.0, seatY = 0.18;

  const getSeatColor = (seat: any) => {
    const id = seat._id;
    if (bookedSeats.includes(id)) return { color: '#444', emissive: '#222' };
    if (selectedSeats.includes(id)) return { color: '#f5c518', emissive: '#f5c518' };
    if (lockedSeats[id] && lockedSeats[id] !== userId) return { color: '#cc3333', emissive: '#ff4444' };
    if (recSeatIds.has(id)) return { color: '#33aa55', emissive: '#44dd66' };
    if (seat.type === 'vip') return { color: '#dd6600', emissive: '#ff8800' };
    if (seat.type === 'premium') return { color: '#3366cc', emissive: '#4488ee' };
    return { color: '#cc2222', emissive: '#881111' };
  };

  // Camera positions — screen is at far end (large Z), seats at small Z
  const totalDepth = numRows * rowSpacing + 2;
  const overviewPos: [number,number,number] = [0, numRows * 1.2 + 8, -4];
  const overviewLook: [number,number,number] = [0, 0, totalDepth * 0.5];
  let camPos = overviewPos, camLook = overviewLook, camFov = 55;

  if (viewMode === 'pov' && selectedSeatObj) {
    const ri = rowLetters.indexOf(selectedSeatObj.row);
    const x = (selectedSeatObj.number - (maxCols + 1) / 2) * colSpacing;
    const z = ri * rowSpacing + 2;
    const y = ri * seatY + 1.3;
    camPos = [x, y, z + 0.4];
    camLook = [x, y, z + 10]; // Look forward slightly, allowing manual rotation
    camFov = 65;
  }

  const screenZ = totalDepth + 5;
  const wallHalf = maxCols * colSpacing / 2 + 3;

  return (
    <>
      <AnimatedCamera target={camPos} lookAt={camLook} fov={camFov} controlsRef={controlsRef} />
      {/* Lighting - Bright indoor lighting to match light theme */}
      <ambientLight intensity={0.65} />
      <spotLight position={[0, 16, screenZ]} intensity={0.4} angle={0.5} penumbra={0.6} castShadow color="#ffffff" />
      <pointLight position={[0, 3, screenZ]} intensity={0.8} color="#ffffff" distance={25} />
      {/* Ceiling downlights */}
      <spotLight position={[0, 14, totalDepth * 0.3]} intensity={0.4} angle={0.8} penumbra={1} color="#ffffff" />
      <spotLight position={[0, 14, totalDepth * 0.7]} intensity={0.4} angle={0.8} penumbra={1} color="#ffffff" />

      {/* Screen (at far end, facing -Z toward seats) */}
      <mesh position={[0, sH / 2 + 2.5, screenZ]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#ffffff" emissive="#eeeeff" emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, sH / 2 + 2.5, screenZ + 0.06]}>
        <planeGeometry args={[sW + 0.6, sH + 0.6]} />
        <meshStandardMaterial color="#333333" side={THREE.DoubleSide} />
      </mesh>
      {/* Screen surround trim */}
      <mesh position={[0, sH / 2 + 2.5, screenZ + 0.08]}>
        <planeGeometry args={[sW + 0.8, sH + 0.8]} />
        <meshStandardMaterial color="#eeeeee" side={THREE.DoubleSide} />
      </mesh>

      {/* Floor — light carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, totalDepth / 2]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.9} />
      </mesh>

      {/* Ceiling — light panels */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 16, totalDepth / 2]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#fafafa" roughness={0.9} />
      </mesh>

      {/* Side walls with paneling */}
      {[-1, 1].map(side => (
        <React.Fragment key={side}>
          <mesh position={[side * wallHalf, 8, totalDepth / 2]} rotation={[0, -side * Math.PI / 2, 0]}>
            <planeGeometry args={[50, 20]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
          </mesh>
          {/* Wall accent strip */}
          <mesh position={[side * (wallHalf - 0.01), 1, totalDepth / 2]} rotation={[0, -side * Math.PI / 2, 0]}>
            <planeGeometry args={[50, 0.06]} />
            <meshStandardMaterial color="#f5c518" emissive="#f5c518" emissiveIntensity={0.2} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Back wall (behind the seats and camera) */}
      <mesh position={[0, 8, -8]}>
        <planeGeometry args={[50, 20]} />
        <meshStandardMaterial color="#eaeaea" roughness={0.9} />
      </mesh>

      {/* Exit signs */}
      {[-1, 1].map(side => (
        <mesh key={`exit${side}`} position={[side * (wallHalf - 0.5), 3.5, 0.5]} rotation={[0, -side * Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.25]} />
          <meshStandardMaterial color="#00cc00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Aisle step lights */}
      {rowLetters.map((_, i) => (
        <React.Fragment key={i}>
          <pointLight position={[-(wallHalf - 1.5), 0.05, i * rowSpacing + 2]} intensity={0.06} color="#f5c518" distance={2} />
          <pointLight position={[(wallHalf - 1.5), 0.05, i * rowSpacing + 2]} intensity={0.06} color="#f5c518" distance={2} />
          {/* Step light mesh */}
          <mesh position={[-(wallHalf - 1.5), 0.02, i * rowSpacing + 2]}>
            <boxGeometry args={[0.2, 0.02, 0.08]} />
            <meshStandardMaterial emissive="#f5c518" emissiveIntensity={0.6} color="#332200" />
          </mesh>
          <mesh position={[(wallHalf - 1.5), 0.02, i * rowSpacing + 2]}>
            <boxGeometry args={[0.2, 0.02, 0.08]} />
            <meshStandardMaterial emissive="#f5c518" emissiveIntensity={0.6} color="#332200" />
          </mesh>
        </React.Fragment>
      ))}

      {/* Stepped floor risers for stadium seating */}
      {rowLetters.map((_, ri) => (
        <mesh key={`riser${ri}`} position={[0, ri * seatY - 0.25, ri * rowSpacing + 2]}>
          <boxGeometry args={[maxCols * colSpacing + 2, 0.06, rowSpacing * 0.9]} />
          <meshStandardMaterial color="#d5d5d5" roughness={0.95} />
        </mesh>
      ))}

      {/* 3D Seats — facing toward screen (+Z) */}
      {seatLayout.map((seat: any) => {
        const ri = rowLetters.indexOf(seat.row);
        const x = (seat.number - (maxCols + 1) / 2) * colSpacing;
        const z = ri * rowSpacing + 2;
        const y = ri * seatY;
        const { color, emissive } = getSeatColor(seat);
        const isBooked = bookedSeats.includes(seat._id);
        const isLocked = lockedSeats[seat._id] && lockedSeats[seat._id] !== userId;
        return (
          <Seat3D key={seat._id} position={[x, y, z]}
            color={color} emissive={emissive} booked={isBooked || isLocked}
            selected={selectedSeats.includes(seat._id)}
            onClick={isBooked || isLocked ? undefined : (e: any) => { e.stopPropagation(); onSeatClick(seat); }}
          />
        );
      })}

      <OrbitControls ref={controlsRef} enablePan={false} maxPolarAngle={Math.PI * 0.48} minDistance={viewMode === 'pov' ? 0.01 : 3} maxDistance={40} />
    </>
  );
}

/* ---- Main Component ---- */
export default function SeatSelection() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
  const [previewSeat, setPreviewSeat] = useState<any>(null);
  const [show3D, setShow3D] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'pov'>('overview');
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
    socket.on('seats:booked', () => toast('Seats updated', { icon: '🔄' }));
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

  const handle3DSeatClick = (seat: any) => {
    toggleSeat(seat._id);
    setPreviewSeat(seat);
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
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{event?.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{venue?.name} · {new Date(showtime.dateTime).toLocaleString()}</p>
          </div>
          <button onClick={() => { setShow3D(!show3D); setViewMode('overview'); }} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
            <Eye style={{ width: 16, height: 16 }} /> {show3D ? 'Hide 3D' : '3D View'}
          </button>
        </div>

        {/* 3D Cinema View */}
        {show3D && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 520 }} transition={{ duration: 0.4 }}
            className="card" style={{ marginBottom: 20, overflow: 'hidden', position: 'relative' }}>
            {/* Controls overlay */}
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'start', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(0,0,0,0.75)', borderRadius: 8, padding: '8px 14px', pointerEvents: 'auto' }}>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  {viewMode === 'overview' ? '🎬 3D Theater Overview' : `👁 View from Seat ${previewSeat?.row}${previewSeat?.number}`}
                </p>
                <p style={{ color: '#aaa', fontSize: 11 }}>
                  {viewMode === 'overview' ? 'Click any seat to select · Drag to rotate' : 'Drag to look around'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
                {viewMode === 'pov' && (
                  <button onClick={() => setViewMode('overview')}
                    style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RotateCcw style={{ width: 14, height: 14 }} /> Overview
                  </button>
                )}
                {previewSeat && viewMode === 'overview' && (
                  <button onClick={() => setViewMode('pov')}
                    style={{ background: '#f5c518', color: '#000', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye style={{ width: 14, height: 14 }} /> View from {previewSeat.row}{previewSeat.number}
                  </button>
                )}
              </div>
            </div>
            {/* Legend overlay */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.75)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 12 }}>
              {[{ l: 'Available', c: '#cc2222' }, { l: 'Selected', c: '#f5c518' }, { l: 'Premium', c: '#3366cc' }, { l: 'VIP', c: '#dd6600' }, { l: 'Booked', c: '#444' }, { l: 'Recommended', c: '#33aa55' }]
                .map(x => <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ccc' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} />{x.l}</div>)}
            </div>

            <Suspense fallback={<div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f1', color: '#666' }}>Loading 3D cinema...</div>}>
              <Canvas shadows style={{ height: 520, background: '#f5f5f1' }}>
                <CinemaScene
                  seatLayout={seatLayout} bookedSeats={bookedSeats} selectedSeats={selectedSeats}
                  lockedSeats={lockedSeats} userId={user?._id} recSeatIds={recSeatIds}
                  onSeatClick={handle3DSeatClick} viewMode={viewMode} selectedSeatObj={previewSeat} venue={venue}
                />
              </Canvas>
            </Suspense>
          </motion.div>
        )}

        {/* Legend (2D) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          {[{ l: 'Standard', bg: '#fff', b: '#ddd' }, { l: 'Premium', bg: '#e3f2fd', b: '#64b5f6' }, { l: 'VIP', bg: '#fff3e0', b: '#ffb74d' }, { l: 'Selected', bg: '#f5c518', b: '#c9a300' }, { l: 'Booked', bg: '#e5e5e5', b: '#ccc' }, { l: 'Recommended', bg: '#c8e6c9', b: '#66bb6a' }]
            .map(x => <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 20, height: 20, borderRadius: 4, background: x.bg, border: `2px solid ${x.b}` }} />{x.l}</div>)}
        </div>

        {/* Screen indicator */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ maxWidth: 400, margin: '0 auto', height: 4, background: 'linear-gradient(90deg, transparent 0%, var(--imdb-yellow) 20%, var(--imdb-yellow) 80%, transparent 100%)', borderRadius: 4 }} />
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-light)', marginTop: 6 }}>SCREEN THIS WAY</p>
        </div>

        {/* 2D Seat map */}
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
                      onClick={() => { toggleSeat(id); setPreviewSeat(seat); if (show3D) setViewMode('pov'); }}
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
                  onClick={() => { toggleSeat(r.seat._id); setPreviewSeat(r.seat); setShow3D(true); setViewMode('pov'); }}
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
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: '#fff', borderTop: '2px solid var(--imdb-yellow)', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', padding: '12px 0' }}>
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
