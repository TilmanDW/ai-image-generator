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

        // Test 1: Simple text model
        console.log('Testing text model...');
        let textData, textStatus, textOk;
        
        try {
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

            textStatus = textResponse.status;
            textOk = textResponse.ok;
            
            // Read body only once based on content type
            const contentType = textResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                textData = await textResponse.json();
            } else {
                const textContent = await textResponse.text();
                textData = { rawResponse: textContent.substring(0, 200) };
            }
        } catch (error) {
            textData = { error: error.message };
            textStatus = 0;
            textOk = false;
        }

        // Test 2: Image model
        console.log('Testing image model...');
        let imageData, imageStatus, imageOk, imageContentType;
        
        try {
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

            imageStatus = imageResponse.status;
            imageOk = imageResponse.ok;
            imageContentType = imageResponse.headers.get('content-type');
            
            // Read body only once based on content type
            if (imageContentType && imageContentType.startsWith('image/')) {
                const buffer = await imageResponse.arrayBuffer();
                imageData = { 
                    type: 'binary_image', 
                    size: buffer.byteLength,
                    contentType: imageContentType,
                    success: buffer.byteLength > 0
                };
            } else if (imageContentType && imageContentType.includes('application/json')) {
                imageData = await imageResponse.json();
            } else {
                const textContent = await imageResponse.text();
                imageData = { rawResponse: textContent.substring(0, 200) };
            }
        } catch (error) {
            imageData = { error: error.message };
            imageStatus = 0;
            imageOk = false;
        }

        res.status(200).json({
            tokenInfo,
            tests: {
                textModel: {
                    status: textStatus,
                    ok: textOk,
                    data: textData
                },
                imageModel: {
                    status: imageStatus,
                    ok: imageOk,
                    contentType: imageContentType,
                    data: imageData
                }
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ 
            error: error.message
        });
    }
}
