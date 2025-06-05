import { WalletType, XRPLWalletConnectConfig, WalletAdapter, SignInResult, SignAndSubmitResult, SignResult } from './types';
import { GemWalletAdapter } from './wallets/gemwallet';
import { CrossmarkAdapter } from './wallets/crossmark';
import { XamanAdapter } from './wallets/xaman';


export class XRPLWalletConnect {
  private config: XRPLWalletConnectConfig;
  private selectedWallet: WalletType | null = null;
  private adapters: Partial<Record<WalletType, WalletAdapter>> = {};

  constructor(config: XRPLWalletConnectConfig) {
    this.config = config;
  }

  /**
   * Developer must explicitly select a wallet to use.
   * @param wallet - The wallet to use passed as a string, lowercased.
   * @example
   * ```ts
   * const walletConnect = new XRPLWalletConnect({ xamanApiKey: 'your-xaman-api-key' });
   * walletConnect.selectWallet('xaman');
   * // or
   * walletConnect.selectWallet('gemwallet');
   * // or
   * walletConnect.selectWallet('crossmark');
   * ```
   */
  selectWallet(wallet: string) {
    const walletType = wallet as WalletType;
    if (walletType === WalletType.Xaman && !this.config.xamanApiKey) {
      throw new Error('Xaman wallet requires a public API key.');
    }
    this.selectedWallet = walletType;
    if (!this.adapters[walletType]) {
      switch (walletType) {
        case WalletType.GemWallet:
          this.adapters[walletType] = new GemWalletAdapter();
          break;
        case WalletType.Crossmark:
          this.adapters[walletType] = new CrossmarkAdapter();
          break;
        case WalletType.Xaman:
          this.adapters[walletType] = new XamanAdapter(this.config.xamanApiKey!);
          break;
        default:
          throw new Error('Unsupported wallet type');
      }
    }
  }

  /**
   * Sign in with the selected wallet.
   */
  async signIn(): Promise<SignInResult> {
    this.ensureWalletSelected();
    const adapter = this.adapters[this.selectedWallet!];
    if (!adapter) throw new Error('Wallet adapter not implemented.');
    return adapter.signIn();
  }

  /**
   * Sign and submit a transaction with the selected wallet.
   */
  async signAndSubmit(payload: any): Promise<SignAndSubmitResult> {
    this.ensureWalletSelected();
    const adapter = this.adapters[this.selectedWallet!];
    if (!adapter) throw new Error('Wallet adapter not implemented.');
    return adapter.signAndSubmit(payload);
  }

  /**
   * Sign a transaction (without submitting) with the selected wallet.
   */
  async sign(payload: any): Promise<SignResult> {
    this.ensureWalletSelected();
    const adapter = this.adapters[this.selectedWallet!];
    if (!adapter) throw new Error('Wallet adapter not implemented.');
    return adapter.sign(payload);
  }

  /**
   * Optional: Logout from the selected wallet.
   */
  async logout() {
    this.ensureWalletSelected();
    const adapter = this.adapters[this.selectedWallet!];
    if (adapter && adapter.logout) {
      await adapter.logout();
    }
  }

  private ensureWalletSelected() {
    if (!this.selectedWallet) {
      throw new Error('No wallet selected. Please call selectWallet() first.');
    }
  }
}
