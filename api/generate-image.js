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

async function generateWithStableDiffusion(prompt, settings) {
    // Enhance prompt for better results
    const enhancedPrompt = `${prompt}, high quality, detailed, professional, 8k resolution, masterpiece`;

    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
                width: settings.width,
                height: settings.height,
                num_inference_steps: 30,
                guidance_scale: 7.5,
                negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad hands, text, watermark"
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stable Diffusion API error: ${response.status} - ${errorText}`);
    }

    // The response is a binary image
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64 data URL
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    return dataUrl;
}
