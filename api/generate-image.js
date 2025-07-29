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

        // Quality settings
        const qualitySettings = {
            fast: { width: 512, height: 512 },
            standard: { width: 768, height: 768 },
            high: { width: 1024, height: 1024 }
        };

        const settings = qualitySettings[quality] || qualitySettings.standard;

        // Try multiple models as fallback
        const models = [
            'stabilityai/stable-diffusion-xl-base-1.0',
            'runwayml/stable-diffusion-v1-5',
            'CompVis/stable-diffusion-v1-4'
        ];

        if (process.env.HUGGINGFACE_API_KEY) {
            for (const model of models) {
                try {
                    console.log(`Trying model: ${model}`);
                    const imageUrl = await generateWithHuggingFace(prompt, settings, model);
                    console.log('Successfully generated image');
                    return res.status(200).json({ 
                        imageUrl: imageUrl,
                        prompt: prompt,
                        quality: quality,
                        source: `Hugging Face (${model.split('/')[1]})`
                    });
                } catch (apiError) {
                    console.log(`Model ${model} failed:`, apiError.message);
                    continue; // Try next model
                }
            }
        } else {
            console.log('No Hugging Face API key found');
        }

        // Fallback to demo response
        console.log('Using demo mode for image generation');
        const demoImageUrl = createDemoImage(prompt, settings);
        
        res.status(200).json({ 
            imageUrl: demoImageUrl,
            prompt: prompt,
            quality: quality,
            source: 'Demo Mode',
            message: 'Using demo mode - add HUGGINGFACE_API_KEY for real AI generation'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

async function generateWithHuggingFace(prompt, settings, modelId) {
    // Enhance prompt for better results
    const enhancedPrompt = `${prompt}, high quality, detailed, masterpiece, best quality`;

    console.log(`Calling ${modelId} with prompt:`, enhancedPrompt);

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
                num_inference_steps: 20, // Reduced for faster generation
                guidance_scale: 7.5,
                width: settings.width,
                height: settings.height,
                negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy"
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.log('API Error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Response content type:', contentType);

    if (contentType && contentType.includes('application/json')) {
        // Handle JSON error response
        const jsonResponse = await response.json();
        console.log('JSON Response:', jsonResponse);
        
        if (jsonResponse.error) {
            throw new Error(`API returned error: ${jsonResponse.error}`);
        }
        
        // Some APIs return JSON with image data
        if (jsonResponse.images && jsonResponse.images[0]) {
            return `data:image/png;base64,${jsonResponse.images[0]}`;
        }
        
        throw new Error('Unexpected JSON response format');
    }

    // Handle binary image response
    const imageBuffer = await response.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength);
    
    if (imageBuffer.byteLength === 0) {
        throw new Error('Received empty image data');
    }
    
    // Convert to base64 data URL
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    return dataUrl;
}

function createDemoImage(prompt, settings) {
    // Create a more sophisticated demo image URL
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
    return `https://via.placeholder.com/${settings.width}x${settings.height}/667eea/ffffff?text=${encodedPrompt}`;
}
