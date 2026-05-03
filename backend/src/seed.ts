import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { User } from './models/User';
import { Event } from './models/Event';
import { Venue } from './models/Venue';
import { Showtime } from './models/Showtime';
import { Review } from './models/Review';
import { UserPreference } from './models/UserPreference';
import { Booking } from './models/Booking';

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Event.deleteMany({}), Venue.deleteMany({}),
    Showtime.deleteMany({}), Review.deleteMany({}), UserPreference.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  // Create users
  const hashedPw = await bcrypt.hash('password123', 12);
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@cinebook.app', password: hashedPw, role: 'admin', isVerified: true },
    { name: 'Dhanush HS', email: 'dhanush@test.com', password: hashedPw, role: 'user', isVerified: true },
    { name: 'Abhilasha A', email: 'abhilasha@test.com', password: hashedPw, role: 'user', isVerified: true },
    { name: 'Akash J', email: 'akash@test.com', password: hashedPw, role: 'user', isVerified: true },
    { name: 'Darshan IC', email: 'darshan@test.com', password: hashedPw, role: 'user', isVerified: true },
  ]);

  // Create user preferences
  for (const u of users) {
    await UserPreference.create({ user: u._id });
  }

  // Helper to generate seat layout
  function generateSeatLayout(rows: number, seatsPerRow: number) {
    const layout: any[] = [];
    for (let r = 0; r < rows; r++) {
      const row = String.fromCharCode(65 + r);
      const type = r < 2 ? 'vip' : r < 5 ? 'premium' : 'standard';
      const price = type === 'vip' ? 500 : type === 'premium' ? 350 : 200;
      for (let s = 1; s <= seatsPerRow; s++) {
        layout.push({
          row, number: s, type, price,
          x: (s - seatsPerRow / 2 - 0.5) * 0.8,
          y: 0.5 + r * 0.1,
          z: 3 + r * 1.2,
          isAccessible: r === rows - 1 && (s === 1 || s === seatsPerRow),
        });
      }
    }
    return layout;
  }

  // Create venues
  const venues = await Venue.insertMany([
    {
      name: 'CineMax IMAX', location: 'MG Road, Bangalore', city: 'Bangalore',
      capacity: 120, seatLayout: generateSeatLayout(10, 12),
      screenWidth: 18, screenHeight: 10, screenDistance: 5, hallType: 'imax',
      amenities: ['Dolby Atmos', 'Recliner Seats', 'F&B Counter', 'Parking'],
    },
    {
      name: 'PVR Gold', location: 'Orion Mall, Bangalore', city: 'Bangalore',
      capacity: 80, seatLayout: generateSeatLayout(8, 10),
      screenWidth: 15, screenHeight: 8, screenDistance: 4, hallType: 'dolby',
      amenities: ['Premium Sound', 'Luxury Seats', 'Lounge', 'Valet Parking'],
    },
    {
      name: 'Open Air Arena', location: 'Palace Grounds, Bangalore', city: 'Bangalore',
      capacity: 200, seatLayout: generateSeatLayout(15, 14),
      screenWidth: 25, screenHeight: 15, screenDistance: 8, hallType: 'open_air',
      amenities: ['Open Sky', 'Food Stalls', 'Parking', 'Restrooms'],
    },
    {
      name: 'Royal Theatre', location: 'Koramangala, Bangalore', city: 'Bangalore',
      capacity: 100, seatLayout: generateSeatLayout(10, 10),
      screenWidth: 12, screenHeight: 7, screenDistance: 4, hallType: 'standard',
      amenities: ['AC', 'Snack Bar', 'Wheelchair Access'],
    },
  ]);

  // Create events
  const events = await Event.insertMany([
    {
      title: 'Interstellar: IMAX Re-release', category: 'movie', genre: ['Sci-Fi', 'Drama', 'Adventure'],
      duration: 169, language: 'English', rating: 'PG-13', director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival. Experience the breathtaking visuals on IMAX.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      tags: ['space', 'time', 'IMAX', 'epic', 'nolan'], avgRating: 4.8, totalReviews: 42,
      isActive: true, isFeatured: true, releaseDate: new Date('2024-12-01'),
    },
    {
      title: 'Oppenheimer', category: 'movie', genre: ['Biography', 'Drama', 'History'],
      duration: 180, language: 'English', rating: 'R', director: 'Christopher Nolan',
      cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
      description: 'The story of J. Robert Oppenheimer and the creation of the atomic bomb.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      tags: ['biography', 'war', 'oscar', 'nolan'], avgRating: 4.6, totalReviews: 38,
      isActive: true, isFeatured: true, releaseDate: new Date('2024-07-21'),
    },
    {
      title: 'Dune: Part Three', category: 'movie', genre: ['Sci-Fi', 'Action', 'Adventure'],
      duration: 166, language: 'English', rating: 'PG-13', director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Florence Pugh'],
      description: 'The epic conclusion to the Dune saga. Paul Atreides faces his ultimate destiny.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
      tags: ['desert', 'epic', 'sci-fi', 'action'], avgRating: 4.5, totalReviews: 25,
      isActive: true, isFeatured: true, releaseDate: new Date('2026-05-15'),
    },
    {
      title: 'Coldplay: Music of the Spheres Tour', category: 'concert', genre: ['Pop', 'Rock', 'Alternative'],
      duration: 180, language: 'English',
      cast: ['Chris Martin', 'Jonny Buckland', 'Guy Berryman', 'Will Champion'],
      description: 'Experience the magic of Coldplay live! An unforgettable night of music, lights, and connection.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      tags: ['live', 'music', 'concert', 'coldplay', 'pop'], avgRating: 4.9, totalReviews: 67,
      isActive: true, isFeatured: true, releaseDate: new Date('2026-06-20'),
    },
    {
      title: 'IPL 2026 Finals', category: 'sports', genre: ['Cricket', 'T20'],
      duration: 240, language: 'English',
      description: 'The grand finale of IPL 2026! Watch the two best teams battle it out.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eYcSjCMnTUz.jpg',
      tags: ['cricket', 'ipl', 'sports', 'live', 'finals'], avgRating: 4.7, totalReviews: 89,
      isActive: true, isFeatured: true, releaseDate: new Date('2026-05-25'),
    },
    {
      title: 'Hamlet — Royal Shakespeare Company', category: 'theatre', genre: ['Drama', 'Classic', 'Shakespeare'],
      duration: 150, language: 'English', director: 'Sam Mendes',
      cast: ['Benedict Cumberbatch'],
      description: 'A modern interpretation of Shakespeare\'s greatest tragedy by the Royal Shakespeare Company.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg',
      tags: ['theatre', 'shakespeare', 'drama', 'classic'], avgRating: 4.4, totalReviews: 18,
      isActive: true, isFeatured: false, releaseDate: new Date('2026-04-10'),
    },
    {
      title: 'The Dark Knight Returns', category: 'movie', genre: ['Action', 'Thriller', 'Superhero'],
      duration: 155, language: 'English', rating: 'PG-13', director: 'Matt Reeves',
      cast: ['Robert Pattinson', 'Zoë Kravitz'],
      description: 'Batman faces his greatest challenge yet as Gotham descends into chaos.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      tags: ['batman', 'dc', 'superhero', 'action', 'thriller'], avgRating: 4.3, totalReviews: 32,
      isActive: true, isFeatured: false, releaseDate: new Date('2026-07-04'),
    },
    {
      title: 'AR Rahman Live', category: 'concert', genre: ['Indian Classical', 'Film Music', 'World'],
      duration: 200, language: 'Tamil',
      cast: ['AR Rahman'],
      description: 'The Mozart of Madras performs his greatest hits live. A musical journey spanning decades.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/xBHvZcjRiWyobQ9kxBhO6B2dtRI.jpg',
      tags: ['rahman', 'live', 'music', 'indian', 'bollywood'], avgRating: 4.8, totalReviews: 55,
      isActive: true, isFeatured: true, releaseDate: new Date('2026-06-15'),
    },
  ]);

  // Create showtimes (next 7 days)
  const showtimes: any[] = [];
  const times = ['10:00', '13:30', '17:00', '20:30'];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const event of events) {
      const venueIdx = event.category === 'concert' || event.category === 'sports' ? 2 :
                       event.category === 'theatre' ? 3 : dayOffset % 2 === 0 ? 0 : 1;
      const venue = venues[venueIdx];
      for (const time of times.slice(0, event.category === 'movie' ? 4 : 2)) {
        const dt = new Date();
        dt.setDate(dt.getDate() + dayOffset);
        const [h, m] = time.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        const end = new Date(dt.getTime() + event.duration * 60000);
        showtimes.push({ event: event._id, venue: venue._id, dateTime: dt, endTime: end });
      }
    }
  }
  await Showtime.insertMany(showtimes);

  // Create reviews
  const reviewData = [
    { user: users[1]._id, event: events[0]._id, rating: 5, title: 'Mind-blowing in IMAX!', comment: 'The visuals and Zimmer\'s score hit different on the big screen.', isVerified: true },
    { user: users[2]._id, event: events[0]._id, rating: 5, title: 'A masterpiece', comment: 'One of the greatest films ever made. Must watch in IMAX.', isVerified: true },
    { user: users[3]._id, event: events[1]._id, rating: 4, title: 'Intense and gripping', comment: 'Cillian Murphy delivers a career-defining performance.', isVerified: true },
    { user: users[1]._id, event: events[3]._id, rating: 5, title: 'Best concert ever!', comment: 'The atmosphere, the lights, the music — absolutely magical.', isVerified: true },
    { user: users[4]._id, event: events[4]._id, rating: 5, title: 'Cricket fever!', comment: 'What a match! The stadium was electric.', isVerified: true },
    { user: users[2]._id, event: events[5]._id, rating: 4, title: 'Brilliant performance', comment: 'Cumberbatch brings Hamlet to life in a unique way.', isVerified: false },
  ];
  await Review.insertMany(reviewData);

  console.log(`Seeded: ${users.length} users, ${events.length} events, ${venues.length} venues, ${showtimes.length} showtimes, ${reviewData.length} reviews`);
  await mongoose.disconnect();
  console.log('Seed complete!');
}

seed().catch((err) => { console.error('Seed error:', err); process.exit(1); });
