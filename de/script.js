// German example prompts
const examples = {
    1: "Deutsche Welle Logo im künstlerischen Stil von Vincent van Gogh, mit wirbelnden Pinselstrichen, lebendigen Blau- und Gelbtönen, postimpressionistische Technik, Ölgemälde-Textur, professionelles Logo-Design mit Van Goghs charakteristischen kräftigen Farben und dynamischer Bewegung",
    2: "Eine süße orange getigerte Katze mit Schutzausrüstung, die auf Rollschuhen den Kurfürstendamm in Berlin hinunterrollt, sonniger Tag, deutsche Architektur im Hintergrund, Kaiser-Wilhelm-Gedächtniskirche sichtbar, Menschen schauen zu und jubeln, dynamische Action-Aufnahme, fotorealistischer Stil",
    3: "Der Papst und der Dalai Lama sitzen friedlich zusammen und trinken Tee an einem kleinen Holztisch auf dem Gipfel eines schneebedeckten Himalaya-Bergs, Gebetsfahnen flattern im Wind, atemberaubender Bergblick, goldenes Stundenlicht, ruhige und spirituelle Atmosphäre, fotorealistisch"
};

let currentImageUrl = null;
let currentPrompt = null;

// Load example text
function loadExample(exampleNum) {
    const inputText = document.getElementById('inputText');
    inputText.value = examples[exampleNum];
    inputText.style.height = 'auto';
    inputText.style.height = inputText.scrollHeight + 'px';
}

// Clear text
function clearText() {
    document.getElementById('inputText').value = '';
    document.getElementById('imageOutput').innerHTML = `
        <div class="placeholder-image">
            <span>🎨</span>
            <p>Ihr generiertes Bild wird hier erscheinen</p>
        </div>
    `;
    document.getElementById('imageActions').style.display = 'none';
    currentImageUrl = null;
    currentPrompt = null;
}

// Show loading state
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('imageOutput').style.display = 'none';
    document.getElementById('imageActions').style.display = 'none';
    
    // Disable generate button
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '🎨 Generiert...';
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('imageOutput').style.display = 'block';
    
    // Re-enable generate button
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = false;
    generateBtn.textContent = '🎨 Bild generieren';
}

// Generate image
async function generateImage() {
    const inputText = document.getElementById('inputText').value.trim();
    
    if (!inputText) {
        alert('Bitte beschreiben Sie das Bild, das Sie erstellen möchten!');
        return;
    }

    const quality = document.getElementById('qualitySelect').value;
    currentPrompt = inputText;

    showLoading();

    try {
        const response = await fetch('/api/generate-image-de', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: inputText,
                quality: quality
            })
        });

        if (!response.ok) {
            throw new Error(`Server-Fehler: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.imageUrl) {
            displayImage(data.imageUrl, data.source);
        } else {
            throw new Error('Keine Bild-URL erhalten');
        }

    } catch (error) {
        console.error('Fehler beim Generieren des Bildes:', error);
        
        // Show demo placeholder
        displayDemoImage();
    }

    hideLoading();
}

// Display generated image
function displayImage(imageUrl, source = 'KI') {
    currentImageUrl = imageUrl;
    
    const sourceText = source === 'Demo Mode' ? 'Demo-Modus' : source;
    
    document.getElementById('imageOutput').innerHTML = `
        <img src="${imageUrl}" alt="Generiertes Bild" class="generated-image" onload="this.style.opacity=1" style="opacity:0; transition: opacity 0.5s ease;">
        <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
            ✨ Generiert mit: ${sourceText}
        </div>
    `;
    
    document.getElementById('imageActions').style.display = 'flex';
}

// Display demo image when API fails
function displayDemoImage() {
    const demoImages = [
        'https://via.placeholder.com/512x512/667eea/ffffff?text=🎨+KI+Generiertes+Bild',
        'https://via.placeholder.com/512x512/764ba2/ffffff?text=🖼️+Demo+Bild',
        'https://via.placeholder.com/512x512/4facfe/ffffff?text=✨+Beispiel+Ausgabe'
    ];
    
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    
    document.getElementById('imageOutput').innerHTML = `
        <img src="${randomImage}" alt="Demo-Bild" class="generated-image">
        <div style="color: #e74c3c; padding: 15px; background: #ffeaa7; border-radius: 8px; margin-top: 15px;">
            <strong>📝 Demo-Modus</strong><br>
            API vorübergehend nicht verfügbar. Dies ist ein Platzhalterbild.<br>
            <em>Ihre Eingabe: "${currentPrompt}"</em>
        </div>
    `;
    
    document.getElementById('imageActions').style.display = 'flex';
    currentImageUrl = randomImage;
}

// Download image
function downloadImage() {
    if (!currentImageUrl) return;
    
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `ki-generiert-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Regenerate image
function regenerateImage() {
    if (currentPrompt) {
        generateImage();
    }
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('inputText');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
});
