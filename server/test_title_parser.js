#!/usr/bin/env node

/**
 * Test Title Parser with Real Examples
 */

import { parseYouTubeTitle } from './src/services/titleParser.service.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('🧪 Testing Title Parser with Real Examples\n');

const testCases = [
    {
        name: "Kaththi - Aathi Song",
        title: "Aathi 8K 60FPS Video Song | Kaththi | Vijay | Anirudh",
        uploader: "Sony Music South",
        expected: {
            song: "Aathi",
            movie: "Kaththi"
        }
    },
    {
        name: "Master - Vaathi Coming",
        title: "Vaathi Coming Full Video | Master | Thalapathy Vijay | Anirudh",
        uploader: "Sony Music South",
        expected: {
            song: "Vaathi Coming",
            movie: "Master"
        }
    },
    {
        name: "Leo - Naa Ready",
        title: "Naa Ready - Lyric Video | Leo | Thalapathy Vijay | Anirudh | 4K",
        uploader: "Sony Music South",
        expected: {
            song: "Naa Ready",
            movie: "Leo"
        }
    }
];

testCases.forEach((test, i) => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Test ${i + 1}: ${test.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Input Title: "${test.title}"`);
    console.log(`Uploader:    "${test.uploader}"`);
    
    const result = parseYouTubeTitle(test.title, test.uploader);
    
    console.log(`\n✨ Parsed Result:`);
    console.log(`   Song:     "${result.song}"`);
    console.log(`   Movie:    "${result.movie}"`);
    console.log(`   Artist:   "${result.artist}"`);
    
    // Validate
    let passed = true;
    if (test.expected.song && result.song !== test.expected.song) {
        console.log(`\n❌ Expected song: "${test.expected.song}"`);
        passed = false;
    }
    if (test.expected.movie && result.movie !== test.expected.movie) {
        console.log(`❌ Expected movie: "${test.expected.movie}"`);
        passed = false;
    }
    
    if (passed) {
        console.log(`\n✅ TEST PASSED!`);
    } else {
        console.log(`\n❌ TEST FAILED!`);
    }
});

console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Testing Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
