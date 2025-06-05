import { WalletAdapter, SignInResult, SignAndSubmitResult, SignResult, WalletType } from '../types';

export class XamanAdapter implements WalletAdapter {
  private xumm: any;
  private account: string | null = null;
  private apiKey: string;
  private sdkPromise: Promise<void>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.sdkPromise = this.loadSdk();
  }

  private async loadSdk() {
    if (typeof window !== 'undefined') {
      const mod = await import('xumm');
      this.xumm = new mod.Xumm(this.apiKey);
    }
  }

  private async ensureSdkLoaded() {
    await this.sdkPromise;
    if (!this.xumm) throw new Error('Xumm SDK not loaded');
  }

  async signIn(): Promise<SignInResult> {
    await this.ensureSdkLoaded();
    await this.xumm.authorize();
    const account = await this.xumm.user.account;
    this.account = account;
    return {
      wallet: WalletType.Xaman,
      address: account,
    };
  }

  async signAndSubmit(payload: any): Promise<SignAndSubmitResult> {
    await this.ensureSdkLoaded();
    if (!this.account) {
      throw new Error('Not signed in');
    }
    if (!payload.Account) {
      payload.Account = this.account;
    }
    const result = await this.xumm.payload.createAndSubscribe(payload, (event: any) => {
      if (Object.keys(event.data).indexOf('signed') > -1) {
        return true;
      }
    });
    const signed = result?.resolved;
    if (!signed || !signed.signed) {
      throw new Error('User rejected or did not sign the transaction');
    }
    return {
      hash: signed.txid,
      result: signed,
    };
  }

  async sign(payload: any): Promise<SignResult> {
    await this.ensureSdkLoaded();
    if (!this.account) {
      throw new Error('Not signed in');
    }
    if (!payload.Account) {
      payload.Account = this.account;
    }
    const result = await this.xumm.payload.createAndSubscribe(payload, (event: any) => {
      if (Object.keys(event.data).indexOf('signed') > -1) {
        return true;
      }
    });
    const signed = result?.resolved;
    if (!signed || !signed.signed) {
      throw new Error('User rejected or did not sign the transaction');
    }
    return {
      signedTx: signed.signed_blob,
      txJson: signed.response,
    };
  }

  async logout(): Promise<void> {
    await this.ensureSdkLoaded();
    if (this.xumm) {
      await this.xumm.logout();
      this.account = null;
    }
  }
}
