# Loyverse Dashboard

A web application to display takings from multiple Loyverse accounts on a single page, eliminating the need to log in and out of different accounts.

## Features

- **Multi-Account Support**: View data from up to 2 Loyverse accounts simultaneously
- **Real-time Data**: Fetch live sales data from Loyverse API
- **OAuth Integration**: Secure authentication using Loyverse OAuth flow
- **Manual Entry**: Fallback option for manual data entry
- **Responsive Design**: Works on desktop and mobile devices
- **Local Development**: Includes local proxy server to bypass CORS issues

## Architecture

- **Frontend**: HTML/CSS/JavaScript (can be hosted on GitHub Pages)
- **Backend**: Node.js Express proxy server (deploy to Render/Railway)
- **Authentication**: Loyverse OAuth 2.0 flow
- **API**: Loyverse v0.7 receipts endpoint

## Setup

### Prerequisites

1. **Loyverse Developer Account**: Create an app at [developer.loyverse.com](https://developer.loyverse.com/)
2. **Node.js**: Version 14 or higher
3. **Git**: For version control

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/kirky29/Loyverse.git
   cd Loyverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Loyverse app credentials
   ```

4. **Start the proxy server**
   ```bash
   node server.js
   ```

5. **Start the frontend server**
   ```bash
   python3 -m http.server 8000
   ```

6. **Open in browser**
   - Frontend: http://localhost:8000
   - Proxy: http://localhost:3001

### Environment Variables

Create a `.env` file with the following variables:

```env
LOYVERSE_CLIENT_ID=your_app_id
LOYVERSE_CLIENT_SECRET=your_app_secret
LOYVERSE_REDIRECT_URI=http://localhost:3001/oauth/callback
LOYVERSE_SCOPE=receipts.read stores.read
```

### Loyverse App Configuration

In your Loyverse developer portal:

1. **Redirect URLs**: Add `http://localhost:3001/oauth/callback` (for local dev)
2. **Scopes**: Ensure `receipts.read` and `stores.read` are enabled
3. **App Type**: Set to "Web Application"

## Deployment

### Frontend (GitHub Pages)

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to main branch

### Backend (Render/Railway)

1. **Render**:
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Add environment variables

2. **Railway**:
   - Connect your GitHub repo
   - Set start command: `node server.js`
   - Add environment variables

### Production Environment Variables

```env
LOYVERSE_CLIENT_ID=your_app_id
LOYVERSE_CLIENT_SECRET=your_app_secret
LOYVERSE_REDIRECT_URI=https://your-app.onrender.com/oauth/callback
LOYVERSE_SCOPE=receipts.read stores.read
```

## Usage

1. **OAuth Connection**: Click "Connect with Loyverse (OAuth)" for each account
2. **Manual Token**: Alternatively, paste access tokens manually
3. **Refresh Data**: Click "Refresh Data" to fetch latest sales information
4. **View Summary**: See combined totals across all accounts

## API Endpoints

- `GET /health` - Health check
- `GET /oauth/login` - Start OAuth flow
- `GET /oauth/callback` - OAuth callback
- `POST /api/receipts-total` - Get receipts total for date range
- `GET /api/token-status` - Check token status

## Development

### Project Structure

```
Loyverse/
├── index.html          # Main dashboard
├── styles.css          # Styling
├── script.js           # Frontend logic
├── server.js           # Express proxy server
├── package.json        # Node dependencies
├── .env               # Environment variables (not in git)
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

### Adding Features

- **New API Endpoints**: Add routes in `server.js`
- **UI Components**: Extend `index.html` and `styles.css`
- **Frontend Logic**: Modify `script.js`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure proxy server is running
2. **OAuth Failures**: Check redirect URI matches exactly
3. **API Errors**: Verify access token permissions
4. **Missing Data**: Check date range parameters

### Debug Mode

Enable detailed logging by checking browser console and proxy server logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues related to:
- **Loyverse API**: Check [Loyverse API Documentation](https://loyverse.com/loyverse-pos-api)
- **This Application**: Open an issue on GitHub
- **OAuth Setup**: Refer to [Loyverse Developer Portal](https://developer.loyverse.com/docs/)
