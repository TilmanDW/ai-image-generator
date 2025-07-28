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
        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    try {
        const { prompt, quality = 'standard' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Eingabe ist erforderlich' });
        }

        // Quality settings
        const qualitySettings = {
            fast: { width: 512, height: 512 },
            standard: { width: 768, height: 768 },
            high: { width: 1024, height: 1024 }
        };

        const settings = qualitySettings[quality] || qualitySettings.standard;

        // Translate German prompt to English for better AI results
        const translatedPrompt = await translatePromptToEnglish(prompt);

        // Try Stable Diffusion API
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                const imageUrl = await generateWithStableDiffusion(translatedPrompt, settings);
                return res.status(200).json({ 
                    imageUrl: imageUrl,
                    originalPrompt: prompt,
                    translatedPrompt: translatedPrompt,
                    quality: quality,
                    source: 'Stable Diffusion XL'
                });
            } catch (apiError) {
                console.log('Stable Diffusion API fehlgeschlagen:', apiError.message);
            }
        }

        // Fallback to demo response
        console.log('Verwende Demo-Modus für Bildgenerierung');
        const demoImageUrl = `https://via.placeholder.com/${settings.width}x${settings.height}/667eea/ffffff?text=🎨+KI+Demo+Bild`;
        
        res.status(200).json({ 
            imageUrl: demoImageUrl,
            originalPrompt: prompt,
            translatedPrompt: translatedPrompt,
            quality: quality,
            source: 'Demo-Modus',
            message: 'Demo-Platzhalter - Integration mit Hugging Face für echte KI-Generierung'
        });

    } catch (error) {
        console.error('Fehler:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
}

// Simple German to English translation for common art terms
async function translatePromptToEnglish(germanPrompt) {
    // Basic translation dictionary for art/image terms
    const translations = {
        // Art styles
        'im stil von': 'in the style of',
        'künstlerisch': 'artistic',
        'fotorealistisch': 'photorealistic',
        'malerei': 'painting',
        'ölgemälde': 'oil painting',
        'aquarell': 'watercolor',
        'digital': 'digital art',
        'abstrakt': 'abstract',
        
        // Colors
        'rot': 'red',
        'blau': 'blue',
        'grün': 'green',
        'gelb': 'yellow',
        'orange': 'orange',
        'lila': 'purple',
        'rosa': 'pink',
        'schwarz': 'black',
        'weiß': 'white',
        'grau': 'gray',
        
        // Objects/Subjects
        'katze': 'cat',
        'hund': 'dog',
        'berg': 'mountain',
        'himmel': 'sky',
        'sonne': 'sun',
        'mond': 'moon',
        'baum': 'tree',
        'blume': 'flower',
        'haus': 'house',
        'stadt': 'city',
        'kirche': 'church',
        'schloss': 'castle',
        
        // Descriptions
        'schön': 'beautiful',
        'groß': 'large',
        'klein': 'small',
        'hell': 'bright',
        'dunkel': 'dark',
        'alt': 'old',
        'neu': 'new',
        'schnell': 'fast',
        'langsam': 'slow',
        
        // Specific German locations/terms
        'kurfürstendamm': 'Kurfuerstendamm Berlin',
        'kaiser wilhelm gedächtniskirche': 'Kaiser Wilhelm Memorial Church',
        'deutsche welle': 'Deutsche Welle',
        'berlin': 'Berlin Germany',
        'münchen': 'Munich Germany',
        'hamburg': 'Hamburg Germany',
        'köln': 'Cologne Germany',
        
        // Religious figures
        'papst': 'pope',
        'dalai lama': 'dalai lama',
        'tee trinken': 'having tea',
        'himalaya': 'himalaya mountains',
        
        // Actions
        'rollschuhlaufen': 'rollerblading',
        'fliegen': 'flying',
        'laufen': 'running',
        'sitzen': 'sitting',
        'stehen': 'standing',
        'schauen': 'looking',
        
        // Quality descriptors
        'hochwertig': 'high quality',
        'detailliert': 'detailed',
        'professionell': 'professional',
        'meisterwerk': 'masterpiece'
    };
    
    let translatedPrompt = germanPrompt.toLowerCase();
    
    // Apply translations
    for (const [german, english] of Object.entries(translations)) {
        const regex = new RegExp(german, 'gi');
        translatedPrompt = translatedPrompt.replace(regex, english);
    }
    
    // Add quality enhancers for AI
    translatedPrompt += ', high quality, detailed, professional, 8k resolution, masterpiece';
    
    return translatedPrompt;
}

async function generateWithStableDiffusion(prompt, settings) {
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                width: settings.width,
                height: settings.height,
                num_inference_steps: 30,
                guidance_scale: 7.5,
                negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad hands, text, watermark, schlecht, unscharf"
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stable Diffusion API Fehler: ${response.status} - ${errorText}`);
    }

    // The response is a binary image
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64 data URL
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    return dataUrl;
}
