import { WalletAdapter, SignInResult, SignAndSubmitResult, SignResult, WalletType } from '../types';
import sdk from '@crossmarkio/sdk';

export class CrossmarkAdapter implements WalletAdapter {
  private address: string | null = null;
  private signedIn: boolean = false;

  private async ensureInstalled(): Promise<void> {
    // As per Crossmark docs 0.4.0-b.1, sdk.sync.isInstalled() is preferred
    // However, the base sdk object might be typed as 'any' or a generic type
    // if the full type definitions aren't perfectly picked up.
    // We'll try to access it dynamically.
    const crossmarkSDK = sdk as any;
    if (crossmarkSDK?.sync?.isInstalled && !crossmarkSDK.sync.isInstalled()) {
      throw new Error('Crossmark Wallet extension is not installed or not active.');
    } else if (typeof crossmarkSDK?.isInstalled === 'function' && !crossmarkSDK.isInstalled()) {
      // Fallback for older or differently structured SDK versions if sync.isInstalled isn't found
      throw new Error('Crossmark Wallet extension is not installed or not active.');
    }
    // If neither specific check works, we assume it might be installed and proceed,
    // letting subsequent calls fail if it's truly not there.
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
      Account: this.address, // Ensure Account is set to the signed-in address
    };

    const { response } = await sdk.methods.signAndSubmitAndWait(transactionPayload);

    // According to Crossmark docs and common structures, the hash should be in response.data.resp.result.hash
    // The linter error suggested response.data.resp is AllTransactionResponse.
    // We will try to access the hash robustly based on typical XRPL structures.
    const txResult = response?.data?.resp as any; // Cast to any to navigate potentially complex type
    const hash = txResult?.result?.hash || txResult?.hash; // Common patterns

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

    // Linter error indicated response.data has txBlob: string.
    if (response?.data?.txBlob) {
        return {
            signedTx: response.data.txBlob,
            // txJson is not directly provided, so we use the original payload. 
            // The blob (txBlob) contains all necessary signed info.
            txJson: transactionPayload, 
        };
    } else {
        throw new Error('Crossmark sign failed: Signed transaction data (txBlob) not found in response. Response: ' + JSON.stringify(response));
    }
  }

  async logout(): Promise<void> {
    // Crossmark SDK documentation does not specify a logout method.
    this.address = null;
    this.signedIn = false;
    // console.log('Crossmark logout called, user state reset locally. No explicit SDK logout method.');
  }
}
