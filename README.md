Hey, I built this project to find new validated startup ideas from TrustMRR and Product Hunt.

## How it works
It fetches startups from TrustMRR and product launches from Product Hunt. It lets you search and filter them on a web dashboard or directly in your terminal.

## Setup

1. Copy `.env.example` to `.env` and add your API keys:
   - `API_KEY`: Your TrustMRR API key
   - `PH_API_KEY`: Your Product Hunt API key
   - `PH_API_SECRET`: Your Product Hunt API secret

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the web dashboard:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser.

4. Run the terminal explorer:
   ```bash
   node trustmrr-cli.js
   ```

## License
MIT
