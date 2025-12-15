const fetch = require('node-fetch');

const urls = [
    'https://youtu.be/2hGEiQg9X_g?si=llddec78ipi74_4L',
    'https://youtu.be/izbydia9jz4?si=GAYErVmN-7n4CKmo',
    'https://youtu.be/RPTfXa_4jPg?si=62YqLgsby2r6AQZg',
    'https://youtu.be/MwtKJG_87fw?si=vi2Vu_qvKuYekpQ_',
    'https://youtu.be/PAhTLB1LBR0?si=WUHJzKs3Ig3bw3rk',
    'https://youtu.be/9iX4HQeW1aM?si=ngxkCqv4f8_Ka0p3',
    'https://youtu.be/naGxpB5FbXw?si=NsVdz7-DhvBRjmVd',
    'https://youtu.be/dsrku40uZMc?si=9QAZxyHGqst9ANVa',
    'https://youtu.be/bdHWFi5NfR0?si=uA7xxk6AkUZnqzeM',
    'https://youtu.be/oL4SC97QBoU?si=YktiEmNtEIb7eQ3d',
    'https://youtu.be/XWlWvLauIrg?si=fwLCnSsTfXfM8eZH',
    'https://youtu.be/hnemFzjQUSM?si=_t6_UwZLXCZ6437d',
    'https://youtu.be/UgjtxhV08Ao?si=rFZ07aUHjn54AJxa',
    'https://youtu.be/A64oFRutkeI?si=iSnuipgFqY6FLncs',
    'https://youtu.be/cEWwJxEq9Lg?si=ZRaYj5dgtymToVZz',
    'https://youtu.be/ti4fD2or_6s?si=VH3zfWf4NnzLJW7V',
    'https://youtu.be/Zy_KwCohQd0?si=_L0zkY8mxQ7AMW0V',
    'https://youtu.be/XnHLmsClbP4?si=WGXbFcMLeQe0Lxl-',
    'https://youtu.be/k9_JbEaRxso?si=C7EYtfO2BxGmYjMs',
    'https://youtu.be/AIFjQ3RIAOQ?si=UkKEV9UvQdWNI8Ez',
    'https://youtu.be/CpjbtSzVOz8?si=OayGyNhfS6jEcaC6',
    'https://youtu.be/qOBCyC0khCc?si=j9Bi6eYuYqkiKKVb',
    'https://youtu.be/xZ92nnR1Pt8?si=kewt2HXjHJqafXUZ',
    'https://youtu.be/jRDCWQP7rjI?si=vWuaCdyBTUM9q0S_',
    'https://youtu.be/NOeMYlFuEmk?si=aPHgazS_YGToqOLs',
    'https://youtu.be/rlXZROSltGk?si=Zz1TELw7rc5n32XI'
];

async function seed() {
    console.log(`🚀 Starting bulk upload of ${urls.length} songs...`);
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);
        
        try {
            const start = Date.now();
            const res = await fetch('http://localhost:3002/api/upload-from-yt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }) // Auto-detect emotion/category
            });

            const data = await res.json();
            
            if (res.ok) {
                console.log(`✅ Success: "${data.title}" by ${data.artist}`);
                console.log(`   category: ${data.category}, emotion: ${data.emotion}`);
            } else {
                console.error(`❌ Failed: ${data.error || 'Unknown Error'}`);
                if (data.details) console.error('   Details:', data.details);
            }
            console.log(`   Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);

        } catch (err) {
            console.error(`❌ Network/Script Error: ${err.message}`);
        }
        
        // Wait a bit to avoid overwhelming rate limits
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n✨ Bucket Upload Complete!');
}

seed();
