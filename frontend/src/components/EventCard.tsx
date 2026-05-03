import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Plus } from 'lucide-react';

const catClass: Record<string, string> = {
  movie: 'cat-movie', concert: 'cat-concert', sports: 'cat-sports', theatre: 'cat-theatre',
};

export default function EventCard({ event }: { event: any }) {
  return (
    <Link to={`/event/${event._id}`} className="poster-card" style={{ width: '100%' }}>
      {/* Poster */}
      <div style={{ position: 'relative' }}>
        <img src={event.posterUrl || ''} alt={event.title} className="poster-img"
          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%23e5e5e5" width="200" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="14">No Image</text></svg>'; }}
        />
        {/* Bookmark button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{
            position: 'absolute', top: 4, left: 4, width: 32, height: 40,
            background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '0 0 4px 4px', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)',
          }}>
          <Plus style={{ width: 16, height: 16, color: '#fff' }} />
        </button>
        {/* Rating */}
        {event.avgRating > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center',
            gap: 4, background: 'rgba(0,0,0,0.75)', padding: '3px 8px', borderRadius: 4,
          }}>
            <Star style={{ width: 14, height: 14, color: '#f5c518', fill: '#f5c518' }} />
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{event.avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="poster-info">
        <div className="poster-title">{event.title}</div>
        <div className="poster-meta">
          {event.genre?.slice(0, 2).join(' · ')}
          {event.duration ? ` · ${event.duration}m` : ''}
        </div>
      </div>
    </Link>
  );
}
