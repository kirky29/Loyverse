// Store account data
let accounts = {
    1: { name: '', apiKey: '', takings: { today: 0, week: 0, month: 0 } },
    2: { name: '', apiKey: '', takings: { today: 0, week: 0, month: 0 } }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateDisplay();
    setCurrentDate();
    updateProxyStatus();
});

function isLocalhost() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function getProxyBaseUrl() {
    // Local development hits local proxy
    if (isLocalhost()) return 'http://localhost:3001';
    // In production, use same-origin (no hardcoded domain)
    return '';
}

function buildApiUrl(path) {
    const base = getProxyBaseUrl();
    if (!base) return path; // same-origin in production
    return `${base}${path}`;
}

function updateProxyStatus() {
    const base = getProxyBaseUrl();
    const statusElement = document.getElementById('proxy-status');
    if (statusElement) {
        statusElement.textContent = `API: ${base || window.location.origin}`;
        statusElement.className = base ? 'proxy-status local' : 'proxy-status production';
    }
}

function connectOAuth(accountNumber) {
    const oauthPath = `/api/oauth/login?account=${accountNumber}`;
    window.open(buildApiUrl(oauthPath), '_blank');
}

// Set current date in manual entry form
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('manual-date').value = today;
}

// Load saved data from localStorage
function loadSavedData() {
    const saved = localStorage.getItem('loyverseAccounts');
    if (saved) {
        accounts = JSON.parse(saved);
        // Populate input fields
        document.getElementById('account1-name').value = accounts[1].name;
        document.getElementById('account1-api-key').value = accounts[1].apiKey;
        document.getElementById('account2-name').value = accounts[2].name;
        document.getElementById('account2-api-key').value = accounts[2].apiKey;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('loyverseAccounts', JSON.stringify(accounts));
}

// Update all displays
function updateDisplay() {
    // Update individual account displays
    document.getElementById('account1-today').textContent = formatCurrency(accounts[1].takings.today);
    document.getElementById('account1-week').textContent = formatCurrency(accounts[1].takings.week);
    document.getElementById('account1-month').textContent = formatCurrency(accounts[1].takings.month);
    
    document.getElementById('account2-today').textContent = formatCurrency(accounts[2].takings.today);
    document.getElementById('account2-week').textContent = formatCurrency(accounts[2].takings.week);
    document.getElementById('account2-month').textContent = formatCurrency(accounts[2].takings.month);
    
    // Update combined summary
    const totalToday = accounts[1].takings.today + accounts[2].takings.today;
    const totalWeek = accounts[1].takings.week + accounts[2].takings.week;
    const totalMonth = accounts[1].takings.month + accounts[2].takings.month;
    
    document.getElementById('total-today').textContent = formatCurrency(totalToday);
    document.getElementById('total-week').textContent = formatCurrency(totalWeek);
    document.getElementById('total-month').textContent = formatCurrency(totalMonth);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}

// Refresh account 1 data
async function refreshAccount1() {
    await refreshAccount(1);
}

// Refresh account 2 data
async function refreshAccount2() {
    await refreshAccount(2);
}

// Refresh account data using proxy (local) or same-origin (prod)
async function refreshAccount(accountNumber) {
    const account = accounts[accountNumber];
    
    // Save account name and API key
    account.name = document.getElementById(`account${accountNumber}-name`).value;
    account.apiKey = document.getElementById(`account${accountNumber}-api-key`).value;
    
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const nowISO = today.toISOString();
        const startOfDayISO = startOfDay.toISOString();
        const startOfWeekISO = startOfWeek.toISOString();
        const startOfMonthISO = startOfMonth.toISOString();

        const accountParam = `?account=${accountNumber}`; // used only locally (ignored by prod API)
        const headers = { 'Content-Type': 'application/json' };

        const bodyToday = { accessToken: account.apiKey, created_at_min: startOfDayISO, created_at_max: nowISO };
        const bodyWeek = { accessToken: account.apiKey, created_at_min: startOfWeekISO, created_at_max: nowISO };
        const bodyMonth = { accessToken: account.apiKey, created_at_min: startOfMonthISO, created_at_max: nowISO };

        const url = buildApiUrl(`/api/receipts-total${isLocalhost() ? accountParam : ''}`);

        const [todayRes, weekRes, monthRes] = await Promise.all([
            fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyToday) }),
            fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyWeek) }),
            fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyMonth) })
        ]);

        const [todayJson, weekJson, monthJson] = await Promise.all([todayRes.json(), weekRes.json(), monthRes.json()]);

        if (todayRes.ok && weekRes.ok && monthRes.ok) {
            account.takings.today = todayJson.total || 0;
            account.takings.week = weekJson.total || 0;
            account.takings.month = monthJson.total || 0;
        } else {
            const errMsg = todayJson.error || weekJson.error || monthJson.error || 'Unknown error';
            throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
        
        saveData();
        updateDisplay();
        
    } catch (error) {
        console.error(`Error refreshing account ${accountNumber}:`, error);
        alert(`Error refreshing account ${accountNumber}: ${error.message}`);
    }
}

// Add manual entry
function addManualEntry() {
    const accountNum = parseInt(document.getElementById('manual-account').value);
    const amount = parseFloat(document.getElementById('manual-amount').value);
    const date = document.getElementById('manual-date').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Add to appropriate period totals
    if (selectedDate.toDateString() === today.toDateString()) {
        accounts[accountNum].takings.today += amount;
    }
    
    if (selectedDate >= startOfWeek) {
        accounts[accountNum].takings.week += amount;
    }
    
    if (selectedDate >= startOfMonth) {
        accounts[accountNum].takings.month += amount;
    }
    
    // Clear form
    document.getElementById('manual-amount').value = '';
    
    // Save and update
    saveData();
    updateDisplay();
    
    alert(`Added £${amount.toFixed(2)} to account ${accountNum} for ${date}`);
}

// Loyverse API integration
async function fetchLoyverseData(apiKey) {
    try {
        // Get today's date and calculate date ranges
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Format dates for API (ISO format)
        const startOfDayISO = startOfDay.toISOString();
        const startOfWeekISO = startOfWeek.toISOString();
        const startOfMonthISO = startOfMonth.toISOString();
        const nowISO = today.toISOString();
        
        // Fetch sales data for different time periods
        const [todaySales, weekSales, monthSales] = await Promise.all([
            fetchSales(apiKey, startOfDayISO, nowISO),
            fetchSales(apiKey, startOfWeekISO, nowISO),
            fetchSales(apiKey, startOfMonthISO, nowISO)
        ]);
        
        return {
            takings: {
                today: todaySales,
                week: weekSales,
                month: monthSales
            }
        };
        
    } catch (error) {
        console.error('Error fetching Loyverse data:', error);
        throw error;
    }
}

// Fetch sales data from Loyverse API
async function fetchSales(apiKey, startDate, endDate) {
    // Try different possible Loyverse API endpoints
    const possibleEndpoints = [
        'https://api.loyverse.com/v1/receipts',
        'https://api.loyverse.com/v1/sales',
        'https://api.loyverse.com/v1/transactions'
    ];
    
    // CORS proxy to use if direct connection fails
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    
    for (const endpoint of possibleEndpoints) {
        try {
            console.log(`Trying endpoint: ${endpoint}`);
            
            // Build query parameters
            const params = new URLSearchParams({
                created_date_min: startDate,
                created_date_max: endDate,
                limit: '1000' // Get more results
            });
            
            // Try direct connection first
            let response;
            try {
                response = await fetch(`${endpoint}?${params}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
            } catch (directError) {
                console.log('Direct connection failed, trying CORS proxy...');
                // Use CORS proxy if direct connection fails
                response = await fetch(corsProxy + endpoint + '?' + params, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Origin': 'http://localhost:8000'
                    }
                });
            }
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, response.headers);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Please check your access token');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Access denied to this endpoint');
                } else if (response.status === 404) {
                    console.log(`Endpoint ${endpoint} not found, trying next...`);
                    continue; // Try next endpoint
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            const data = await response.json();
            console.log(`Response data:`, data);
            
            // Try to extract sales data from different possible response structures
            let totalTakings = 0;
            
            if (data.receipts && Array.isArray(data.receipts)) {
                // Receipts endpoint
                data.receipts.forEach(receipt => {
                    if (receipt.total_money_amount) {
                        totalTakings += parseFloat(receipt.total_money_amount) / 100;
                    }
                });
            } else if (data.sales && Array.isArray(data.sales)) {
                // Sales endpoint
                data.sales.forEach(sale => {
                    if (sale.amount) {
                        totalTakings += parseFloat(sale.amount) / 100;
                    }
                });
            } else if (data.transactions && Array.isArray(data.transactions)) {
                // Transactions endpoint
                data.transactions.forEach(transaction => {
                    if (transaction.amount) {
                        totalTakings += parseFloat(transaction.amount) / 100;
                    }
                });
            } else if (data.data && Array.isArray(data.data)) {
                // Generic data structure
                data.data.forEach(item => {
                    if (item.total_money_amount) {
                        totalTakings += parseFloat(item.total_money_amount) / 100;
                    } else if (item.amount) {
                        totalTakings += parseFloat(item.amount) / 100;
                    }
                });
            }
            
            console.log(`Total takings calculated: £${totalTakings.toFixed(2)}`);
            return totalTakings;
            
        } catch (error) {
            console.error(`Error with endpoint ${endpoint}:`, error);
            if (endpoint === possibleEndpoints[possibleEndpoints.length - 1]) {
                // This was the last endpoint, throw the error
                throw error;
            }
            // Continue to next endpoint
            continue;
        }
    }
    
    throw new Error('No working API endpoints found. Please check Loyverse API documentation.');
}

// Test API connection via proxy / same-origin
async function testConnection(accountNumber) {
    const apiKey = document.getElementById(`account${accountNumber}-api-key`).value;
    try {
        const url = buildApiUrl(`/api/receipts-total${isLocalhost() ? `?account=${accountNumber}` : ''}`);
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: apiKey, limit: 1 }) });
        const json = await res.json();
        if (res.ok) {
            alert(`✅ API reachable! Raw count: ${json.rawCount ?? 'n/a'}`);
        } else {
            alert(`❌ API error: ${JSON.stringify(json)}`);
        }
    } catch (err) {
        alert(`❌ API connection error: ${err.message}`);
    }
}

// Auto-save when input fields change
document.getElementById('account1-name').addEventListener('input', function() {
    accounts[1].name = this.value;
    saveData();
});

document.getElementById('account1-api-key').addEventListener('input', function() {
    accounts[1].apiKey = this.value;
    saveData();
});

document.getElementById('account2-name').addEventListener('input', function() {
    accounts[2].name = this.value;
    saveData();
});

document.getElementById('account2-api-key').addEventListener('input', function() {
    accounts[2].apiKey = this.value;
    saveData();
});
