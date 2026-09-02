# Pulse Poll

Pulse Poll is a live voting app for the Stellar testnet. It supports Freighter and Lobstr wallet selection, a Soroban `vote` contract call, transaction status tracking, explorer links, and live result/event updates.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

Set `VITE_POLL_CONTRACT_ID` in `.env` to the deployed Soroban poll contract. Without it, the app runs in demo mode so the UI can be previewed without a wallet extension.

## Contract interface

The configured contract must expose `vote(symbol option)`. The connected wallet signs the transaction, the app simulates and submits it through Soroban testnet RPC, then polls until confirmation. Rejected transactions, missing wallets, failed transactions, and insufficient balance errors are surfaced in the activity panel.

## Level 2 submission details

- Live demo: add the deployed Vercel or Netlify URL here
- Deployed contract: add the contract ID here
- Contract call transaction: add the Stellar Expert testnet transaction URL here
- Repository: this public GitHub repository

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
