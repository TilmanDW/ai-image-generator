export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Testing Hugging Face API...');
        
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'No API key found',
                hasKey: false 
            });
        }

        const tokenInfo = {
            hasKey: true,
            tokenPrefix: apiKey.substring(0, 10),
            tokenLength: apiKey.length,
            startsWithHf: apiKey.startsWith('hf_')
        };

        // Test 1: Simple text model (should work)
        console.log('Testing text model...');
        const textResponse = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: "The quick brown fox",
                parameters: { max_length: 50 }
            })
        });

        const textStatus = textResponse.status;
        let textData;
        try {
            textData = await textResponse.json();
        } catch {
            textData = { error: 'Could not parse response' };
        }

        // Test 2: Image model
        console.log('Testing image model...');
        const imageResponse = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: "a red apple on a table"
            })
        });

        const imageStatus = imageResponse.status;
        const imageContentType = imageResponse.headers.get('content-type');
        let imageData;

        if (imageContentType && imageContentType.includes('image/')) {
            const buffer = await imageResponse.arrayBuffer();
            imageData = { 
                type: 'binary_image', 
                size: buffer.byteLength,
                contentType: imageContentType
            };
        } else {
            try {
                imageData = await imageResponse.json();
            } catch {
                const text = await imageResponse.text();
                imageData = { rawResponse: text.substring(0, 200) };
            }
        }

        res.status(200).json({
            tokenInfo,
            tests: {
                textModel: {
                    status: textStatus,
                    ok: textResponse.ok,
                    data: textData
                },
                imageModel: {
                    status: imageStatus,
                    ok: imageResponse.ok,
                    contentType: imageContentType,
                    data: imageData
                }
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
}
