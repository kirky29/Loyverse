export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state } = req.query;
    const account = Number(state || '1');
    
    if (!code) {
      return res.status(400).send('Missing code');
    }
    
    if (![1, 2].includes(account)) {
      return res.status(400).send('Invalid account in state');
    }

    const clientId = process.env.LOYVERSE_CLIENT_ID;
    const clientSecret = process.env.LOYVERSE_CLIENT_SECRET;
    const redirectUri = process.env.LOYVERSE_REDIRECT_URI || `https://${req.headers.host}/api/oauth/callback`;
    
    if (!clientId || !clientSecret) {
      return res.status(500).send('Missing client credentials');
    }

    const tokenUrl = 'https://developer.loyverse.com/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenResp.ok) {
      throw new Error(`Token request failed: ${tokenResp.status}`);
    }

    const token = await tokenResp.json();
    
    // Compute expiry timestamp
    if (typeof token.expires_in === 'number') {
      token.expires_at = Date.now() + token.expires_in * 1000;
    }

    // Store token in memory (in production, you'd use a database)
    // For now, we'll redirect back to the main app with success
    const successUrl = `https://${req.headers.host}/?oauth_success=true&account=${account}`;
    
    return res.redirect(successUrl);
    
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorUrl = `https://${req.headers.host}/?oauth_error=${encodeURIComponent(err.message)}`;
    return res.redirect(errorUrl);
  }
}
