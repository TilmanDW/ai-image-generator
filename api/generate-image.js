export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { prompt, quality = 'standard' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('Generating image for prompt:', prompt);

        // Try multiple approaches in order
        let result = null;

        // Approach 1: Try HF if available
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                result = await tryHuggingFaceSimple(prompt);
                if (result) {
                    return res.json({
                        imageUrl: result,
                        prompt,
                        quality,
                        source: 'Hugging Face AI',
                        method: 'real_ai'
                    });
                }
            } catch (hfError) {
                console.log('HF failed:', hfError.message);
            }
        }

        // Approach 2: Try Replicate (free tier)
        try {
            result = await tryReplicateAlternative(prompt, quality);
            if (result) {
                return res.json({
                    imageUrl: result,
                    prompt,
                    quality,
                    source: 'Alternative AI Service',
                    method: 'alternative_ai'
                });
            }
        } catch (repError) {
            console.log('Alternative AI failed:', repError.message);
        }

        // Approach 3: Smart contextual demo (always works)
        result = createContextualDemo(prompt, quality);
        
        res.json({
            imageUrl: result,
            prompt,
            quality,
            source: 'Contextual Demo',
            method: 'smart_demo',
            message: 'Using enhanced demo mode with contextual imagery'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function tryHuggingFaceSimple(prompt) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Try the most basic request possible
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
    });

    if (response.status === 404) {
        throw new Error('Model not found - might need license acceptance');
    }

    if (response.status === 403) {
        throw new Error('Access forbidden - check token permissions');
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 0) {
            return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
        }
    }

    throw new Error('No valid image received');
}

async function tryReplicateAlternative(prompt, quality) {
    // For now, this is a placeholder for future Replicate integration
    // Replicate has better free tier access but requires setup
    throw new Error('Alternative service not configured');
}

function createContextualDemo(prompt, quality) {
    const sizes = { fast: 512, standard: 768, high: 1024 };
    const size = sizes[quality] || 768;
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Deutsche Welle + Van Gogh
    if (lowerPrompt.includes('deutsche welle') && lowerPrompt.includes('van gogh')) {
        return createSVGImage(size, 'Deutsche Welle × Van Gogh', '🎨📺', ['#f39c12', '#3498db', '#2ecc71']);
    }
    
    // Cat rollerblading in Berlin
    if (lowerPrompt.includes('cat') && (lowerPrompt.includes('rollerblade') || lowerPrompt.includes('berlin'))) {
        return createSVGImage(size, 'Cat Rollerblading Berlin', '🐱⛸️🏙️', ['#ff6b6b', '#feca57', '#48dbfb']);
    }
    
    // Pope & Dalai Lama
    if ((lowerPrompt.includes('pope') || lowerPrompt.includes('dalai')) && lowerPrompt.includes('tea')) {
        return createSVGImage(size, 'Peaceful Tea Time', '🕊️🍃⛰️', ['#9b59b6', '#3498db', '#1dd1a1']);
    }
    
    // Van Gogh style
    if (lowerPrompt.includes('van gogh')) {
        return createSVGImage(size, 'Van Gogh Style', '🎨🌟', ['#f39c12', '#e74c3c', '#3498db']);
    }
    
    // Cat
    if (lowerPrompt.includes('cat')) {
        return createSVGImage(size, 'Feline Friend', '🐱✨', ['#ff6b6b', '#feca57']);
    }
    
    // Default artistic
    return createSVGImage(size, 'AI Generated Art', '🎨🤖', ['#667eea', '#764ba2']);
}

function createSVGImage(size, title, emoji, colors) {
    const gradient = colors.map((color, i) => 
        `<stop offset="${i * (100/(colors.length-1))}%" style="stop-color:${color};stop-opacity:1" />`
    ).join('');
    
    const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                ${gradient}
            </linearGradient>
            <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
            </filter>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#bg)"/>
        <circle cx="${size*0.3}" cy="${size*0.3}" r="${size*0.1}" fill="rgba(255,255,255,0.2)" filter="url(#blur)"/>
        <circle cx="${size*0.7}" cy="${size*0.6}" r="${size*0.15}" fill="rgba(255,255,255,0.1)" filter="url(#blur)"/>
        <text x="${size/2}" y="${size/2-40}" font-family="Arial, sans-serif" font-size="${size*0.08}" fill="white" text-anchor="middle" font-weight="bold">${emoji}</text>
        <text x="${size/2}" y="${size/2+20}" font-family="Arial, sans-serif" font-size="${size*0.04}" fill="rgba(255,255,255,0.9)" text-anchor="middle">${title}</text>
        <text x="${size/2}" y="${size/2+50}" font-family="Arial, sans-serif" font-size="${size*0.025}" fill="rgba(255,255,255,0.7)" text-anchor="middle">AI Demo Mode</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
