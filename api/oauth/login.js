export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { account } = req.query;
  const accountNum = Number(account || '1');
  
  if (![1, 2].includes(accountNum)) {
    return res.status(400).send('Invalid account. Use account=1 or account=2');
  }

  const clientId = process.env.LOYVERSE_CLIENT_ID;
  const redirectUri = process.env.LOYVERSE_REDIRECT_URI || `https://${req.headers.host}/api/oauth/callback`;
  const scope = process.env.LOYVERSE_SCOPE || 'receipts.read stores.read';

  if (!clientId) {
    return res.status(500).send('Missing LOYVERSE_CLIENT_ID env var');
  }

  const authorizeUrl = new URL('https://developer.loyverse.com/oauth/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope);
  authorizeUrl.searchParams.set('state', String(accountNum));

  return res.redirect(authorizeUrl.toString());
}
