'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import { getProgram, getProvider, getFundraiserPDA, type Wallet } from '@/lib/anchor';
import toast from 'react-hot-toast';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateFundraiserForm({ onSuccess, onCancel }: Props) {
  const { publicKey, wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey || !wallet?.adapter || !formData.name.trim() || !formData.description.trim()) {
      toast.error('Please connect your wallet and fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const provider = await getProvider(wallet.adapter as unknown as Wallet);
      const program = getProgram(provider);
      
      const [fundraiserPDA] = getFundraiserPDA(publicKey);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (program as any).methods
        .create(formData.name.trim(), formData.description.trim())
        .accounts({
          fundraiser: fundraiserPDA,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success('Fundraiser created successfully!');
      setFormData({ name: '', description: '' });
      onSuccess();
    } catch (error) {
      console.error('Error creating fundraiser:', error);
      toast.error('Failed to create fundraiser. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-4">Create New Fundraiser</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Fundraiser Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="Enter fundraiser name"
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 h-24 resize-none"
              placeholder="Describe your fundraiser"
              maxLength={200}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.description.trim()}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Fundraiser'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

