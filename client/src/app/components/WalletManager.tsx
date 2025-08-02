/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Copy,
  CheckCircle,
  Settings,
  Power,
  RefreshCw
} from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import {
  useAccount,
  useBalance,
  useDisconnect,
  useChainId
} from 'wagmi';
import { Tooltip } from 'react-tooltip';

interface WalletInfo {
  id: string;
  name: string;
  address: string;
  chain: string;
  chainIcon: string;
  balance: {
    native: number;
    usdc: number;
  };
  isConnected: boolean;
  lastActivity?: string;
}

interface WalletManagerProps {
  onBack: () => void;
  isMobile: boolean;
}

const WalletManager: React.FC<WalletManagerProps> = ({ onBack, isMobile }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [connectedWallets, setConnectedWallets] = useState<WalletInfo[]>([]);

  const { open } = useAppKit();
  const { address, addresses, isConnected, connector } = useAccount();
  const chainId = useChainId();

  const usdcTokenAddress: Record<number, `0x${string}`> = {
    421614: '0xA6c47fF9c534c90136AE906F3BC642F0E8CDfeeF',
    11155111: '0xUSDC_ADDRESS_HERE'
  };

  console.log({address})

  // Create balance hooks for both possible wallet positions
  const wallet1NativeBalance = useBalance({ address: addresses?.[0] });
  const wallet1UsdcBalance = useBalance({ 
    address: addresses?.[0], 
    token: usdcTokenAddress[chainId]
  });
  const wallet2NativeBalance = useBalance({ address: addresses?.[1] });
  const wallet2UsdcBalance = useBalance({ 
    address: addresses?.[1], 
    token: usdcTokenAddress[chainId]
  });

  const { disconnect } = useDisconnect();

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 421614: return 'Arbitrum Sepolia';
      case 11155111: return 'Sepolia';
      default: return 'Unknown Network';
    }
  };

  const getChainIcon = (chainId: number) => {
    switch (chainId) {
      case 421614: return '🔴';
      case 11155111: return '💠';
      default: return '🌐';
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleConnect = () => open();

  const handleDisconnect = (walletAddress?: string) => {
    if (!walletAddress || connectedWallets.length <= 1) {
      disconnect();
    } else {
      setConnectedWallets(prev =>
        prev.filter(wallet => wallet.address !== walletAddress)
      );
      if (walletAddress === address) disconnect();
    }
  };

  const nativeTokenPrice = 3000; // dummy price
  const getTotalBalance = () =>
    connectedWallets.reduce(
      (sum, wallet) =>
        sum +
        wallet.balance.native * nativeTokenPrice +
        wallet.balance.usdc,
      0
    );

  useEffect(() => {
    if (isConnected && addresses) {
      const wallets = addresses.map((addr, index) => {
        const nativeBalance = index === 0 ? wallet1NativeBalance : wallet2NativeBalance;
        const usdcBalance = index === 0 ? wallet1UsdcBalance : wallet2UsdcBalance;
        return {
          id: addr,
          name: `${connector?.name || 'Wallet'} ${
            addresses.length > 1 ? index + 1 : ''
          }`,
          address: addr,
          chain: getChainName(chainId),
          chainIcon: getChainIcon(chainId),
          balance: {
            native: Number(nativeBalance.data?.formatted || 0),
            usdc: Number(usdcBalance.data?.formatted || 0)
          },
          isConnected: true,
          lastActivity: 'Now'
        };
      });
      setConnectedWallets(wallets);
    } else {
      setConnectedWallets([]);
    }
  }, [
    addresses,
    isConnected,
    chainId,
    connector,
    wallet1NativeBalance.data,
    wallet1UsdcBalance.data,
    wallet2NativeBalance.data,
    wallet2UsdcBalance.data
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-teal-100 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white shadow-md">
        <div className={`${isMobile ? 'px-4 py-6' : 'px-8 py-8'} max-w-7xl mx-auto`}>
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors duration-200 shadow"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Wallet Manager</h1>
              <p className="text-teal-100 mt-1 font-medium">Connect and manage your wallets</p>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-2">
            <p className="text-teal-100 text-base font-semibold mb-1">Total Balance</p>
            <p className="text-4xl font-extrabold text-white drop-shadow">${getTotalBalance().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className={`${isMobile ? 'px-4 py-6' : 'px-8 py-12'} max-w-7xl mx-auto`}> 
        <div className="flex justify-center mb-8">
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all text-base font-semibold"
            style={{ minWidth: 0 }}
          >
            <Plus className="w-5 h-5" />
            {connectedWallets.length === 0 ? 'Connect Wallet' : 'Connect Another Wallet'}
          </button>
        </div>

        {connectedWallets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {connectedWallets.map(wallet => (
              <div key={wallet.id} className="relative bg-white/60 backdrop-blur-lg border border-white/40 rounded-3xl p-7 pt-12 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                {/* Chain Icon */}
                <div className="absolute top-0 left-6 w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-white/60">
                  {wallet.chainIcon}
                </div>
                <div className="pl-20">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {wallet.name}
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-teal-100 text-teal-700 font-semibold">{wallet.chain}</span>
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base text-gray-500 font-mono tracking-tight">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                        <button
                          onClick={() => handleCopyAddress(wallet.address)}
                          className="text-teal-500 hover:text-teal-700 transition-colors duration-200"
                          aria-label="Copy address"
                          data-tooltip-id={`copy-${wallet.id}`}
                        >
                          {copiedAddress === wallet.address ? (
                            <CheckCircle className="w-5 h-5 animate-bounce" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                        <Tooltip id={`copy-${wallet.id}`} content={copiedAddress === wallet.address ? 'Copied!' : 'Copy address'} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-teal-600 font-bold text-lg">
                        <img src="/favicon.ico" alt="ETH" className="w-5 h-5 inline-block mr-1" />
                        {wallet.balance.native.toFixed(4)}
                      </span>
                      <span className="text-xs text-gray-500">ETH (${(wallet.balance.native * nativeTokenPrice).toFixed(2)})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <span className="bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-bold">USDC</span>
                      {wallet.balance.usdc.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">(${wallet.balance.usdc.toFixed(2)})</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                      Last activity: {wallet.lastActivity}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-teal-600 rounded-xl hover:bg-gray-100 transition-colors duration-200" aria-label="Refresh" data-tooltip-id={`refresh-${wallet.id}`}>
                        <RefreshCw className="w-4 h-4" />
                        <Tooltip id={`refresh-${wallet.id}`} content="Refresh" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-teal-600 rounded-xl hover:bg-gray-100 transition-colors duration-200" aria-label="Settings" data-tooltip-id={`settings-${wallet.id}`}>
                        <Settings className="w-4 h-4" />
                        <Tooltip id={`settings-${wallet.id}`} content="Settings" />
                      </button>
                      <button
                        onClick={() => handleDisconnect(wallet.address)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-100 transition-colors duration-200"
                        aria-label="Disconnect"
                        data-tooltip-id={`disconnect-${wallet.id}`}>
                        <Power className="w-4 h-4" />
                        <Tooltip id={`disconnect-${wallet.id}`} content="Disconnect" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManager;
