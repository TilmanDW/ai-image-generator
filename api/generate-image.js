export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, quality = 'standard' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('Generating image for prompt:', prompt);

        // Working models
        const models = [
            'runwayml/stable-diffusion-v1-5',
            'CompVis/stable-diffusion-v1-4'
        ];

        if (process.env.HUGGINGFACE_API_KEY) {
            for (const model of models) {
                try {
                    console.log(`Trying model: ${model}`);
                    const result = await generateImageWithModel(prompt, model);
                    console.log('Successfully generated image');
                    return res.status(200).json({ 
                        imageUrl: result,
                        prompt: prompt,
                        quality: quality,
                        source: `Hugging Face (${model.split('/')[1]})`
                    });
                } catch (apiError) {
                    console.log(`Model ${model} failed:`, apiError.message);
                    continue;
                }
            }
        }

        // Fallback demo
        console.log('Using demo mode');
        const demoImageUrl = createEnhancedDemo(prompt, quality);
        
        res.status(200).json({ 
            imageUrl: demoImageUrl,
            prompt: prompt,
            quality: quality,
            source: 'Demo Mode'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function generateImageWithModel(prompt, modelId) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    console.log(`Calling model: ${modelId}`);

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            options: {
                wait_for_model: true,
                use_cache: false
            }
        })
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
        // Read response body only once
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Content type:', contentType);

    // Read body only once based on content type
    if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        if (jsonData.error) {
            throw new Error(`API Error: ${jsonData.error}`);
        }
        throw new Error('Unexpected JSON response - expected image');
    }

    // Handle binary image response
    const imageBuffer = await response.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength);
    
    if (imageBuffer.byteLength === 0) {
        throw new Error('Received empty image');
    }
    
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    return `data:image/png;base64,${base64Image}`;
}

function createEnhancedDemo(prompt, quality) {
    const sizes = { fast: 512, standard: 768, high: 1024 };
    const size = sizes[quality] || 768;
    
    // Create contextual demo images
    if (prompt.toLowerCase().includes('cat')) {
        return `https://cataas.com/cat/says/AI%20Generated?width=${size}&height=${size}&c=white&s=30`;
    } else if (prompt.toLowerCase().includes('van gogh')) {
        return `https://via.placeholder.com/${size}x${size}/f39c12/ffffff?text=🎨+Van+Gogh+Style+Demo`;
    } else if (prompt.toLowerCase().includes('pope') || prompt.toLowerCase().includes('dalai')) {
        return `https://via.placeholder.com/${size}x${size}/9b59b6/ffffff?text=🕊️+Peaceful+Demo`;
    } else {
        return `https://via.placeholder.com/${size}x${size}/667eea/ffffff?text=🎨+AI+Demo+Image`;
    }
}
