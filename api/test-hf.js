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

        // Check token format
        const tokenInfo = {
            hasKey: true,
            tokenPrefix: apiKey.substring(0, 10),
            tokenLength: apiKey.length,
            startsWithHf: apiKey.startsWith('hf_'),
            tokenFormat: apiKey.startsWith('hf_') ? 'correct' : 'incorrect - should start with hf_'
        };

        console.log('Token info:', tokenInfo);

        // Test with the simplest possible request
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: "Hello"
            })
        });

        const status = response.status;
        const statusText = response.statusText;
        let responseData;

        try {
            const responseText = await response.text();
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = { rawResponse: responseText.substring(0, 500) };
            }
        } catch (e) {
            responseData = { error: 'Could not read response' };
        }

        res.status(200).json({
            tokenInfo,
            testResponse: {
                ok: response.ok,
                status: status,
                statusText: statusText,
                data: responseData
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
