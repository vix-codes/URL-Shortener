const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : '';

const shortenBtn = document.getElementById('shortenBtn');
const longUrlInput = document.getElementById('longUrl');
const resultContainer = document.getElementById('result');
const shortUrlText = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');

const checkAnalyticsBtn = document.getElementById('checkAnalyticsBtn');
const analyticsCodeInput = document.getElementById('analyticsCode');
const analyticsResult = document.getElementById('analyticsResult');
const clickCountSpan = document.getElementById('clickCount');
const createdAtSpan = document.getElementById('createdAt');
const expiresAtSpan = document.getElementById('expiresAt');

function extractShortCode(input) {
    const raw = (input || '').trim();
    if (!raw) return '';

    // If user pasted a full URL, parse and grab the first path segment.
    try {
        const parsed = new URL(raw);
        const path = (parsed.pathname || '/').replace(/^\/+/, '');
        const code = path.split('/')[0]?.trim() || '';
        return code;
    } catch (_) {
        // Not a URL; treat as direct short code (strip any leading '/')
        return raw.replace(/^\/+/, '');
    }
}

// Shorten URL
shortenBtn.addEventListener('click', async () => {
    const url = longUrlInput.value;
    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }

    const originalText = shortenBtn.innerText;
    shortenBtn.disabled = true;
    shortenBtn.innerHTML = '<div class="spinner-container"><div class="spinner"></div>Creating...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) throw new Error('Failed to shorten URL');

        const data = await response.json();
        shortUrlText.innerText = data.shortUrl;
        resultContainer.classList.remove('hidden');
        showToast('Success! URL shortened.', 'success');
    } catch (error) {
        console.error(error);
        showToast('Error shortening URL. Is the backend running?', 'error');
    } finally {
        shortenBtn.disabled = false;
        shortenBtn.innerText = originalText;
    }
});

// Analytics
checkAnalyticsBtn.addEventListener('click', async () => {
    const code = extractShortCode(analyticsCodeInput.value);
    if (!code) {
        showToast('Please paste a short URL or code', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/analytics/${code}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error('Code not found');
            throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        clickCountSpan.innerText = data.clickCount;
        createdAtSpan.innerText = new Date(data.createdAt).toLocaleDateString();
        expiresAtSpan.innerText = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never';
        
        analyticsResult.classList.remove('hidden');
        showToast('Analytics loaded.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Copy to Clipboard
copyBtn.addEventListener('click', () => {
    const text = shortUrlText.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
});

// Helper: Show Toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    // Clear previous timeout if any
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    
    window.toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
