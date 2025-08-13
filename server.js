'use strict';

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory token store per account (1 or 2)
const tokensByAccount = {
    1: null,
    2: null,
};

// Health check
app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

// Return token status for an account
app.get('/api/token-status', (req, res) => {
    const account = Number(req.query.account);
    if (![1, 2].includes(account)) {
        return res.status(400).json({ error: 'Invalid account. Use 1 or 2.' });
    }
    const token = tokensByAccount[account];
    if (!token) return res.json({ connected: false });
    return res.json({ connected: true, expires_at: token.expires_at || null });
});

// Start OAuth login
app.get('/oauth/login', (req, res) => {
    const account = Number(req.query.account || '1');
    if (![1, 2].includes(account)) {
        return res.status(400).send('Invalid account. Use account=1 or account=2');
    }
    const clientId = process.env.LOYVERSE_CLIENT_ID;
    const redirectUri = process.env.LOYVERSE_REDIRECT_URI || `http://localhost:${PORT}/oauth/callback`;
    if (!clientId) return res.status(500).send('Missing LOYVERSE_CLIENT_ID env var');

    const scope = (process.env.LOYVERSE_SCOPE || 'receipts.read stores.read').trim();
    const authorizeUrl = new URL('https://developer.loyverse.com/oauth/authorize');
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', scope);
    // Use state to carry which account we are connecting
    authorizeUrl.searchParams.set('state', String(account));
    return res.redirect(authorizeUrl.toString());
});

// OAuth callback: exchange code for token
app.get('/oauth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const account = Number(state || '1');
        if (!code) return res.status(400).send('Missing code');
        if (![1, 2].includes(account)) return res.status(400).send('Invalid account in state');

        const clientId = process.env.LOYVERSE_CLIENT_ID;
        const clientSecret = process.env.LOYVERSE_CLIENT_SECRET;
        const redirectUri = process.env.LOYVERSE_REDIRECT_URI || `http://localhost:${PORT}/oauth/callback`;
        if (!clientId || !clientSecret) return res.status(500).send('Missing client credentials');

        const tokenUrl = 'https://developer.loyverse.com/oauth/token';
        const body = qs.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        });
        const tokenResp = await axios.post(tokenUrl, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const token = tokenResp.data;
        // Compute expiry timestamp
        if (typeof token.expires_in === 'number') {
            token.expires_at = Date.now() + token.expires_in * 1000;
        }
        tokensByAccount[account] = token;

        // Simple success page
        return res.send(`
            <html>
                <body style="font-family: sans-serif;">
                    <h2>Connected to Loyverse (Account ${account})</h2>
                    <p>You can close this window and return to the app.</p>
                    <script>window.close && window.close();</script>
                </body>
            </html>
        `);
    } catch (err) {
        const status = err.response?.status || 500;
        const detail = err.response?.data || { message: err.message };
        return res.status(status).json({ error: 'OAuth exchange failed', detail });
    }
});

// Proxy endpoint to fetch receipts totals for a date range
app.post('/api/receipts-total', async (req, res) => {
	try {
        const { accessToken, created_date_min, created_date_max, created_at_min, created_at_max, limit } = req.body || {};
        // Allow using stored OAuth token by specifying account in query
        let tokenToUse = accessToken;
        const account = req.query.account ? Number(req.query.account) : undefined;
        if (!tokenToUse && account && [1, 2].includes(account)) {
            tokenToUse = tokensByAccount[account]?.access_token || null;
        }
        if (!tokenToUse) return res.status(400).json({ error: 'Missing access token (body.accessToken) and no stored OAuth token found for this account' });

		const params = new URLSearchParams();
		// Loyverse docs and community posts reference both created_at_* and created_date_*
		const minISO = created_at_min || created_date_min;
		const maxISO = created_at_max || created_date_max;
		if (minISO) {
			params.set('created_at_min', minISO);
			params.set('created_date_min', minISO);
		}
		if (maxISO) {
			params.set('created_at_max', maxISO);
			params.set('created_date_max', maxISO);
		}
		params.set('limit', String(limit || 1000));

		// Loyverse public API current base version uses v0.7
		const url = `https://api.loyverse.com/v0.7/receipts?${params.toString()}`;

        const response = await axios.get(url, {
			headers: {
                Authorization: `Bearer ${tokenToUse}`,
				Accept: 'application/json',
			},
		});

		const data = response.data || {};
		let totalTakings = 0;
		if (Array.isArray(data.receipts)) {
			for (const r of data.receipts) {
				// Loyverse amounts are often in minor units; use total_money_amount or total_money.amount
				if (typeof r.total_money_amount === 'number') {
					totalTakings += r.total_money_amount / 100;
				} else if (r.total_money && typeof r.total_money.amount === 'number') {
					totalTakings += r.total_money.amount / 100;
				}
			}
		}

		return res.json({ total: totalTakings, rawCount: (data.receipts || []).length });
	} catch (err) {
		const status = err.response?.status || 500;
		const detail = err.response?.data || { message: err.message };
		return res.status(status).json({ error: 'Upstream error', detail });
	}
});

app.listen(PORT, () => {
	console.log(`Proxy server listening on http://localhost:${PORT}`);
});
