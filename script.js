// Example prompts
const examples = {
    1: "Deutsche Welle logo in the artistic style of Vincent van Gogh, with swirling brushstrokes, vibrant blues and yellows, post-impressionist technique, oil painting texture, professional logo design with Van Gogh's characteristic bold colors and dynamic movement",
    2: "A cute orange tabby cat wearing protective gear, rollerblading down Kurfürstendamm in Berlin, sunny day, German architecture in background, Kaiser Wilhelm Memorial Church visible, people watching and cheering, dynamic action shot, photorealistic style",
    3: "The Pope and the Dalai Lama sitting together peacefully having tea at a small wooden table on top of a snow-covered Himalayan mountain peak, prayer flags fluttering in the wind, breathtaking mountain vista, golden hour lighting, serene and spiritual atmosphere, photorealistic"
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
            <p>Your generated image will appear here</p>
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
    generateBtn.textContent = '🎨 Generating...';
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('imageOutput').style.display = 'block';
    
    // Re-enable generate button
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = false;
    generateBtn.textContent = '🎨 Generate Image';
}

// Replace the generateImage function with this version
async function generateImage() {
    const inputText = document.getElementById('inputText').value.trim();
    
    if (!inputText) {
        alert('Please describe the image you want to create!');
        return;
    }

    const quality = document.getElementById('qualitySelect').value;
    currentPrompt = inputText;

    showLoading();

    try {
        console.log('Sending request to generate image...');
        
        // Try the simple working version first
        const response = await fetch('/api/simple-working', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: inputText,
                quality: quality
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.imageUrl) {
            displayImage(data.imageUrl, data.source);
        } else {
            throw new Error('No image URL received');
        }

    } catch (error) {
        console.error('Error generating image:', error);
        displayDemoImage();
    }

    hideLoading();
}

// Display generated image
function displayImage(imageUrl) {
    currentImageUrl = imageUrl;
    
    document.getElementById('imageOutput').innerHTML = `
        <img src="${imageUrl}" alt="Generated image" class="generated-image" onload="this.style.opacity=1" style="opacity:0; transition: opacity 0.5s ease;">
    `;
    
    document.getElementById('imageActions').style.display = 'flex';
}

// Display demo image when API fails
function displayDemoImage() {
    const demoImages = [
        'https://via.placeholder.com/512x512/667eea/ffffff?text=🎨+AI+Generated+Image',
        'https://via.placeholder.com/512x512/764ba2/ffffff?text=🖼️+Demo+Image',
        'https://via.placeholder.com/512x512/4facfe/ffffff?text=✨+Sample+Output'
    ];
    
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    
    document.getElementById('imageOutput').innerHTML = `
        <img src="${randomImage}" alt="Demo image" class="generated-image">
        <div style="color: #e74c3c; padding: 15px; background: #ffeaa7; border-radius: 8px; margin-top: 15px;">
            <strong>📝 Demo Mode</strong><br>
            API temporarily unavailable. This is a placeholder image.<br>
            <em>Your prompt: "${currentPrompt}"</em>
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
    link.download = `ai-generated-${Date.now()}.png`;
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
