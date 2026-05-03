import { Event, IEvent } from '../models/Event';
import { UserPreference } from '../models/UserPreference';
import { Review } from '../models/Review';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface ScoredEvent {
  event: IEvent;
  score: number;
}

// Simple TF-IDF-like scoring for content-based filtering
function computeContentScore(event: IEvent, userGenres: string[], userCategories: string[], userTags: string[]): number {
  let score = 0;
  const eventGenres = event.genre.map((g) => g.toLowerCase());
  const eventTags = event.tags.map((t) => t.toLowerCase());
  const normalizedUserGenres = userGenres.map((g) => g.toLowerCase());
  const normalizedUserTags = userTags.map((t) => t.toLowerCase());

  // Genre overlap (highest weight)
  const genreOverlap = eventGenres.filter((g) => normalizedUserGenres.includes(g)).length;
  score += genreOverlap * 3;

  // Category match
  if (userCategories.includes(event.category)) {
    score += 2;
  }

  // Tag overlap
  const tagOverlap = eventTags.filter((t) => normalizedUserTags.includes(t)).length;
  score += tagOverlap * 1.5;

  // Boost for high-rated events
  score += event.avgRating * 0.5;

  // Boost for featured events
  if (event.isFeatured) {
    score += 1;
  }

  return score;
}

// Collaborative filtering using user-item rating matrix
async function getCollaborativeScores(userId: string, events: IEvent[]): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  try {
    // Get all reviews by this user
    const userReviews = await Review.find({ user: userId });
    const userRatedEventIds = new Set(userReviews.map((r) => r.event.toString()));

    if (userReviews.length === 0) {
      return scores; // Cold start — no collaborative data
    }

    // Find users who rated the same events similarly
    const similarUsers = await Review.aggregate([
      {
        $match: {
          event: { $in: userReviews.map((r) => r.event) },
          user: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $group: {
          _id: '$user',
          commonEvents: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $match: { commonEvents: { $gte: 1 } } },
      { $sort: { commonEvents: -1 } },
      { $limit: 20 },
    ]);

    if (similarUsers.length === 0) return scores;

    // Get events rated highly by similar users that current user hasn't rated
    const similarUserIds = similarUsers.map((u) => u._id);
    const recommendations = await Review.aggregate([
      {
        $match: {
          user: { $in: similarUserIds },
          rating: { $gte: 3.5 },
          event: { $nin: Array.from(userRatedEventIds).map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: '$event',
          avgScore: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1, count: -1 } },
    ]);

    for (const rec of recommendations) {
      scores.set(rec._id.toString(), (rec.avgScore / 5) * rec.count);
    }
  } catch (error) {
    logger.error('Collaborative filtering error:', error);
  }

  return scores;
}

export const recommendationService = {
  async getPersonalizedRecommendations(userId: string, limit = 10): Promise<IEvent[]> {
    try {
      // Get user preferences
      const prefs = await UserPreference.findOne({ user: userId });
      const userGenres = prefs?.favoriteGenres || [];
      const userCategories = prefs?.favoriteCategories || [];
      const searchTags = prefs?.searchHistory || [];
      const viewedIds = prefs?.viewedEvents.map((e) => e.toString()) || [];

      // Get all active events not already viewed
      const events = await Event.find({
        isActive: true,
        _id: { $nin: viewedIds.slice(0, 50) }, // Exclude recently viewed
      }).limit(100);

      // Content-based scores
      const contentScored: ScoredEvent[] = events.map((event) => ({
        event,
        score: computeContentScore(event, userGenres, userCategories, searchTags),
      }));

      // Collaborative scores
      const collabScores = await getCollaborativeScores(userId, events);

      // Hybrid scoring: 0.6 content + 0.4 collaborative
      const hybridScored = contentScored.map((item) => {
        const collabScore = collabScores.get(item.event._id.toString()) || 0;
        return {
          event: item.event,
          score: 0.6 * item.score + 0.4 * collabScore,
        };
      });

      // Sort by score descending
      hybridScored.sort((a, b) => b.score - a.score);

      return hybridScored.slice(0, limit).map((item) => item.event);
    } catch (error) {
      logger.error('Recommendation error:', error);
      // Fallback to popular events
      return Event.find({ isActive: true }).sort({ avgRating: -1, totalReviews: -1 }).limit(limit);
    }
  },

  async getPopularEvents(limit = 10): Promise<IEvent[]> {
    return Event.find({ isActive: true })
      .sort({ avgRating: -1, totalReviews: -1 })
      .limit(limit);
  },

  async getSimilarEvents(eventId: string, limit = 6): Promise<IEvent[]> {
    const event = await Event.findById(eventId);
    if (!event) return [];

    return Event.find({
      _id: { $ne: eventId },
      isActive: true,
      $or: [
        { genre: { $in: event.genre } },
        { category: event.category },
        { tags: { $in: event.tags } },
      ],
    })
      .sort({ avgRating: -1 })
      .limit(limit);
  },

  async updateUserPreferences(userId: string, action: string, data: any): Promise<void> {
    const update: any = {};

    switch (action) {
      case 'view':
        update.$addToSet = { viewedEvents: data.eventId };
        break;
      case 'book':
        update.$addToSet = {
          bookedEvents: data.eventId,
          favoriteGenres: { $each: data.genres || [] },
          favoriteCategories: data.category,
        };
        break;
      case 'rate':
        update.$addToSet = {
          ratedEvents: { event: data.eventId, rating: data.rating },
        };
        break;
      case 'search':
        update.$addToSet = { searchHistory: data.query };
        break;
    }

    await UserPreference.findOneAndUpdate({ user: userId }, update, { upsert: true, new: true });
  },
};
