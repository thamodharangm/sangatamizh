import { dbService } from './src/services/db.service.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    try {
        console.log('Testing Supabase Connection...');
        const songs = await dbService.getSongs();
        console.log('Fetch result:', songs);
        
        const testSong = {
            id: 'test_' + Date.now(),
            title: 'Test Song',
            artist: 'Test Artist',
            created_at: new Date().toISOString()
        };
        
        console.log('Attempting test insert...');
        const result = await dbService.addSong(testSong);
        console.log('Insert success:', result);
        
        console.log('Attempting test delete...');
        await dbService.deleteSong(testSong.id);
        console.log('Delete success');
        
    } catch (err) {
        console.error('TEST FAILED');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Details:', err);
    }
};

test();
