const fetch = require('node-fetch');

const urls = [
    "https://youtu.be/BOhXss1zQLk?si=WC4xZsQEr_H48AWg",
    "https://youtu.be/f37My7hRdZQ?si=a8otHL8LjuWm1s6B",
    "https://youtu.be/JZCUL_5U8l4?si=65gfrFtHhGPE0Di2",
    "https://youtu.be/qC-X5MogTI0?si=-wEcBddF_iwGBafX",
    "https://youtu.be/TKeU1bLlAcc?si=i1PPL47HKIy-z7Oi",
    "https://youtu.be/nffLXODytdw?si=fGEpZZWgw4TvYHlL",
    "https://youtu.be/MJoOoMABePE?si=sWMb2q_C0JObe8DN",
    "https://youtu.be/aP7qPDeoIv0?si=5gH296K4i9E-KcJq",
    "https://youtu.be/a3Ue-LN5B9U?si=4ny3OqITpVswuAOH",
    "https://youtu.be/edVZZ2w9Bkk?si=SKR8HKRih1VlI9O3",
    "https://youtu.be/_6i4jndlkO0?si=yGsd-AVfiRShyqNB",
    "https://youtu.be/pYBIpM5mBm4?si=Vd57_nUQZQORY_17",
    "https://youtu.be/dL6btsdi7Rc?si=QFIcW7Vlpd62DRhu"
];

async function batchImport() {
    console.log(`Starting batch import of ${urls.length} songs...`);
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n[${i+1}/${urls.length}] Processing: ${url}`);
        
        try {
            const res = await fetch("http://localhost:3002/api/upload-from-yt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    url: url,
                    category: "Tamil" // Default category
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ Success: "${data.title}" added to library.`);
            } else {
                const err = await res.text();
                console.error(`❌ Failed: ${err}`);
            }
        } catch (e) {
            console.error(`❌ Network Error: ${e.message}`);
        }
    }
    console.log("\nBatch import complete!");
}

batchImport();
