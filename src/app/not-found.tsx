export default function NotFound() {
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        The page you are looking for does not exist.
      </p>
      <a 
        href="/" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '1rem'
        }}
      >
        Go Home
      </a>
    </div>
  );
}
