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
            // Map cover_url to cover for frontend compatibility
            return data.map(song => ({
                ...song,
                cover: song.cover_url || song.cover
            }));
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
    },

    async getRecentPlays(userId, limit = 12) {
        if (!userId) return [];
        
        if (this.isCloud) {
            try {
                const { data, error } = await supabase
                    .from('analytics_plays')
                    .select('song_id')
                    .eq('user_id', userId)
                    .order('id', { ascending: false }) // Fallback to id if created_at is missing, but usually it's there
                    .limit(limit * 2); // Fetch extra to account for duplicates

                if (error || !data) return [];

                const uniqueIds = [...new Set(data.map(p => p.song_id))].slice(0, limit);
                if (uniqueIds.length === 0) return [];

                const songs = await this.getSongs();
                return uniqueIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
            } catch (e) {
                console.error("[DB] Recent plays cloud error:", e);
                return [];
            }
        } else {
            try {
                if (!fs.existsSync(ANALYTICS_PATH)) return [];
                const analytics = JSON.parse(fs.readFileSync(ANALYTICS_PATH, "utf8"));
                const plays = analytics.plays || [];
                // Filter by userId and reverse for most recent first
                const userPlays = plays.filter(p => p.userId === userId).reverse();
                const uniqueIds = [...new Set(userPlays.map(p => p.songId))].slice(0, limit);
                
                const songs = getLocalSongs();
                return uniqueIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
            } catch (e) { 
                return []; 
            }
        }
    },

    async getAnalyticsStats() {
        const songs = await this.getSongs();
        const totalSongs = songs.length;

        if (this.isCloud) {
            try {
                // 1. Total Logins
                const { count: totalLogins } = await supabase
                    .from('analytics_logins')
                    .select('*', { count: 'exact', head: true });

                // 2. Total Plays
                const { count: totalPlays } = await supabase
                    .from('analytics_plays')
                    .select('*', { count: 'exact', head: true });

                // 3. Active Users (24h)
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { data: recentLogins } = await supabase
                    .from('analytics_logins')
                    .select('user_id')
                    .gt('created_at', yesterday);
                
                const activeUsers = new Set(recentLogins?.map(l => l.user_id)).size;

                // 4. Chart Data (Last 7 Days)
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const start = new Date();
                    start.setHours(0, 0, 0, 0);
                    start.setDate(start.getDate() - i);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 1);

                    const { count } = await supabase
                        .from('analytics_logins')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', start.toISOString())
                        .lt('created_at', end.toISOString());
                    
                    chartData.push({
                        date: start.toISOString().split('T')[0],
                        logins: count || 0
                    });
                }

                // 5. Top Played (Aggregate from logs)
                const { data: rawPlays } = await supabase
                    .from('analytics_plays')
                    .select('song_id');
                
                const playMap = {};
                rawPlays?.forEach(p => { playMap[p.song_id] = (playMap[p.song_id] || 0) + 1; });
                const topPlayed = Object.entries(playMap)
                    .map(([id, count]) => {
                        const song = songs.find(s => s.id === id);
                        return song ? { ...song, count } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                // 6. Top Liked (Aggregate from user_likes)
                const { data: rawLikes } = await supabase
                    .from('user_likes')
                    .select('song_id');
                
                const likeMap = {};
                rawLikes?.forEach(l => { likeMap[l.song_id] = (likeMap[l.song_id] || 0) + 1; });
                const topLiked = Object.entries(likeMap)
                    .map(([id, count]) => {
                        const song = songs.find(s => s.id === id);
                        return song ? { ...song, count } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                return { 
                    totalLogins: totalLogins || 0, 
                    totalSongs, 
                    totalPlays: totalPlays || 0,
                    activeUsers, 
                    chartData,
                    topPlayed, 
                    topLiked 
                };
            } catch (e) {
                console.error("[DB] Analytics cloud error:", e);
                return { totalLogins: 0, totalSongs, totalPlays: 0, activeUsers: 0, chartData: [], topPlayed: [], topLiked: [] };
            }
        } else {
            try {
                if (!fs.existsSync(ANALYTICS_PATH)) return { totalLogins: 0, totalSongs, totalPlays: 0, activeUsers: 0, chartData: [], topPlayed: [], topLiked: [] };
                const analytics = JSON.parse(fs.readFileSync(ANALYTICS_PATH, "utf8"));
                const logins = analytics.logins || [];
                const plays = analytics.plays || [];

                const totalLogins = logins.length;
                const totalPlays = plays.length;

                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const activeUsers = new Set(
                    logins.filter(l => new Date(l.date).getTime() > dayAgo).map(l => l.userId)
                ).size;

                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setHours(0,0,0,0);
                    d.setDate(d.getDate() - i);
                    const dayStr = d.toISOString().split('T')[0];
                    const count = logins.filter(l => l.date.startsWith(dayStr)).length;
                    chartData.push({ date: dayStr, logins: count });
                }

                // Calculate Top Played
                const playMap = {};
                plays.forEach(p => { playMap[p.songId] = (playMap[p.songId] || 0) + 1; });
                const topPlayed = Object.entries(playMap)
                    .map(([id, count]) => {
                        const song = songs.find(s => s.id === id);
                        return song ? { ...song, count } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                // Calculate Top Liked
                let likesMap = {};
                if (fs.existsSync(LIKES_PATH)) {
                    const likesData = JSON.parse(fs.readFileSync(LIKES_PATH, "utf8"));
                    Object.values(likesData).forEach(userLikes => {
                        userLikes.forEach(id => { likesMap[id] = (likesMap[id] || 0) + 1; });
                    });
                }
                const topLiked = Object.entries(likesMap)
                    .map(([id, count]) => {
                        const song = songs.find(s => s.id === id);
                        return song ? { ...song, count } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                return { totalLogins, totalSongs, totalPlays, activeUsers, chartData, topPlayed, topLiked };
            } catch (e) {
                console.error("[DB] Local Analytics error:", e);
                return { totalLogins: 0, totalSongs, totalPlays: 0, activeUsers: 0, chartData: [], topPlayed: [], topLiked: [] };
            }
        }
    }
};
