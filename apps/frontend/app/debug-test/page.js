export default function DebugPage() {
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>DEBUG PAGE - WORKING!</h1>
      <p>If you can see this, Next.js routing is working.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
