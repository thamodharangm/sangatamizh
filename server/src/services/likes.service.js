import fs from "fs";
import path from "path";

const LIKES_PATH = path.join(process.cwd(), "src", "likes.json");
const SONGS_PATH = path.join(process.cwd(), "src", "songs.json");

/**
 * Service to handle user-specific playlists and liked songs.
 * This can be easily swapped with Supabase or Firebase logic.
 */
class LikesService {
    constructor() {
        this._ensureFile();
    }

    _ensureFile() {
        if (!fs.existsSync(LIKES_PATH)) {
            fs.writeFileSync(LIKES_PATH, JSON.stringify({}, null, 2));
        }
    }

    getLikesData() {
        try {
            return JSON.parse(fs.readFileSync(LIKES_PATH, "utf8"));
        } catch (e) {
            return {};
        }
    }

    saveLikesData(data) {
        fs.writeFileSync(LIKES_PATH, JSON.stringify(data, null, 2));
    }

    /**
     * Toggles a like for a user.
     * @returns {Promise<{isLiked: boolean}>}
     */
    async toggleLike(userId, songId) {
        const data = this.getLikesData();
        if (!data[userId]) data[userId] = [];

        const index = data[userId].indexOf(songId);
        let isLiked;

        if (index === -1) {
            data[userId].push(songId);
            isLiked = true;
        } else {
            data[userId].splice(index, 1);
            isLiked = false;
        }

        this.saveLikesData(data);
        return { isLiked };
    }

    /**
     * Gets all liked song IDs for a user.
     */
    async getLikedIds(userId) {
        const data = this.getLikesData();
        return data[userId] || [];
    }

    /**
     * Gets full song details for a user's liked songs.
     */
    async getUserLikedSongs(userId) {
        const likedIds = await this.getLikedIds(userId);
        
        try {
            const songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf8"));
            // Return songs in the order they were liked (newest first)
            return songs
                .filter(song => likedIds.includes(song.id))
                .sort((a, b) => likedIds.indexOf(b.id) - likedIds.indexOf(a.id));
        } catch (e) {
            console.error("[LikesService] Error reading songs:", e);
            return [];
        }
    }
}

export default new LikesService();
