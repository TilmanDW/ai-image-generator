export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Testing Hugging Face API...');
        
        if (!process.env.HUGGINGFACE_API_KEY) {
            return res.status(500).json({ 
                error: 'No API key found',
                hasKey: false 
            });
        }

        // Test with a simple model first
        const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: "a simple red apple",
                options: {
                    wait_for_model: true
                }
            })
        });

        const isOk = response.ok;
        const status = response.status;
        let responseData;

        try {
            if (response.headers.get('content-type')?.includes('application/json')) {
                responseData = await response.json();
            } else {
                const buffer = await response.arrayBuffer();
                responseData = { 
                    type: 'binary', 
                    size: buffer.byteLength,
                    contentType: response.headers.get('content-type')
                };
            }
        } catch (e) {
            responseData = { error: 'Could not parse response' };
        }

        res.status(200).json({
            hasKey: true,
            apiKeyPrefix: process.env.HUGGINGFACE_API_KEY.substring(0, 7) + '...',
            testResponse: {
                ok: isOk,
                status: status,
                data: responseData
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ 
            error: error.message,
            hasKey: !!process.env.HUGGINGFACE_API_KEY
        });
    }
}
