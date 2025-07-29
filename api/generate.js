export default async function handler(req, res) {
    // Set CORS headers
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
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Hugging Face API configuration
        const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY;
        const MODEL_ID = "black-forest-labs/FLUX.1-schnell";
        
        if (!HF_API_TOKEN) {
            console.error('Hugging Face API token not found');
            return res.status(500).json({ error: 'API configuration error' });
        }

        // Enhanced prompt for better results
        const enhancedPrompt = `${prompt}, high quality, detailed, professional photography`;

        console.log('Generating image for prompt:', enhancedPrompt);

        const response = await fetch(
            `https://api-inference.huggingface.co/models/${MODEL_ID}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: enhancedPrompt,
                    parameters: {
                        guidance_scale: 7.5,
                        num_inference_steps: 25,
                        width: 1024,
                        height: 1024
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Hugging Face API error:', response.status, errorText);
            
            if (response.status === 503) {
                return res.status(503).json({ 
                    error: 'Model is currently loading. Please try again in a few moments.' 
                });
            }
            
            return res.status(response.status).json({ 
                error: `API error: ${response.status}` 
            });
        }

        const imageBuffer = await response.arrayBuffer();
        
        if (imageBuffer.byteLength === 0) {
            throw new Error('Received empty image data');
        }

        // Set appropriate headers for image response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageBuffer.byteLength);
        
        // Send the image data
        res.status(200).send(Buffer.from(imageBuffer));

    } catch (error) {
        console.error('Error in generate API:', error);
        res.status(500).json({ 
            error: 'Failed to generate image',
            details: error.message 
        });
    }
}
