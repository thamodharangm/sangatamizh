const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

try {
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = content.split(/\r?\n/);
    const newKey = 'AIzaSyAIl1hf_nHKEwMi7AOw25vgslll4Cn0i4g';
    let found = false;

    const newLines = lines.map(line => {
        if (line.trim().startsWith('YT_API_KEY=')) {
            found = true;
            let current = line.split('=')[1].trim();
            // Remove quotes if present
            current = current.replace(/^["']|["']$/g, '');
            
            if (!current.includes(newKey)) {
                // If current is empty, just set it
                if (current.length === 0) return `YT_API_KEY=${newKey}`;
                // Append
                return `YT_API_KEY=${current},${newKey}`;
            }
            return line;
        }
        return line;
    });

    if (!found) {
        newLines.push(`YT_API_KEY=${newKey}`);
    }

    // Filter out empty lines at the end if any to avoid massive growth
    const finalContent = newLines.join('\n').trim() + '\n';
    
    fs.writeFileSync(envPath, finalContent);
    console.log('Successfully updated .env with YT_API_KEY rotation.');

} catch (err) {
    console.error('Failed to update .env:', err);
}
