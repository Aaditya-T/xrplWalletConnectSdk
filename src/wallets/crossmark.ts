import { WalletAdapter, SignInResult, SignAndSubmitResult, SignResult, WalletType } from '../types';
import sdk from '@crossmarkio/sdk';

export class CrossmarkAdapter implements WalletAdapter {
  private address: string | null = null;
  private signedIn: boolean = false;

  private async ensureInstalled(): Promise<void> {
    const crossmarkSDK = sdk as any;
    if (crossmarkSDK?.sync?.isInstalled && !crossmarkSDK.sync.isInstalled()) {
      throw new Error('Crossmark Wallet extension is not installed or not active.');
    } else if (typeof crossmarkSDK?.isInstalled === 'function' && !crossmarkSDK.isInstalled()) {
      throw new Error('Crossmark Wallet extension is not installed or not active.');
    }
  }

  async signIn(): Promise<SignInResult> {
    await this.ensureInstalled();
    
    const { response } = await sdk.methods.signInAndWait();

    if (response?.data?.address) {
      this.address = response.data.address;
      this.signedIn = true;
      return {
        wallet: WalletType.Crossmark,
        address: this.address,
      };
    } else {
      throw new Error('Crossmark sign-in failed: No address received.');
    }
  }

  async signAndSubmit(payload: any): Promise<SignAndSubmitResult> {
    if (!this.signedIn || !this.address) {
      throw new Error('Crossmark: Not signed in. Please sign in first.');
    }

    const transactionPayload = {
      ...payload,
      Account: this.address,
    };

    const { response } = await sdk.methods.signAndSubmitAndWait(transactionPayload);

    const txResult = response?.data?.resp as any;
    const hash = txResult?.result?.hash || txResult?.hash;

    if (hash) {
      return {
        hash: hash,
        result: txResult || response?.data,
      };
    } else {
      throw new Error('Crossmark transaction submission failed or hash not found in response. Response: ' + JSON.stringify(response));
    }
  }

  async sign(payload: any): Promise<SignResult> {
    if (!this.signedIn || !this.address) {
      throw new Error('Crossmark: Not signed in. Please sign in first.');
    }

    const transactionPayload = {
      ...payload,
      Account: this.address,
    };
    
    const { response } = await sdk.methods.signAndWait(transactionPayload);

    if (response?.data?.txBlob) {
        return {
            signedTx: response.data.txBlob,
            txJson: transactionPayload, 
        };
    } else {
        throw new Error('Crossmark sign failed: Signed transaction data (txBlob) not found in response. Response: ' + JSON.stringify(response));
    }
  }

  async logout(): Promise<void> {
    this.address = null;
    this.signedIn = false;
  }
}
