import { dbService } from "./db.service.js";

/**
 * Unified Service to handle liked songs using dbService (Supabase/Local fallback)
 */
class LikesService {
    /**
     * Toggles a like for a user.
     * @returns {Promise<{isLiked: boolean}>}
     */
    async toggleLike(userId, songId) {
        const result = await dbService.toggleLike(userId, songId);
        return { isLiked: result.liked };
    }

    /**
     * Gets all liked song IDs for a user.
     */
    async getLikedIds(userId) {
        return await dbService.getUserLikes(userId);
    }

    /**
     * Gets full song details for a user's liked songs.
     */
    async getUserLikedSongs(userId) {
        try {
            const likedIds = await this.getLikedIds(userId);
            const allSongs = await dbService.getSongs();
            
            // Filter and maintain order if possible
            return allSongs.filter(song => likedIds.includes(song.id));
        } catch (e) {
            console.error("[LikesService] Error fetching liked songs:", e);
            return [];
        }
    }
}

export default new LikesService();
