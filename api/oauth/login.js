export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.LOYVERSE_CLIENT_ID;
  const redirectUri = `https://${req.headers.host}/api/oauth/callback`;
  const scope = 'receipts.read stores.read';

  if (!clientId) {
    return res.status(500).send('Missing LOYVERSE_CLIENT_ID env var');
  }

  const authorizeUrl = new URL('https://developer.loyverse.com/oauth/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope);

  return res.redirect(authorizeUrl.toString());
}
