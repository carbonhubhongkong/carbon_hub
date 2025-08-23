'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}
