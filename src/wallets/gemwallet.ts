import { WalletAdapter, SignInResult, SignAndSubmitResult, SignResult, WalletType } from '../types';
import { isInstalled, getAddress, signTransaction, submitTransaction } from '@gemwallet/api';

export class GemWalletAdapter implements WalletAdapter {
  private address: string | null = null;

  async signIn(): Promise<SignInResult> {
    const installed = await isInstalled();
    if (!installed?.result?.isInstalled) {
      throw new Error('Gem Wallet extension is not installed');
    }
    const addressRes = await getAddress();
    if (!addressRes?.result?.address) {
      throw new Error('Unable to get address from Gem Wallet');
    }
    this.address = addressRes.result.address;
    return {
      wallet: WalletType.GemWallet,
      address: this.address,
    };
  }

  async signAndSubmit(payload: any): Promise<SignAndSubmitResult> {
    if (!this.address) {
      throw new Error('Not signed in');
    }
    const response = await submitTransaction({ transaction: payload });
    if (!response?.result?.hash) {
      throw new Error('Transaction failed or was rejected');
    }
    return {
      hash: response.result.hash,
      result: response.result,
    };
  }

  async sign(payload: any): Promise<SignResult> {
    if (!this.address) {
      throw new Error('Not signed in');
    }
    const response = await signTransaction({ transaction: payload });
    if (!response?.result?.signature) {
      throw new Error('Signing failed or was rejected');
    }
    return {
      signedTx: response.result.signature,
      txJson: payload,
    };
  }

  async logout(): Promise<void> {
    this.address = null;
  }
}
