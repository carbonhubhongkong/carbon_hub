function Error({ statusCode }) {
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        Please try refreshing the page or contact support if the problem persists.
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
