// SwingSignal AI - Weekly Analysis JavaScript

// Get date from URL query parameter if present
function getWeeklyReportPath() {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    if (date) {
        return `reports/weekly/${date}.json`;
    }
    return 'reports/weekly/latest.json';
}

// Configuration
const CONFIG = {
    dataPath: getWeeklyReportPath(),
    animationDelay: 100
};

// DOM Elements
const elements = {
    reportTitle: document.getElementById('report-title'),
    reportDate: document.getElementById('report-date'),
    weeklyContent: document.getElementById('weekly-content')
};

// Fetch and display the weekly report
async function loadWeeklyReport() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error('Weekly report not found');
        }
        const data = await response.json();
        renderWeeklyReport(data);
    } catch (error) {
        console.error('Error loading weekly report:', error);
        showError();
    }
}

// Render the complete weekly report
function renderWeeklyReport(data) {
    // Update metadata - support both formats
    const meta = data.report_metadata || data.meta;
    if (meta) {
        elements.reportTitle.textContent = meta.title || 'Weekly Market Analysis';

        // Handle date display
        let dateStr = meta.week_ending || meta.generated_date;
        if (!dateStr && meta.generated_at) {
            dateStr = meta.generated_at.split('T')[0];
        }
        elements.reportDate.textContent = `Week Ending: ${formatDate(dateStr)}`;
    }

    // Build the weekly content
    let html = '';

    // Market Overview Section
    if (data.market_overview) {
        html += `
            <div class="weekly-card">
                <div class="weekly-card-header">
                    <h2 class="weekly-card-title">📈 Market Overview</h2>
                </div>
                <div class="weekly-card-content">
                    <p>${escapeHtml(data.market_overview)}</p>
                </div>
            </div>
        `;
    }

    // Key Insights Section
    if (data.key_insights && data.key_insights.length > 0) {
        html += `
            <div class="weekly-card">
                <div class="weekly-card-header">
                    <h2 class="weekly-card-title">💡 Key Insights</h2>
                </div>
                <div class="weekly-card-content">
                    <ul class="insight-list">
                        ${data.key_insights.map(insight => `<li>${escapeHtml(insight)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Top Picks Section
    if (data.top_picks && data.top_picks.length > 0) {
        html += `
            <div class="weekly-card">
                <div class="weekly-card-header">
                    <h2 class="weekly-card-title">🎯 Top Picks This Week</h2>
                </div>
                <div class="weekly-card-content">
                    <div class="top-picks-grid">
                        ${data.top_picks.map(pick => createPickCard(pick)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Sector Analysis Section
    if (data.sector_analysis) {
        html += `
            <div class="weekly-card">
                <div class="weekly-card-header">
                    <h2 class="weekly-card-title">🏭 Sector Analysis</h2>
                </div>
                <div class="weekly-card-content">
                    <p>${escapeHtml(data.sector_analysis)}</p>
                </div>
            </div>
        `;
    }

    // Outlook Section
    if (data.outlook) {
        html += `
            <div class="weekly-card outlook-card">
                <div class="weekly-card-header">
                    <h2 class="weekly-card-title">🔮 Week Ahead Outlook</h2>
                </div>
                <div class="weekly-card-content">
                    <p>${escapeHtml(data.outlook)}</p>
                </div>
            </div>
        `;
    }

    // If no content, show empty state
    if (!html) {
        html = `
            <div class="empty-state">
                <p>No weekly analysis available yet.</p>
            </div>
        `;
    }

    elements.weeklyContent.innerHTML = html;
}

// Create a top pick card
function createPickCard(pick) {
    const symbol = pick.symbol || pick.ticker || 'N/A';
    const action = pick.action || pick.signal || 'BUY';
    const actionClass = action.toLowerCase();
    const rationale = pick.rationale || pick.reason || '';

    return `
        <div class="pick-card ${actionClass}">
            <div class="pick-header">
                <span class="pick-symbol">${escapeHtml(symbol)}</span>
                <span class="action-badge ${actionClass}">${escapeHtml(action)}</span>
            </div>
            ${rationale ? `<p class="pick-rationale">${escapeHtml(rationale)}</p>` : ''}
        </div>
    `;
}

// Format date string
function formatDate(dateStr) {
    if (!dateStr) return 'This Week';

    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error state
function showError() {
    elements.weeklyContent.innerHTML = `
        <div class="empty-state">
            <p>Unable to load weekly analysis. Please try again later.</p>
        </div>
    `;
    elements.reportDate.textContent = 'Error loading report';
}

// Initialize
document.addEventListener('DOMContentLoaded', loadWeeklyReport);
