// Language translations
const translations = {
    de: {
        mainTitle: "KI Bildgenerator Demo",
        subtitle: "Erleben Sie die Kraft der Künstlichen Intelligenz bei der Bilderzeugung",
        inputLabel: "Beschreiben Sie das Bild, das Sie erstellen möchten:",
        placeholder: "z.B. Ein majestätischer Löwe in einer afrikanischen Savanne bei Sonnenuntergang...",
        demoTitle: "Oder probieren Sie diese Beispiele:",
        demo1: "Deutsche Welle Logo im Van Gogh Stil",
        demo2: "Katze auf Rollschuhen am Kurfürstendamm",
        demo3: "Papst und Dalai Lama beim Tee im Himalaya",
        btnText: "Bild Generieren",
        btnGenerating: "Wird generiert...",
        resultTitle: "Generiertes Bild:",
        downloadText: "Bild herunterladen",
        errorTitle: "Fehler",
        footerText: "Powered by Hugging Face AI | Demo-Website für Bildgenerierung"
    },
    en: {
        mainTitle: "AI Image Generator Demo",
        subtitle: "Experience the power of Artificial Intelligence in image generation",
        inputLabel: "Describe the image you want to create:",
        placeholder: "e.g. A majestic lion in an African savanna at sunset...",
        demoTitle: "Or try these examples:",
        demo1: "Deutsche Welle Logo in Van Gogh Style",
        demo2: "Cat on Roller Skates at Kurfürstendamm",
        demo3: "Pope and Dalai Lama Having Tea in Himalaya",
        btnText: "Generate Image",
        btnGenerating: "Generating...",
        resultTitle: "Generated Image:",
        downloadText: "Download Image",
        errorTitle: "Error",
        footerText: "Powered by Hugging Face AI | Demo Website for Image Generation"
    }
};

let currentLang = 'de';

// DOM Elements
const elements = {
    langDe: document.getElementById('lang-de'),
    langEn: document.getElementById('lang-en'),
    promptInput: document.getElementById('prompt-input'),
    generateBtn: document.getElementById('generate-btn'),
    btnText: document.getElementById('btn-text'),
    loadingSpinner: document.getElementById('loading-spinner'),
    resultContainer: document.getElementById('result-container'),
    errorContainer: document.getElementById('error-container'),
    generatedImage: document.getElementById('generated-image'),
    downloadBtn: document.getElementById('download-btn'),
    errorMessage: document.getElementById('error-message')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateLanguage();
});

function setupEventListeners() {
    // Language toggle
    elements.langDe.addEventListener('click', () => switchLanguage('de'));
    elements.langEn.addEventListener('click', () => switchLanguage('en'));
    
    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const prompt = this.dataset.prompt;
            elements.promptInput.value = prompt;
            elements.promptInput.focus();
        });
    });
    
    // Generate button
    elements.generateBtn.addEventListener('click', generateImage);
    
    // Download button
    elements.downloadBtn.addEventListener('click', downloadImage);
    
    // Enter key in textarea
    elements.promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            generateImage();
        }
    });
}

function switchLanguage(lang) {
    currentLang = lang;
    
    // Update active button
    elements.langDe.classList.toggle('active', lang === 'de');
    elements.langEn.classList.toggle('active', lang === 'en');
    
    updateLanguage();
}

function updateLanguage() {
    const t = translations[currentLang];
    
    // Update all text elements
    document.getElementById('main-title').textContent = t.mainTitle;
    document.getElementById('subtitle').textContent = t.subtitle;
    document.getElementById('input-label').textContent = t.inputLabel;
    document.getElementById('demo-title').textContent = t.demoTitle;
    document.getElementById('demo1').textContent = t.demo1;
    document.getElementById('demo2').textContent = t.demo2;
    document.getElementById('demo3').textContent = t.demo3;
    document.getElementById('btn-text').textContent = t.btnText;
    document.getElementById('result-title').textContent = t.resultTitle;
    document.getElementById('download-text').textContent = t.downloadText;
    document.getElementById('error-title').textContent = t.errorTitle;
    document.getElementById('footer-text').textContent = t.footerText;
    
    elements.promptInput.placeholder = t.placeholder;
    document.documentElement.lang = currentLang;
}

async function generateImage() {
    const prompt = elements.promptInput.value.trim();
    
    if (!prompt) {
        showError(currentLang === 'de' ? 
            'Bitte geben Sie eine Bildbeschreibung ein.' : 
            'Please enter an image description.');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideResults();
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        showResult(imageUrl);
        
    } catch (error) {
        console.error('Error generating image:', error);
        showError(currentLang === 'de' ? 
            'Fehler beim Generieren des Bildes. Bitte versuchen Sie es erneut.' : 
            'Error generating image. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    elements.generateBtn.disabled = loading;
    elements.btnText.classList.toggle('hidden', loading);
    elements.loadingSpinner.classList.toggle('hidden', !loading);
    
    if (loading) {
        elements.btnText.textContent = translations[currentLang].btnGenerating;
    } else {
        elements.btnText.textContent = translations[currentLang].btnText;
    }
}

function showResult(imageUrl) {
    elements.generatedImage.src = imageUrl;
    elements.generatedImage.onload = function() {
        elements.resultContainer.classList.remove('hidden');
        elements.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorContainer.classList.remove('hidden');
    elements.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    elements.resultContainer.classList.add('hidden');
    elements.errorContainer.classList.add('hidden');
}

function downloadImage() {
    const link = document.createElement('a');
    link.href = elements.generatedImage.src;
    link.download = `ai-generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
