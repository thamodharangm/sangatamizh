import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), "src", "songs.json");
const LIKES_PATH = path.join(process.cwd(), "src", "likes.json");
const ANALYTICS_PATH = path.join(process.cwd(), "src", "analytics.json");

// Cache for local data during migration or fallback
const getLocalSongs = () => {
    try {
        if (!fs.existsSync(DB_PATH)) return [];
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch (e) { return []; }
};

export const dbService = {
    // Check if Supabase is active
    isCloud: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),

    // --- SONGS ---
    async getSongs() {
        if (this.isCloud) {
            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('[DB] Error fetching songs:', error);
                return getLocalSongs();
            }
            return data;
        }
        return getLocalSongs();
    },

    async addSong(songData) {
        if (this.isCloud) {
            const { data, error } = await supabase
                .from('songs')
                .insert([songData])
                .select();
            if (error) throw error;
            return data[0];
        } else {
            const songs = getLocalSongs();
            songs.push(songData);
            fs.writeFileSync(DB_PATH, JSON.stringify(songs, null, 2));
            return songData;
        }
    },

    async updateSong(id, updates) {
        if (this.isCloud) {
            const { data, error } = await supabase
                .from('songs')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) throw error;
            return data[0];
        } else {
            const songs = getLocalSongs();
            const idx = songs.findIndex(s => s.id === id);
            if (idx !== -1) {
                songs[idx] = { ...songs[idx], ...updates };
                fs.writeFileSync(DB_PATH, JSON.stringify(songs, null, 2));
                return songs[idx];
            }
        }
    },

    async deleteSong(id) {
        if (this.isCloud) {
            const { error } = await supabase
                .from('songs')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } else {
            let songs = getLocalSongs();
            songs = songs.filter(s => s.id !== id);
            fs.writeFileSync(DB_PATH, JSON.stringify(songs, null, 2));
        }
    },

    // --- LIKES ---
    async getUserLikes(userId) {
        if (this.isCloud) {
            const { data, error } = await supabase
                .from('user_likes')
                .select('song_id')
                .eq('user_id', userId);
            if (error) return [];
            return data.map(l => l.song_id);
        } else {
            try {
                if (!fs.existsSync(LIKES_PATH)) return [];
                const likes = JSON.parse(fs.readFileSync(LIKES_PATH, "utf8"));
                return likes[userId] || [];
            } catch (e) { return []; }
        }
    },

    async toggleLike(userId, songId) {
        if (this.isCloud) {
            // Check if exists
            const { data: existing } = await supabase
                .from('user_likes')
                .select('*')
                .eq('user_id', userId)
                .eq('song_id', songId)
                .single();

            if (existing) {
                await supabase
                    .from('user_likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('song_id', songId);
                return { liked: false };
            } else {
                await supabase
                    .from('user_likes')
                    .insert([{ user_id: userId, song_id: songId }]);
                return { liked: true };
            }
        } else {
            const likesPath = LIKES_PATH;
            let likes = {};
            if (fs.existsSync(likesPath)) {
                likes = JSON.parse(fs.readFileSync(likesPath, "utf8"));
            }
            if (!likes[userId]) likes[userId] = [];
            
            const idx = likes[userId].indexOf(songId);
            let liked = false;
            if (idx === -1) {
                likes[userId].push(songId);
                liked = true;
            } else {
                likes[userId].splice(idx, 1);
            }
            fs.writeFileSync(likesPath, JSON.stringify(likes, null, 2));
            return { liked };
        }
    },

    // --- ANALYTICS ---
    async logPlay(userId, songId) {
        if (this.isCloud) {
            await supabase.from('analytics_plays').insert([{ user_id: userId, song_id: songId }]);
        } else {
            try {
                let analytics = { plays: [], logins: [] };
                if (fs.existsSync(ANALYTICS_PATH)) {
                    analytics = JSON.parse(fs.readFileSync(ANALYTICS_PATH, "utf8"));
                }
                if (!analytics.plays) analytics.plays = [];
                analytics.plays.push({ userId, songId, date: new Date().toISOString() });
                fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2));
            } catch (e) {}
        }
    },

    async logLogin(userId) {
        if (this.isCloud) {
            await supabase.from('analytics_logins').insert([{ user_id: userId }]);
        } else {
            let analytics = { plays: [], logins: [] };
            if (fs.existsSync(ANALYTICS_PATH)) {
                analytics = JSON.parse(fs.readFileSync(ANALYTICS_PATH, "utf8"));
            }
            if (!analytics.logins) analytics.logins = [];
            analytics.logins.push({ userId, date: new Date().toISOString() });
            fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2));
        }
    }
};
