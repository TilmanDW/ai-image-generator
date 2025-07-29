export default async function handler(req, res) {
    const token = process.env.HUGGINGFACE_API_KEY;
    
    // Basic checks
    const checks = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 3) || 'none',
        envVarExists: 'HUGGINGFACE_API_KEY' in process.env
    };
    
    if (!token) {
        return res.json({ error: 'No token found', checks });
    }
    
    try {
        // Simplest possible HF API call
        const response = await fetch('https://huggingface.co/api/whoami-v2', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        res.json({
            checks,
            whoami: {
                status: response.status,
                ok: response.ok,
                data: data
            }
        });
        
    } catch (error) {
        res.json({
            checks,
            error: error.message
        });
    }
}
