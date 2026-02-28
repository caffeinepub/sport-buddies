import { useParams } from '@tanstack/react-router';

export default function SessionPage() {
  const { sessionId } = useParams({ strict: false });

  return (
    <main style={{ marginTop: '56px', marginBottom: '72px', padding: '16px' }}>
      <h2>Session</h2>
      <p>Session ID: {sessionId}</p>
    </main>
  );
}
