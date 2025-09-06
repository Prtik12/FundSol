'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getProgram, getProvider, type Wallet } from '@/lib/anchor';
import { type FundraiserAccount } from '@/lib/idl';
import toast from 'react-hot-toast';

interface Props {
  publicKey: PublicKey;
  account: FundraiserAccount;
  onUpdate: () => void;
}

export default function FundraiserCard({ publicKey, account, onUpdate }: Props) {
  const { publicKey: walletPublicKey, wallet } = useWallet();
  const [donateAmount, setDonateAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = walletPublicKey?.equals(account.admin);
  const amountInSOL = account.amountDonated.toNumber() / LAMPORTS_PER_SOL;
  
  const handleDonate = async () => {
    if (!walletPublicKey || !wallet?.adapter || !donateAmount) {
      toast.error('Please enter a donation amount');
      return;
    }

    const amount = parseFloat(donateAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      const provider = await getProvider(wallet.adapter as unknown as Wallet);
      const program = getProgram(provider);
      
      const lamports = new BN(amount * LAMPORTS_PER_SOL);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (program as any).methods
        .donate(lamports)
        .accounts({
          fundraiser: publicKey,
          user: walletPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`Successfully donated ${amount} SOL!`);
      setDonateAmount('');
      onUpdate();
    } catch (error) {
      console.error('Error donating:', error);
      toast.error('Failed to donate');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletPublicKey || !wallet?.adapter || !isAdmin) {
      toast.error('Only the admin can withdraw funds');
      return;
    }

    if (account.amountDonated.toNumber() === 0) {
      toast.error('No funds to withdraw');
      return;
    }

    setLoading(true);
    
    try {
      const provider = await getProvider(wallet.adapter as unknown as Wallet);
      const program = getProgram(provider);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (program as any).methods
        .withdraw()
        .accounts({
          fundraiser: publicKey,
          admin: walletPublicKey,
        })
        .rpc();

      toast.success('Successfully withdrew funds!');
      onUpdate();
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2 truncate">
          {account.name}
        </h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-3">
          {account.description}
        </p>
        
        {/* Amount raised */}
        <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-lg p-3 border border-green-400/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Total Raised</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white mr-1">
                {amountInSOL.toFixed(4)}
              </span>
              <span className="text-sm text-gray-300">SOL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Donate section */}
        {walletPublicKey && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Amount in SOL"
                step="0.01"
                min="0.01"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-400 border border-white/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 text-sm"
              />
              <button
                onClick={handleDonate}
                disabled={loading || !donateAmount || parseFloat(donateAmount) <= 0}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ...
                  </div>
                ) : (
                  'Donate'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw button (only for admin) */}
        {isAdmin && (
          <button
            onClick={handleWithdraw}
            disabled={loading || account.amountDonated.toNumber() === 0}
            className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Withdrawing...
              </div>
            ) : account.amountDonated.toNumber() === 0 ? (
              'No Funds to Withdraw'
            ) : (
              `Withdraw ${amountInSOL.toFixed(4)} SOL`
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <p className="text-xs text-gray-400">
          Admin: {account.admin.toString().slice(0, 8)}...
          {isAdmin && (
            <span className="ml-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
              You
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
