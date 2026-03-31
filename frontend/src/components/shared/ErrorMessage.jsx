import { V } from '../../constants/theme';

export default function ErrorMessage({ error, onRetry }) {
  return (
    <div style={{
      background: V.redLight,
      border: `1px solid rgba(229,62,62,0.25)`,
      borderRadius: V.cardRadius,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: V.red, marginBottom: 2 }}>
          Failed to load data
        </div>
        <div style={{ fontSize: 12, color: V.textMuted }}>
          {error}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: V.red,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
