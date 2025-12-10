const supabase = require('./src/config/supabase');
const fs = require('fs');
const path = require('path');

async function testSupabase() {
    console.log("Testing Supabase Storage Connection...");

    // 1. List Buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("❌ List Buckets Failed:", listError.message);
        return;
    }
    console.log("✅ Buckets Found:", buckets.map(b => b.name));

    const bucketName = 'music-files'; // Ensure this matches exactly
    const bucket = buckets.find(b => b.name === bucketName);

    if (!bucket) {
        console.error(`❌ Bucket '${bucketName}' NOT found. Please create it in Supabase Dashboard.`);
        return;
    }
    console.log(`✅ Bucket '${bucketName}' Confirmed.`);

    // 2. Upload a small test file
    const testFile = 'test_upload.txt';
    const filePath = path.join(__dirname, testFile);
    fs.writeFileSync(filePath, "Supabase Test Upload " + new Date().toISOString());

    console.log(`Uploading test file to '${bucketName}'...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload('debug/test_file.txt', fs.readFileSync(filePath), {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error("❌ Upload Failed:", uploadError);
        console.error("   Message:", uploadError.message);
        console.error("   Details:", JSON.stringify(uploadError, null, 2));
    } else {
        console.log("✅ Upload Success:", uploadData);
        // Clean up
        const { error: delError } = await supabase.storage.from(bucketName).remove(['debug/test_file.txt']);
        if(!delError) console.log("✅ Cleanup (Delete) Success");
    }

    fs.unlinkSync(filePath);
}

testSupabase();
