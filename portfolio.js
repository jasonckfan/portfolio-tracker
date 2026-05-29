// Portfolio Tracker JavaScript
// ETF Portfolio Configuration
const PORTFOLIO_CONFIG = {
    startDate: '2025-06-01',
    monthlyAmountHKD: 8000,
    exchangeRate: 7.8,
    targetAnnualReturn: 12,
    totalPeriods: 120,
    etfs: {
        VOO: { name: 'Vanguard S&P 500 ETF', allocation: 0.30 },
        QQQ: { name: 'Invesco QQQ Trust', allocation: 0.25 },
        SPMO: { name: 'Invesco S&P 500 Momentum ETF', allocation: 0.20 },
        XLK: { name: 'Technology Select Sector SPDR', allocation: 0.15 },
        SMH: { name: 'VanEck Semiconductor ETF', allocation: 0.10 }
    }
};

// State management
let portfolioData = {
    investments: [], // Array of monthly investment records
    currentPrices: {}, // Current ETF prices
    lastUpdated: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePortfolio();
    loadData();
    fetchPrices();
    setupEventListeners();
    checkAlerts();
});

// Initialize portfolio data
function initializePortfolio() {
    // Check if we have saved data
    const saved = localStorage.getItem('portfolioData');
    if (!saved) {
        // Create initial empty portfolio
        portfolioData = {
            investments: [],
            currentPrices: {},
            lastUpdated: new Date().toISOString()
        };
        saveData();
    }
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('portfolioData');
    if (saved) {
        portfolioData = JSON.parse(saved);
    }
    
    // Load settings
    const settings = localStorage.getItem('portfolioSettings');
    if (settings) {
        const s = JSON.parse(settings);
        document.getElementById('monthlyAmount').value = s.monthlyAmountHKD || 8000;
        document.getElementById('exchangeRate').value = s.exchangeRate || 7.8;
        document.getElementById('startDate').value = s.startDate || '2025-06-01';
        document.getElementById('targetReturn').value = s.targetAnnualReturn || 12;
        
        // Update config
        PORTFOLIO_CONFIG.monthlyAmountHKD = s.monthlyAmountHKD || 8000;
        PORTFOLIO_CONFIG.exchangeRate = s.exchangeRate || 7.8;
        PORTFOLIO_CONFIG.startDate = s.startDate || '2025-06-01';
        PORTFOLIO_CONFIG.targetAnnualReturn = s.targetAnnualReturn || 12;
    }
    
    updateUI();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
}

// Save settings
function saveSettings() {
    const settings = {
        monthlyAmountHKD: parseFloat(document.getElementById('monthlyAmount').value),
        exchangeRate: parseFloat(document.getElementById('exchangeRate').value),
        startDate: document.getElementById('startDate').value,
        targetAnnualReturn: parseFloat(document.getElementById('targetReturn').value)
    };
    localStorage.setItem('portfolioSettings', JSON.stringify(settings));
    
    // Update config
    PORTFOLIO_CONFIG.monthlyAmountHKD = settings.monthlyAmountHKD;
    PORTFOLIO_CONFIG.exchangeRate = settings.exchangeRate;
    PORTFOLIO_CONFIG.startDate = settings.startDate;
    PORTFOLIO_CONFIG.targetAnnualReturn = settings.targetAnnualReturn;
}

// Fetch current prices from Yahoo Finance
async function fetchPrices() {
    const symbols = Object.keys(PORTFOLIO_CONFIG.etfs);
    
    try {
        // Using a proxy service to fetch Yahoo Finance data
        // In production, you might want to use a proper API
        for (const symbol of symbols) {
            try {
                const price = await fetchYahooPrice(symbol);
                if (price) {
                    portfolioData.currentPrices[symbol] = price;
                }
            } catch (e) {
                console.error(`Failed to fetch price for ${symbol}:`, e);
            }
        }
        
        portfolioData.lastUpdated = new Date().toISOString();
        saveData();
        updateUI();
        
    } catch (error) {
        console.error('Failed to fetch prices:', error);
    }
}

// Fetch price from Yahoo Finance
async function fetchYahooPrice(symbol) {
    // Using Yahoo Finance API through a CORS proxy
    const proxyUrls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    ];
    
    for (const url of proxyUrls) {
        try {
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const data = await response.json();
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const meta = data.chart.result[0].meta;
                return meta.regularMarketPrice || meta.previousClose;
            }
        } catch (e) {
            continue;
        }
    }
    
    // Fallback: return mock price for demo
    return getMockPrice(symbol);
}

// Mock prices for demo (when API fails)
function getMockPrice(symbol) {
    const mockPrices = {
        VOO: 550.00,
        QQQ: 490.00,
        SPMO: 65.00,
        XLK: 230.00,
        SMH: 250.00
    };
    return mockPrices[symbol] || 100;
}

// Calculate portfolio metrics
function calculateMetrics() {
    const monthlyUSD = PORTFOLIO_CONFIG.monthlyAmountHKD / PORTFOLIO_CONFIG.exchangeRate;
    const investments = portfolioData.investments;
    const currentPrices = portfolioData.currentPrices;
    
    let totalInvested = 0;
    let totalValue = 0;
    const etfMetrics = {};
    
    // Initialize ETF metrics
    for (const [symbol, config] of Object.entries(PORTFOLIO_CONFIG.etfs)) {
        etfMetrics[symbol] = {
            name: config.name,
            allocation: config.allocation,
            monthlyUSD: monthlyUSD * config.allocation,
            totalInvested: 0,
            totalShares: 0,
            currentPrice: currentPrices[symbol] || 0,
            currentValue: 0,
            profit: 0,
            return: 0
        };
    }
    
    // Calculate from investment history
    for (const inv of investments) {
        const etf = etfMetrics[inv.symbol];
        if (etf) {
            etf.totalInvested += inv.amountUSD;
            etf.totalShares += inv.shares;
            totalInvested += inv.amountUSD;
        }
    }
    
    // Calculate current values
    for (const symbol of Object.keys(etfMetrics)) {
        const etf = etfMetrics[symbol];
        etf.currentPrice = currentPrices[symbol] || etf.currentPrice;
        etf.currentValue = etf.totalShares * etf.currentPrice;
        etf.profit = etf.currentValue - etf.totalInvested;
        etf.return = etf.totalInvested > 0 ? (etf.profit / etf.totalInvested) * 100 : 0;
        totalValue += etf.currentValue;
    }
    
    // Portfolio metrics
    const totalProfit = totalValue - totalInvested;
    const totalReturn = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    
    // Calculate XIRR (simplified)
    const annualReturn = calculateAnnualReturn(investments, totalValue);
    
    return {
        totalInvested,
        totalValue,
        totalProfit,
        totalReturn,
        annualReturn,
        etfMetrics,
        currentPeriod: investments.length / Object.keys(PORTFOLIO_CONFIG.etfs).length
    };
}

// Calculate annual return (XIRR approximation)
function calculateAnnualReturn(investments, currentValue) {
    if (investments.length === 0) return 0;
    
    const startDate = new Date(PORTFOLIO_CONFIG.startDate);
    const now = new Date();
    const years = (now - startDate) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (years <= 0) return 0;
    
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountUSD, 0);
    if (totalInvested <= 0) return 0;
    
    // Simplified CAGR calculation
    return ((currentValue / totalInvested) ** (1 / years) - 1) * 100;
}

// Update UI
function updateUI() {
    const metrics = calculateMetrics();
    
    // Update summary cards
    document.getElementById('portfolioValue').textContent = formatCurrency(metrics.totalValue);
    document.getElementById('totalInvested').textContent = formatCurrency(metrics.totalInvested);
    
    const profitElement = document.getElementById('totalProfit');
    profitElement.textContent = (metrics.totalProfit >= 0 ? '+' : '') + formatCurrency(metrics.totalProfit);
    profitElement.className = 'card-value ' + (metrics.totalProfit >= 0 ? 'positive' : 'negative');
    
    const profitChange = document.getElementById('profitChange');
    profitChange.textContent = (metrics.totalProfit >= 0 ? '+' : '') + formatCurrency(metrics.totalProfit);
    profitChange.className = 'card-change ' + (metrics.totalProfit >= 0 ? 'positive' : 'negative');
    
    const returnElement = document.getElementById('totalReturn');
    returnElement.textContent = formatPercent(metrics.totalReturn);
    returnElement.className = 'card-value ' + (metrics.totalReturn >= 0 ? 'positive' : 'negative');
    
    const returnChange = document.getElementById('returnChange');
    returnChange.textContent = formatPercent(metrics.totalReturn);
    returnChange.className = 'card-change ' + (metrics.totalReturn >= 0 ? 'positive' : 'negative');
    
    document.getElementById('annualReturn').textContent = formatPercent(metrics.annualReturn);
    document.getElementById('currentPeriod').textContent = Math.floor(metrics.currentPeriod);
    
    // Update last updated
    const lastUpdated = portfolioData.lastUpdated ? new Date(portfolioData.lastUpdated) : new Date();
    document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleString('zh-HK');
    document.getElementById('footerUpdated').textContent = lastUpdated.toLocaleString('zh-HK');
    
    // Update ETF table
    updateETFTable(metrics.etfMetrics);
    
    // Update investment log
    updateInvestmentLog();
    
    // Update charts
    updateCharts(metrics);
    
    // Update next investment alert
    updateNextInvestmentAlert(metrics);
    
    // Update allocation sliders
    updateAllocationSliders();
}

// Update ETF table
function updateETFTable(etfMetrics) {
    const tbody = document.getElementById('etfTableBody');
    tbody.innerHTML = '';
    
    for (const [symbol, etf] of Object.entries(etfMetrics)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>${etf.name}</td>
            <td>${(etf.allocation * 100).toFixed(0)}%</td>
            <td>$${formatNumber(etf.monthlyUSD)}</td>
            <td>$${formatNumber(etf.totalInvested)}</td>
            <td>${formatNumber(etf.totalShares, 4)}</td>
            <td>$${formatNumber(etf.currentPrice)}</td>
            <td>$${formatNumber(etf.currentValue)}</td>
            <td class="${etf.profit >= 0 ? 'positive' : 'negative'}">${etf.profit >= 0 ? '+' : ''}$${formatNumber(etf.profit)}</td>
            <td class="${etf.return >= 0 ? 'positive' : 'negative'}">${etf.return >= 0 ? '+' : ''}${formatPercent(etf.return)}</td>
        `;
        tbody.appendChild(row);
    }
}

// Update investment log
function updateInvestmentLog() {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    
    const investments = portfolioData.investments;
    
    // Show last 12 records by default
    const recentInvestments = investments.slice(-12).reverse();
    
    for (let i = 0; i < recentInvestments.length; i++) {
        const inv = recentInvestments[i];
        const etf = PORTFOLIO_CONFIG.etfs[inv.symbol];
        const currentPrice = portfolioData.currentPrices[inv.symbol] || inv.price;
        const currentValue = inv.shares * currentPrice;
        const returnPct = ((currentPrice - inv.price) / inv.price) * 100;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${investments.length - i}</td>
            <td>${new Date(inv.date).toLocaleDateString('zh-HK')}</td>
            <td><strong>${inv.symbol}</strong><br><small>${etf.name}</small></td>
            <td>$${formatNumber(inv.amountUSD)}</td>
            <td>$${formatNumber(inv.price)}</td>
            <td>${formatNumber(inv.shares, 4)}</td>
            <td>$${formatNumber(currentPrice)}</td>
            <td>$${formatNumber(currentValue)}</td>
            <td class="${returnPct >= 0 ? 'positive' : 'negative'}">${returnPct >= 0 ? '+' : ''}${formatPercent(returnPct)}</td>
        `;
        tbody.appendChild(row);
    }
    
    if (investments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">暫無投資記錄。請點擊「標記為已完成」記錄第一期投資。</td></tr>';
    }
}

// Update charts
function updateCharts(metrics) {
    // Portfolio value chart
    const portfolioCtx = document.getElementById('portfolioChart');
    if (portfolioCtx) {
        const chartData = generatePortfolioChartData();
        
        new Chart(portfolioCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '投資組合價值',
                    data: chartData.values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: '累計投入',
                    data: chartData.invested,
                    borderColor: '#64748b',
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Allocation pie chart
    const allocationCtx = document.getElementById('allocationChart');
    if (allocationCtx) {
        const labels = Object.keys(PORTFOLIO_CONFIG.etfs);
        const data = labels.map(symbol => PORTFOLIO_CONFIG.etfs[symbol].allocation * 100);
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

// Generate chart data
function generatePortfolioChartData() {
    const investments = portfolioData.investments;
    const labels = [];
    const values = [];
    const invested = [];
    
    if (investments.length === 0) {
        return { labels: ['開始'], values: [0], invested: [0] };
    }
    
    // Group by month
    const monthlyData = {};
    for (const inv of investments) {
        const date = new Date(inv.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[key]) {
            monthlyData[key] = { invested: 0, value: 0 };
        }
        monthlyData[key].invested += inv.amountUSD;
    }
    
    // Calculate cumulative
    let cumInvested = 0;
    let cumValue = 0;
    
    for (const [month, data] of Object.entries(monthlyData).sort()) {
        labels.push(month);
        cumInvested += data.invested;
        // Approximate value based on current prices
        cumValue = cumInvested * (1 + (calculateMetrics().totalReturn / 100));
        invested.push(cumInvested);
        values.push(cumValue);
    }
    
    return { labels, values, invested };
}

// Update next investment alert
function updateNextInvestmentAlert(metrics) {
    const startDate = new Date(PORTFOLIO_CONFIG.startDate);
    const now = new Date();
    
    // Calculate next investment date
    let nextDate = new Date(startDate);
    const periodsCompleted = Math.floor(metrics.currentPeriod);
    
    nextDate.setMonth(nextDate.getMonth() + periodsCompleted);
    
    // If next date is in the past, move to next month
    while (nextDate < now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
    
    const alertText = document.getElementById('nextInvestmentText');
    if (daysUntil <= 0) {
        alertText.innerHTML = `<strong>今天是投資日！</strong> 請記錄第 ${periodsCompleted + 1} 期投資。`;
    } else {
        alertText.innerHTML = `下次投資日期：<strong>${nextDate.toLocaleDateString('zh-HK')}</strong>（還有 ${daysUntil} 天）<br>第 ${periodsCompleted + 1} 期 / 共 120 期`;
    }
}

// Mark investment as done
function markInvestmentDone() {
    const modal = document.getElementById('investmentModal');
    const details = document.getElementById('investmentDetails');
    
    const monthlyUSD = PORTFOLIO_CONFIG.monthlyAmountHKD / PORTFOLIO_CONFIG.exchangeRate;
    
    let html = '<p>以下是本期各ETF的買入詳情：</p>';
    
    for (const [symbol, config] of Object.entries(PORTFOLIO_CONFIG.etfs)) {
        const amount = monthlyUSD * config.allocation;
        const price = portfolioData.currentPrices[symbol] || getMockPrice(symbol);
        const shares = amount / price;
        
        html += `
            <div class="investment-etf">
                <div>
                    <div class="etf-code">${symbol}</div>
                    <div style="font-size: 12px; color: #64748b;">${config.name}</div>
                </div>
                <div class="etf-details">
                    <div>投入: $${formatNumber(amount)}</div>
                    <div>價格: $${formatNumber(price)}</div>
                    <div>股數: ${formatNumber(shares, 4)}</div>
                </div>
            </div>
        `;
    }
    
    details.innerHTML = html;
    modal.classList.add('active');
}

// Confirm investment
function confirmInvestment() {
    const monthlyUSD = PORTFOLIO_CONFIG.monthlyAmountHKD / PORTFOLIO_CONFIG.exchangeRate;
    const date = new Date();
    
    // Create investment records for each ETF
    for (const [symbol, config] of Object.entries(PORTFOLIO_CONFIG.etfs)) {
        const amount = monthlyUSD * config.allocation;
        const price = portfolioData.currentPrices[symbol] || getMockPrice(symbol);
        const shares = amount / price;
        
        portfolioData.investments.push({
            symbol,
            date: date.toISOString(),
            amountUSD: amount,
            price,
            shares,
            period: Math.floor(portfolioData.investments.length / 5) + 1
        });
    }
    
    saveData();
    updateUI();
    closeInvestmentModal();
    
    // Show success message
    alert('✅ 本期投資已記錄！');
}

// Check rebalance
function checkRebalance() {
    const modal = document.getElementById('rebalanceModal');
    const analysis = document.getElementById('rebalanceAnalysis');
    
    const metrics = calculateMetrics();
    const targetReturn = PORTFOLIO_CONFIG.targetAnnualReturn;
    const actualReturn = metrics.annualReturn;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h3>回報率分析</h3>
            <table style="width: 100%; margin-top: 10px;">
                <tr>
                    <td>目標年化回報率</td>
                    <td style="text-align: right; font-weight: bold;">${targetReturn}%</td>
                </tr>
                <tr>
                    <td>實際年化回報率</td>
                    <td style="text-align: right; font-weight: bold; color: ${actualReturn >= targetReturn ? '#10b981' : '#ef4444'}">${formatPercent(actualReturn)}</td>
                </tr>
                <tr>
                    <td>差異</td>
                    <td style="text-align: right; font-weight: bold; color: ${actualReturn >= targetReturn ? '#10b981' : '#ef4444'}">${actualReturn >= targetReturn ? '+' : ''}${formatPercent(actualReturn - targetReturn)}</td>
                </tr>
            </table>
        </div>
    `;
    
    if (actualReturn < targetReturn - 2) {
        html += `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong>⚠️ 提醒</strong><br>
                實際回報率低於目標超過 2%，建議檢視是否需要調整配置。
            </div>
        `;
    } else if (actualReturn > targetReturn + 3) {
        html += `
            <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong>✅ 表現良好</strong><br>
                實際回報率超過目標 3% 以上，組合表現優於預期。
            </div>
        `;
    } else {
        html += `
            <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong>📊 正常範圍</strong><br>
                實際回報率在目標範圍內，建議繼續現有配置。
            </div>
        `;
    }
    
    html += `
        <div>
            <h3>各ETF表現</h3>
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0;">
                        <th style="text-align: left;">ETF</th>
                        <th style="text-align: right;">配置</th>
                        <th style="text-align: right;">回報率</th>
                        <th style="text-align: right;">建議</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const [symbol, etf] of Object.entries(metrics.etfMetrics)) {
        let suggestion = '保持';
        if (etf.return > 20) suggestion = '考慮減持';
        if (etf.return < 0) suggestion = '考慮增持';
        
        html += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td><strong>${symbol}</strong></td>
                <td style="text-align: right;">${(etf.allocation * 100).toFixed(0)}%</td>
                <td style="text-align: right; color: ${etf.return >= 0 ? '#10b981' : '#ef4444'}">${etf.return >= 0 ? '+' : ''}${formatPercent(etf.return)}</td>
                <td style="text-align: right;">${suggestion}</td>
            </tr>
        `;
    }
    
    html += '</tbody></table></div>';
    
    analysis.innerHTML = html;
    modal.classList.add('active');
}

// Close modals
function closeModal() {
    document.getElementById('rebalanceModal').classList.remove('active');
}

function closeInvestmentModal() {
    document.getElementById('investmentModal').classList.remove('active');
}

// Check alerts
function checkAlerts() {
    const startDate = new Date(PORTFOLIO_CONFIG.startDate);
    const now = new Date();
    const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    
    // Check for rebalance alert (every 6 months)
    if (monthsPassed > 0 && monthsPassed % 6 === 0) {
        document.getElementById('rebalanceAlert').style.display = 'flex';
    } else {
        document.getElementById('rebalanceAlert').style.display = 'none';
    }
}

// Update settings
function updateSettings() {
    saveSettings();
    updateUI();
}

// Update allocation sliders
function updateAllocationSliders() {
    const container = document.getElementById('allocationSliders');
    if (!container || container.children.length > 0) return;
    
    for (const [symbol, config] of Object.entries(PORTFOLIO_CONFIG.etfs)) {
        const div = document.createElement('div');
        div.className = 'slider-item';
        div.innerHTML = `
            <div class="slider-header">
                <span><strong>${symbol}</strong> - ${config.name}</span>
                <span id="${symbol}-value">${(config.allocation * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min="0" max="100" value="${(config.allocation * 100).toFixed(0)}" 
                   onchange="updateAllocation('${symbol}', this.value)">
        `;
        container.appendChild(div);
    }
}

// Update allocation
function updateAllocation(symbol, value) {
    const newAllocation = parseInt(value) / 100;
    PORTFOLIO_CONFIG.etfs[symbol].allocation = newAllocation;
    document.getElementById(`${symbol}-value`).textContent = `${value}%`;
    
    // Check total
    let total = 0;
    for (const config of Object.values(PORTFOLIO_CONFIG.etfs)) {
        total += config.allocation;
    }
    
    const totalEl = document.getElementById('allocationTotal');
    totalEl.textContent = `總計: ${(total * 100).toFixed(0)}%`;
    totalEl.className = 'allocation-total' + (Math.abs(total - 1) > 0.01 ? ' error' : '');
    
    saveSettings();
    updateUI();
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };
}

// Utility functions
function formatCurrency(value) {
    if (value === undefined || value === null) return '--';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value, decimals = 2) {
    if (value === undefined || value === null) return '--';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

function formatPercent(value) {
    if (value === undefined || value === null) return '--';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always'
    }).format(value) + '%';
}
