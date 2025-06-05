# XRPL Wallet Connect SDK

A unified, plug-and-play SDK for connecting to XRPL wallets (Gem Wallet, Crossmark, Xaman) in your web app.

## Features
- Unified API for Gem Wallet, Crossmark, and Xaman (Xumm)
- Developer selects wallet (no auto-detection)
- Xaman (Xumm) support via official PKCE flow (API key required)
- Accepts raw XRPL transaction payloads

## Installation

```bash
npm install xrpl-wallet-connect
```

## Usage

```ts
import { XRPLWalletConnect, WalletType } from 'xrpl-wallet-connect';

const walletConnect = new XRPLWalletConnect({
  xamanApiKey: 'YOUR_XAMAN_API_KEY', // Only needed for Xaman
});

// Developer selects wallet
walletConnect.selectWallet(WalletType.GemWallet);

// Sign in
const { address } = await walletConnect.signIn();

// Prepare a transaction
const tx = {
  TransactionType: 'Payment',
  Account: address,
  Destination: 'r...',
  Amount: '1000000',
};

// Sign and submit
const { hash } = await walletConnect.signAndSubmit(tx);
```

## Notes
- You **must** provide a Xaman public API key to use Xaman wallet.
- The SDK does **not** handle QR code UI for Xaman; the official PKCE flow handles it.
- You must explicitly select a wallet before using any methods.

## License
MIT 
