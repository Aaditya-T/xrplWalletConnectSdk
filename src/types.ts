// Core types and enums for the XRPL Wallet Connect SDK

export enum WalletType {
  GemWallet = 'gemwallet',
  Crossmark = 'crossmark',
  Xaman = 'xaman',
}

export interface XRPLWalletConnectConfig {
  xamanApiKey?: string;
}

export interface SignInResult {
  wallet: WalletType;
  address: string;
}

export interface SignAndSubmitResult {
  hash: string;
  result: any;
}

export interface SignResult {
  signedTx: string;
  txJson: any;
}

export interface WalletAdapter {
  signIn(): Promise<SignInResult>;
  signAndSubmit(payload: any): Promise<SignAndSubmitResult>;
  sign(payload: any): Promise<SignResult>;
  logout?(): Promise<void>;
}
