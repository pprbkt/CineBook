import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Ticket, Shield, Search, ChevronDown, Bookmark } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Movies', path: '/movies' },
  { label: 'Concerts', path: '/concerts' },
  { label: 'Sports', path: '/sports' },
  { label: 'Theatre', path: '/theatre' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await logout(); navigate('/'); setProfileOpen(false); };

  return (
    <nav style={{ background: 'var(--imdb-nav)', height: 56, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <div className="container-main" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            background: 'var(--imdb-yellow)', borderRadius: 4, padding: '4px 8px',
            fontWeight: 900, fontSize: 18, color: '#000', letterSpacing: '-0.5px', lineHeight: 1,
          }}>
            CB
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }} className="hidden sm:inline">
            CineBook
          </span>
        </Link>

        {/* Menu button (IMDb style) */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="hidden md:flex"
          style={{ background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '6px 12px', borderRadius: 4, fontSize: 14, fontWeight: 600 }}>
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: 580 }} className="hidden md:block">
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#999' }} />
            <input
              type="text"
              placeholder="Search CineBook"
              onClick={() => navigate('/explore')}
              readOnly
              style={{
                width: '100%', padding: '8px 14px 8px 40px', borderRadius: 4,
                border: 'none', fontSize: 14, background: '#fff', color: '#000',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              style={{
                color: location.pathname === link.path ? 'var(--imdb-yellow)' : '#fff',
                fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bookmarks */}
        <Link to="/bookings" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500 }} className="hidden md:flex">
          <Bookmark className="w-5 h-5" />
          <span className="hidden lg:inline">Bookings</span>
        </Link>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  background: 'transparent', border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 4, fontSize: 14,
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--imdb-yellow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: '#000',
                }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline" style={{ fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    style={{
                      position: 'absolute', right: 0, top: 44, width: 220, background: '#fff',
                      borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      overflow: 'hidden', zIndex: 100,
                    }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                    <Link to="/bookings" onClick={() => setProfileOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      <Ticket className="w-4 h-4" /> My Bookings
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                        fontSize: 14, color: '#c00', width: '100%', border: 'none',
                        background: 'transparent', cursor: 'pointer', borderTop: '1px solid var(--border-light)',
                      }}>
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login"
              style={{
                background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600,
                padding: '6px 12px', borderRadius: 4,
              }}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden"
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'var(--imdb-darker)', overflow: 'hidden', borderTop: '1px solid #333' }}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[{ label: 'Home', path: '/' }, ...navLinks, { label: 'Explore', path: '/explore' }].map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)}
                  style={{ color: '#fff', padding: '10px 12px', fontSize: 15, fontWeight: 500, borderRadius: 4 }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
