import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, set, get, child } from 'firebase/database'; // RTDB Imports
import { firestore, db } from '../firebase'; // Import 'db' for RTDB
import { useAuth } from '../context/AuthContext';

const TestDB = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('Ready');
    const [logs, setLogs] = useState([]);

    const log = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTest = async () => {
        setLogs([]);
        setStatus('Testing...');
        log('Starting Diagnostics...');

        // 1. Backend Connectivity Test
        log('--- Phase 1: Backend Connection Check ---');
        try {
           const apiBase = import.meta.env.VITE_API_URL || '/api';
           log(`Pinging Backend: ${apiBase}/test/connections ...`);
           
           const res = await fetch(`${apiBase}/test/connections`);
           if (!res.ok) throw new Error(`Backend Error ${res.status}`);
           const data = await res.json();
           
           log(`📡 Backend Prisma (Postgres): ${data.prisma.status === 'success' ? '✅' : '❌'}`);
           if (data.prisma.message) log(`-> ${data.prisma.message}`);
           
           log(`🌩️ Backend Supabase Config: ${data.supabase.status === 'success' ? '✅' : '❌'}`);
           if (data.supabase.message) log(`-> ${data.supabase.message}`);

        } catch (err) {
           log(`❌ Backend Check Failed: ${err.message}`);
        }

        // 2. Client-Side Firebase Firestore
        log('\n--- Phase 2: Firestore (NoSQL) Check ---');
        
        // A. Check Auth First
        log('Checking Current Auth Context...');
        if (user) {
            log(`✅ Logged in as: ${user.email} (${user.role})`);
            log(`User ID: ${user.uid}`);
        } else {
            log('⚠️ User is NOT logged in. Writes will likely fail.');
        }

        // Helper to test a collection
        const testCollection = async (colName, docId = 'test_doc') => {
             log(`\nTesting Collection: '${colName}' (Doc: ${docId})...`);
             try {
                // Write
                log(`   Writing to ${colName}/${docId}...`);
                const testRef = doc(firestore, colName, docId);
                await setDoc(testRef, {
                    lastDiagnosticRun: new Date().toISOString(),
                    updatedBy: user ? user.email : 'anonymous'
                }, { merge: true });
                log(`   ✅ WRITE Success (${colName})`);
                
                // Read
                log(`   Reading from ${colName}/${docId}...`);
                const docSnap = await getDoc(testRef);
                if (docSnap.exists()) {
                    log(`   ✅ READ Success (${colName})`);
                } else {
                    log(`   ⚠️ READ Empty: Document written but not found?`);
                }
                return true;
             } catch (e) {
                 log(`   ❌ Failed (${colName}): ${e.message}`);
                 if (e.code === 'permission-denied') {
                     log(`   -> Check Firestore Rules for '${colName}' collection.`);
                     if (colName === 'users' && docId === 'test_doc') {
                         log(`   -> NOTE: Rules often forbid writing to random docs. Testing self-profile next...`);
                     }
                 }
                 return false;
             }
        };

        // B. Test 'user' (Singular - likely deprecated)
        await testCollection('user', 'test_doc');

        // C. Test 'users' (Plural - Standard)
        if (user) {
            await testCollection('users', user.uid);
        } else {
            await testCollection('users', 'public_test');
        }

        // D. Check Actual User Profile
        if (user) {
             try {
                log(`\nAttempting to read actual user profile: users/${user.uid}`);
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    log('✅ Actual User Profile found in Firestore (users)!');
                } else {
                    log('⚠️ Actual User Profile NOT found in users (Might be new user)');
                }
             } catch (e) {
                 log(`❌ User Profile Read Failed: ${e.message}`);
             }
        }

        // 3. Realtime Database Test
        log('\n--- Phase 3: Realtime Database (RTDB) Check ---');
        try {
            const testPath = user ? `_tests/${user.uid}` : `_tests/public`;
            log(`Testing RTDB Path: '${testPath}'...`);
            
            // WRITE
            log(`   Writing timestamp...`);
            const dbRef = ref(db, testPath);
            await set(dbRef, {
                status: 'online',
                timestamp: Date.now(),
                user: user ? user.email : 'anonymous'
            });
            log('   ✅ RTDB WRITE Success');

            // READ
            log(`   Reading back...`);
            const snapshot = await get(child(ref(db), testPath));
            if (snapshot.exists()) {
                log('   ✅ RTDB READ Success');
                log(`   -> Val: ${JSON.stringify(snapshot.val())}`);
            } else {
                log('   ⚠️ RTDB Read Empty (Data not available)');
            }

        } catch (e) {
            log(`❌ RTDB Failed: ${e.message}`);
            if (e.message.includes('permission_denied')) {
                 log('   -> Check Realtime Database Rules (read/write = true?)');
            }
        }

        setStatus('Test Complete');
    };

    const makeMeAdmin = async () => {
        if (!user) return log("❌ Not logged in!");
        try {
            await setDoc(doc(firestore, 'users', user.uid), { role: 'admin' }, { merge: true });
            log("✅ User promoted to ADMIN! Refresh page to see changes.");
        } catch (e) {
            log(`❌ Failed: ${e.message}`);
        }
    };

    return (
        <div style={{ padding: '2rem', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            <h1>🔥 Database Connection Test</h1>
            <p>Current Status: {status}</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <button onClick={runTest} className="btn-3d btn-primary">
                    Run Diagnostics
                </button>
                {user && (
                    <button onClick={makeMeAdmin} className="btn-3d btn-secondary" style={{ background: '#f59e0b', borderColor: '#d97706' }}>
                        Make Me Admin
                    </button>
                )}
            </div>
            
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', minHeight: '300px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                <h3 style={{ borderBottom: '1px solid #475569', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>System Logs:</h3>
                {logs.length === 0 && <span style={{color: '#64748b'}}>Waiting to run tests...</span>}
                {logs.map((L, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #334155', color: L.includes('❌') ? '#fca5a5' : L.includes('✅') ? '#86efac' : '#cbd5e1', whiteSpace: 'pre-wrap' }}>{L}</div>
                ))}
            </div>
        </div>
    );
};

export default TestDB;
