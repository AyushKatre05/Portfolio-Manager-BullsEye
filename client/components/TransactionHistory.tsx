'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAppSelector } from '@/store/hooks';
import type { Transaction } from '@/types';

interface TransactionHistoryProps {
  limit?: number;
}

/**
 * Transaction History Component (Next.js)
 * Displays list of all buy/sell transactions
 */
export const TransactionHistory = memo(function TransactionHistory({
  limit,
}: TransactionHistoryProps) {
  const router = useRouter();
  const { transactions } = useAppSelector((state) => state.portfolio);
  const [showAll, setShowAll] = useState(false);

  const displayedTransactions =
    limit && !showAll ? transactions.slice(0, limit) : transactions;

  const hasMore = Boolean(limit && transactions.length > limit);

  if (transactions.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No transactions yet</p>
          <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Transaction History ({transactions.length})
        </h3>
      </div>

      <div className="space-y-3">
        {displayedTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onClick={() =>
              router.push(`/stocks/${transaction.symbol}`)
            }
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-4 py-2 text-[#58a6ff] hover:text-[#79c0ff] text-sm font-medium transition-colors"
        >
          Show All ({transactions.length - (limit ?? 0)} more)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
        >
          Show Less
        </button>
      )}
    </div>
  );
});

/**
 * Transaction Item
 */
interface TransactionItemProps {
  transaction: Transaction;
  onClick: () => void;
}

const TransactionItem = memo(function TransactionItem({
  transaction,
  onClick,
}: TransactionItemProps) {
  const isBuy = transaction.type === 'buy';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-[#0d1117] border border-[#30363d] rounded-lg hover:bg-[#21262d] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div
          className={`px-2 py-1 rounded text-xs font-semibold font-mono ${
            isBuy ? 'bg-[#238636]/20 text-[#238636]' : 'bg-[#f85149]/20 text-[#f85149]'
          }`}
        >
          {isBuy ? 'BUY' : 'SELL'}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white font-mono">
              {transaction.symbol}
            </span>
          </div>

          <p className="text-gray-500 text-sm font-mono">
            {transaction.shares} share{transaction.shares !== 1 ? 's' : ''} @ ${transaction.price.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`font-semibold font-mono ${
            isBuy ? 'text-[#f85149]' : 'text-[#238636]'
          }`}
        >
          {isBuy ? '-' : '+'}${transaction.total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-gray-500 text-xs">
          {formatTransactionDate(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
});

/**
 * Format transaction date
 */
function formatTransactionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
