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

        // Quality settings
        const qualitySettings = {
            fast: { width: 512, height: 512 },
            standard: { width: 768, height: 768 },
            high: { width: 1024, height: 1024 }
        };

        const settings = qualitySettings[quality] || qualitySettings.standard;

        // Try Stable Diffusion API
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                const imageUrl = await generateWithStableDiffusion(prompt, settings);
                return res.status(200).json({ 
                    imageUrl: imageUrl,
                    prompt: prompt,
                    quality: quality,
                    source: 'Stable Diffusion XL'
                });
            } catch (apiError) {
                console.log('Stable Diffusion API failed:', apiError.message);
            }
        }

        // Fallback to demo response
        console.log('Using demo mode for image generation');
        const demoImageUrl = `https://via.placeholder.com/${settings.width}x${settings.height}/667eea/ffffff?text=🎨+AI+Demo+Image`;
        
        res.status(200).json({ 
            imageUrl: demoImageUrl,
            prompt: prompt,
            quality: quality,
            source: 'Demo Mode',
            message: 'Demo placeholder - integrate with Hugging Face for real AI generation'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Replace the generateWithHuggingFace function with this simpler version
async function generateWithHuggingFace(prompt, settings, modelId = 'runwayml/stable-diffusion-v1-5') {
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
            inputs: prompt
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const imageBlob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
    });
}
