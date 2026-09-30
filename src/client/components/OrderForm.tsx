import React, { useState } from 'react';
import { CheckCircle2, Clock, Send } from 'lucide-react';
import { RoleState } from '../types';

interface OrderFormProps {
  myState: RoleState;
  submittedThisRound: boolean;
  currentRound: number;
  onSubmitOrder: (amount: number) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  myState,
  submittedThisRound,
  currentRound,
  onSubmitOrder,
}) => {
  const [orderAmount, setOrderAmount] = useState<number>(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittedThisRound) return;
    if (orderAmount < 0 || !Number.isInteger(orderAmount)) return;
    onSubmitOrder(orderAmount);
  };

  const handlePreset = (amount: number) => {
    if (submittedThisRound) return;
    setOrderAmount(amount);
  };

  return (
    <div className="order-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Place Upstream Order</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Decide how many cases of beer to order from your supplier for Round {currentRound}.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Last order: <strong style={{ color: 'var(--text-primary)' }}>{myState.lastOrderPlaced}</strong>
        </div>
      </div>

      {submittedThisRound ? (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
            <CheckCircle2 size={20} />
            <span>Order Submitted for Round {currentRound}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Waiting for remaining players to submit their orders...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.25rem' }}>
              Quick Select:
            </span>
            {[0, 4, 8, 12, 16].map((num) => (
              <button
                key={num}
                type="button"
                className="btn-preset"
                style={{
                  borderColor: orderAmount === num ? 'var(--accent-amber)' : 'var(--border-color)',
                  background: orderAmount === num ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                }}
                onClick={() => handlePreset(num)}
              >
                {num}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={orderAmount}
                onChange={(e) => setOrderAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={submittedThisRound}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  padding: '0.65rem 1rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submittedThisRound || orderAmount < 0}
            >
              <Send size={18} />
              <span>Submit Order ({orderAmount})</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
