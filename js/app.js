// SwingSignal AI - Main Application JavaScript

// Get date from URL query parameter if present
function getReportPath() {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    if (date) {
        return `reports/${date}.json`;
    }
    return 'reports/latest.json';
}

// Configuration
const CONFIG = {
    dataPath: getReportPath(),
    animationDelay: 100
};

// DOM Elements
const elements = {
    reportTitle: document.getElementById('report-title'),
    reportDate: document.getElementById('report-date'),
    totalSignals: document.getElementById('total-signals'),
    buySignals: document.getElementById('buy-signals'),
    sellSignals: document.getElementById('sell-signals'),
    signalsContainer: document.getElementById('signals-container')
};

// Fetch and display the latest report
async function loadReport() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error('Report not found');
        }
        const data = await response.json();
        renderReport(data);
    } catch (error) {
        console.error('Error loading report:', error);
        showError();
    }
}

// Render the complete report
function renderReport(data) {
    // Update metadata
    if (data.report_metadata) {
        const meta = data.report_metadata;
        elements.reportTitle.textContent = meta.title || 'SwingSignal AI';

        const dateStr = formatDate(meta.generated_date);
        elements.reportDate.textContent = dateStr;

        elements.totalSignals.textContent = meta.total_signals || data.signals?.length || 0;
    }

    // Count buy/sell signals
    const buyCount = data.signals?.filter(s => s.action?.toUpperCase() === 'BUY').length || 0;
    const sellCount = data.signals?.filter(s => s.action?.toUpperCase() === 'SELL').length || 0;

    elements.buySignals.textContent = buyCount;
    elements.sellSignals.textContent = sellCount;

    // Render signal cards
    renderSignals(data.signals || []);
}

// Render all signal cards
function renderSignals(signals) {
    if (!signals.length) {
        elements.signalsContainer.innerHTML = `
            <div class="empty-state">
                <p>No signals available for today.</p>
            </div>
        `;
        return;
    }

    elements.signalsContainer.innerHTML = '';

    signals.forEach((signal, index) => {
        const card = createSignalCard(signal);
        card.style.animationDelay = `${index * CONFIG.animationDelay}ms`;
        elements.signalsContainer.appendChild(card);
    });
}

// Create a single signal card
function createSignalCard(signal) {
    const card = document.createElement('div');
    const actionClass = signal.action?.toLowerCase() || 'buy';
    card.className = `signal-card ${actionClass}`;

    const setup = signal.trade_setup || {};

    card.innerHTML = `
        <div class="signal-header">
            <div class="signal-info">
                <div class="signal-symbol">${escapeHtml(signal.symbol || 'N/A')}</div>
                <div class="signal-price">Ref: ₹${formatNumber(signal.reference_price)}</div>
            </div>
            <div class="signal-badges">
                <span class="action-badge ${actionClass}">${escapeHtml(signal.action || 'N/A')}</span>
                <span class="score-badge">
                    <span>⭐</span>
                    <span>${escapeHtml(signal.score || 'N/A')}</span>
                </span>
            </div>
        </div>
        
        <div class="trade-setup">
            <div class="setup-grid">
                <div class="setup-item">
                    <div class="setup-label">Entry</div>
                    <div class="setup-value entry">${formatSetupValue(setup.entry)}</div>
                </div>
                <div class="setup-item">
                    <div class="setup-label">Stop Loss</div>
                    <div class="setup-value stop">${formatSetupValue(setup.stop)}</div>
                </div>
                <div class="setup-item">
                    <div class="setup-label">Target</div>
                    <div class="setup-value target">${formatSetupValue(setup.target)}</div>
                </div>
            </div>
        </div>
        
        <div class="signal-analysis">
            <button class="analysis-toggle" onclick="toggleAnalysis(this)">
                <span>View Analysis</span>
                <span class="icon">▼</span>
            </button>
            <div class="analysis-content">
                <div class="analysis-text">${escapeHtml(signal.analysis || 'No analysis available.')}</div>
            </div>
        </div>
    `;

    return card;
}

// Toggle analysis visibility
function toggleAnalysis(button) {
    button.classList.toggle('active');
    const content = button.nextElementSibling;
    content.classList.toggle('show');

    const span = button.querySelector('span:first-child');
    span.textContent = content.classList.contains('show') ? 'Hide Analysis' : 'View Analysis';
}

// Format date string
function formatDate(dateStr) {
    if (!dateStr) return 'Today';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return Number(num).toLocaleString('en-IN');
}

// Format setup value (handles both strings and numbers)
function formatSetupValue(value) {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
        return formatNumber(value);
    }
    return escapeHtml(String(value));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error state
function showError() {
    elements.signalsContainer.innerHTML = `
        <div class="empty-state">
            <p>Unable to load signals. Please try again later.</p>
        </div>
    `;
    elements.reportDate.textContent = 'Error loading report';
}

// Initialize
document.addEventListener('DOMContentLoaded', loadReport);
