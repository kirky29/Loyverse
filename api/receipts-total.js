export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, created_date_min, created_date_max, created_at_min, created_at_max, limit } = req.body || {};
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken' });
    }

    const params = new URLSearchParams();
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

    const url = `https://api.loyverse.com/v0.7/receipts?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: 'Upstream error', 
        detail: errorData 
      });
    }

    const data = await response.json();
    let totalTakings = 0;
    
    if (Array.isArray(data.receipts)) {
      for (const r of data.receipts) {
        if (typeof r.total_money_amount === 'number') {
          totalTakings += r.total_money_amount / 100;
        } else if (r.total_money && typeof r.total_money.amount === 'number') {
          totalTakings += r.total_money.amount / 100;
        }
      }
    }

    return res.json({ 
      total: totalTakings, 
      rawCount: (data.receipts || []).length 
    });
    
  } catch (err) {
    console.error('Receipts total error:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      detail: err.message 
    });
  }
}
