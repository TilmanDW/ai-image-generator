// Process text with different operations - UPDATE THIS FUNCTION
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
        
        const response = await fetch('/api/generate-image', {
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
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.imageUrl) {
            console.log('Displaying image:', data.imageUrl.substring(0, 100) + '...');
            displayImage(data.imageUrl, data.source);
        } else {
            console.error('No image URL in response:', data);
            throw new Error('No image URL received from server');
        }

    } catch (error) {
        console.error('Error generating image:', error);
        
        // Show detailed error message
        document.getElementById('imageOutput').innerHTML = `
            <div style="color: #e74c3c; padding: 20px; background: #ffeaa7; border-radius: 8px;">
                <strong>⚠️ Generation Error</strong><br>
                ${error.message}<br><br>
                <strong>Troubleshooting:</strong><br>
                • Check if Hugging Face API key is set<br>
                • Try a simpler prompt<br>
                • Check browser console for details<br><br>
                <em>Falling back to demo mode...</em>
            </div>
        `;
        
        // Still show demo image
        setTimeout(() => {
            displayDemoImage();
        }, 2000);
    }

    hideLoading();
}

// Add this function to your script.js
function displayImage(imageUrl, source = 'AI') {
    currentImageUrl = imageUrl;
    
    console.log('Attempting to display image...');
    
    document.getElementById('imageOutput').innerHTML = `
        <img src="${imageUrl}" alt="Generated image" class="generated-image" 
             onload="console.log('Image loaded successfully'); this.style.opacity=1" 
             onerror="console.error('Image failed to load'); this.style.display='none'; this.nextElementSibling.style.display='block'"
             style="opacity:0; transition: opacity 0.5s ease;">
        <div style="display: none; color: #e74c3c; padding: 15px; background: #ffeaa7; border-radius: 8px;">
            <strong>Image Load Error</strong><br>
            The generated image could not be displayed. This might be a temporary issue.
        </div>
        <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
            ✨ Generated with: ${source}
        </div>
    `;
    
    document.getElementById('imageActions').style.display = 'flex';
}
