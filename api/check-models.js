export default async function handler(req, res) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
        return res.json({ error: 'No API key' });
    }

    try {
        // Test different model endpoints to see which ones work
        const testModels = [
            'gpt2',
            'microsoft/DialoGPT-medium',
            'bert-base-uncased',
            'runwayml/stable-diffusion-v1-5',
            'CompVis/stable-diffusion-v1-4',
            'stabilityai/stable-diffusion-2-1'
        ];

        const results = {};

        for (const model of testModels) {
            try {
                console.log(`Testing model: ${model}`);
                
                const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                    method: 'GET', // Just check if the model exists
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    }
                });

                results[model] = {
                    status: response.status,
                    ok: response.ok,
                    exists: response.status !== 404
                };

                // If model exists, try a simple POST
                if (response.ok) {
                    try {
                        const postResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                inputs: "test"
                            })
                        });

                        results[model].postStatus = postResponse.status;
                        results[model].postOk = postResponse.ok;
                        
                        if (!postResponse.ok) {
                            const errorText = await postResponse.text();
                            results[model].postError = errorText.substring(0, 100);
                        }
                    } catch (postError) {
                        results[model].postError = postError.message;
                    }
                }

            } catch (error) {
                results[model] = {
                    error: error.message
                };
            }
        }

        res.json({
            apiKeyExists: true,
            results: results
        });

    } catch (error) {
        res.json({ error: error.message });
    }
}
