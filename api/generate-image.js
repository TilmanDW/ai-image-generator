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

        // Working Stable Diffusion models on HF
        const models = [
            'runwayml/stable-diffusion-v1-5',
            'stabilityai/stable-diffusion-2-1',
            'CompVis/stable-diffusion-v1-4',
            'prompthero/openjourney'
        ];

        if (process.env.HUGGINGFACE_API_KEY) {
            for (const model of models) {
                try {
                    console.log(`Trying model: ${model}`);
                    const imageUrl = await generateImageWithModel(prompt, model);
                    console.log('Successfully generated image');
                    return res.status(200).json({ 
                        imageUrl: imageUrl,
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

        // Fallback to enhanced demo
        console.log('All models failed or no API key, using demo mode');
        const demoImageUrl = await createEnhancedDemo(prompt, quality);
        
        res.status(200).json({ 
            imageUrl: demoImageUrl,
            prompt: prompt,
            quality: quality,
            source: 'Enhanced Demo Mode',
            message: 'Demo mode active - real AI generation will work once API issues are resolved'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

async function generateImageWithModel(prompt, modelId) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    console.log(`Calling model: ${modelId}`);
    console.log(`Prompt: ${prompt}`);

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                guidance_scale: 7.5,
                num_inference_steps: 20
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        })
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Content type:', contentType);

    // Handle different response types
    if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        console.log('JSON response:', jsonData);
        
        if (jsonData.error) {
            throw new Error(`API Error: ${jsonData.error}`);
        }
        
        // Some models return base64 in JSON
        if (jsonData.images && jsonData.images[0]) {
            return `data:image/png;base64,${jsonData.images[0]}`;
        }
        
        throw new Error('Unexpected JSON response format');
    }

    // Handle binary image response
    if (contentType && contentType.startsWith('image/')) {
        const imageBuffer = await response.arrayBuffer();
        console.log('Image buffer size:', imageBuffer.byteLength);
        
        if (imageBuffer.byteLength === 0) {
            throw new Error('Received empty image');
        }
        
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return `data:${contentType};base64,${base64Image}`;
    }

    throw new Error(`Unexpected content type: ${contentType}`);
}

async function createEnhancedDemo(prompt, quality) {
    const sizes = { fast: 512, standard: 768, high: 1024 };
    const size = sizes[quality] || 768;
    
    // Create contextual demo images using different services
    let imageUrl;
    
    if (prompt.toLowerCase().includes('cat')) {
        // Use a cat image service
        imageUrl = `https://cataas.com/cat/says/${encodeURIComponent('AI Generated')}?width=${size}&height=${size}&c=white&s=50`;
    } else if (prompt.toLowerCase().includes('van gogh') || prompt.toLowerCase().includes('art')) {
        // Use an art-style placeholder
        imageUrl = `https://via.placeholder.com/${size}x${size}/f39c12/ffffff?text=🎨+Van+Gogh+Style`;
    } else if (prompt.toLowerCase().includes('pope') || prompt.toLowerCase().includes('dalai')) {
        // Peaceful/spiritual themed
        imageUrl = `https://via.placeholder.com/${size}x${size}/9b59b6/ffffff?text=🕊️+Peaceful+Scene`;
    } else {
        // Generic AI art placeholder
        const colors = ['667eea', '764ba2', '4facfe', 'f093fb'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        imageUrl = `https://via.placeholder.com/${size}x${size}/${color}/ffffff?text=🎨+AI+Generated`;
    }
    
    return imageUrl;
}
