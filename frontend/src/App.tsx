import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import Movies from './pages/Movies';
import Concerts from './pages/Concerts';
import Sports from './pages/Sports';
import Theatre from './pages/Theatre';
import AdminPanel from './pages/AdminPanel';
import BookingDetail from './pages/BookingDetail';

export default function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #eee', borderTopColor: '#f5c518', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin" />
          <div style={{ background: '#f5c518', display: 'inline-block', borderRadius: 4, padding: '4px 10px', fontWeight: 900, fontSize: 18, color: '#000' }}>CB</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/theatre" element={<Theatre />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/seats/:showtimeId" element={<SeatSelection />} />
          <Route path="/checkout/:bookingId" element={<Checkout />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/booking/:id" element={<BookingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}
