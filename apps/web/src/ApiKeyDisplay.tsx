import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

function ApiKeyDisplay() {
  const auth = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchToken() {
      if (auth.loaded && auth.loggedIn) {
        const t = await auth.getToken();
        if (mounted) setToken(t ?? "");
      }
      setLoading(false);
    }
    fetchToken();
    return () => {
      mounted = false;
    };
  }, [auth]);

  if (!auth.loaded || loading) {
    return <div>Loading API key...</div>;
  }

  return (
    <div style={{
      maxWidth: 600,
      margin: "2rem auto",
      padding: "2rem",
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      textAlign: "center"
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Your API key</h2>
      {token ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: 600 }}>
          <input
            type="text"
            value={token}
            disabled
            readOnly
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "1.1rem",
              background: "#eee",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 4,
              padding: "0.75rem",
              overflowX: "auto"
            }}
          />
          <button
            onClick={async () => {
              if (token) {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 4,
              border: "1px solid #888",
              background: copied ? "#d4ffd4" : "#fafafa",
              cursor: "pointer"
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <div style={{ color: "#a00", marginTop: "1rem" }}>No API key available.</div>
      )}
    </div>
  );
}

export default ApiKeyDisplay; 