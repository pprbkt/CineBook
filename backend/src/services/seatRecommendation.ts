import { ISeatLayout } from '../models/Venue';
import { UserPreference } from '../models/UserPreference';
import { logger } from '../utils/logger';

interface SeatScore {
  seat: ISeatLayout & { _id: any };
  score: number;
  reasons: string[];
}

// Calculate viewing angle quality based on seat position
function calculateViewingAngle(seatX: number, seatZ: number, screenCenterX: number): number {
  const dx = seatX - screenCenterX;
  const angle = Math.atan2(Math.abs(dx), seatZ) * (180 / Math.PI);
  // Best angle is 0 (directly centered), worse as angle increases
  return Math.max(0, 1 - angle / 45);
}

// Calculate distance quality (not too close, not too far)
function calculateDistanceQuality(seatZ: number, totalRows: number, rowSpacing: number): number {
  const idealDistance = totalRows * rowSpacing * 0.4; // ~40% back is ideal
  const deviation = Math.abs(seatZ - idealDistance) / (totalRows * rowSpacing);
  return Math.max(0, 1 - deviation);
}

export const seatRecommendationService = {
  async getSmartRecommendations(
    seats: (ISeatLayout & { _id: any })[],
    bookedSeatIds: string[],
    lockedSeatIds: string[],
    userId?: string,
    count = 5
  ): Promise<SeatScore[]> {
    try {
      const bookedSet = new Set(bookedSeatIds);
      const lockedSet = new Set(lockedSeatIds);

      // Get available seats
      const availableSeats = seats.filter(
        (s) => !bookedSet.has(s._id.toString()) && !lockedSet.has(s._id.toString())
      );

      if (availableSeats.length === 0) return [];

      // Get user preferences if logged in
      let userPrefs: any = null;
      if (userId) {
        userPrefs = await UserPreference.findOne({ user: userId });
      }

      // Calculate scores
      const totalRows = new Set(seats.map((s) => s.row)).size;
      const maxSeatsPerRow = Math.max(...seats.map((s) => s.number));
      const screenCenterX = 0;
      const rowSpacing = 1.2;

      const scored: SeatScore[] = availableSeats.map((seat) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Center preference (weight: 30%)
        const centerScore = 1 - Math.abs(seat.x) / (maxSeatsPerRow * 0.5);
        score += centerScore * 30;
        if (centerScore > 0.7) reasons.push('Center position');

        // 2. Viewing angle (weight: 25%)
        const angleScore = calculateViewingAngle(seat.x, seat.z, screenCenterX);
        score += angleScore * 25;
        if (angleScore > 0.7) reasons.push('Optimal viewing angle');

        // 3. Distance from screen (weight: 20%)
        const distScore = calculateDistanceQuality(seat.z, totalRows, rowSpacing);
        score += distScore * 20;
        if (distScore > 0.7) reasons.push('Ideal distance');

        // 4. Seat type preference (weight: 15%)
        if (userPrefs?.preferredSeatType === seat.type) {
          score += 15;
          reasons.push(`Your preferred ${seat.type} seat`);
        } else if (seat.type === 'premium') {
          score += 10;
          reasons.push('Premium seat');
        } else if (seat.type === 'vip') {
          score += 12;
          reasons.push('VIP seat');
        }

        // 5. Position preference from history (weight: 10%)
        if (userPrefs) {
          const rowIndex = seat.row.charCodeAt(0) - 'A'.charCodeAt(0);
          const position = rowIndex < totalRows * 0.33 ? 'front' : rowIndex < totalRows * 0.66 ? 'middle' : 'back';

          if (userPrefs.preferredSeatPosition === position) {
            score += 10;
            reasons.push('Matches your seating preference');
          }

          // Side preference
          const side = Math.abs(seat.x) < 1 ? 'center' : seat.x < 0 ? 'left' : 'right';
          if (userPrefs.preferredSeatSide === side) {
            score += 5;
          }
        }

        // 6. Aisle seat bonus
        if (seat.number === 1 || seat.number === maxSeatsPerRow) {
          score += 3;
          reasons.push('Aisle seat');
        }

        return { seat, score, reasons };
      });

      // Sort by score and return top recommendations
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, count);
    } catch (error) {
      logger.error('Seat recommendation error:', error);
      return [];
    }
  },
};
