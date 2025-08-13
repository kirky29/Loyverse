module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    const clientId = process.env.LOYVERSE_CLIENT_ID;
    const clientSecret = process.env.LOYVERSE_CLIENT_SECRET;
    const redirectUri = `https://${req.headers.host}/api/oauth/callback`;
    
    if (!clientId || !clientSecret) {
      return res.status(500).send('Missing client credentials');
    }

    // Exchange code for token
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
      const errorText = await tokenResp.text();
      console.error('Token exchange failed:', tokenResp.status, errorText);
      throw new Error(`Token request failed: ${tokenResp.status}`);
    }

    const tokenData = await tokenResp.json();
    
    // Redirect back to main app with success and token
    const successUrl = `https://${req.headers.host}/?oauth_success=true&token=${encodeURIComponent(tokenData.access_token)}`;
    
    return res.redirect(successUrl);
    
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorUrl = `https://${req.headers.host}/?oauth_error=${encodeURIComponent(err.message)}`;
    return res.redirect(errorUrl);
  }
};
