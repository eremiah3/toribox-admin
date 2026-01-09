import React, { useState, useEffect } from "react";

const API_BASE = "https://toribox-api.onrender.com";

const Wallet = () => {
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [processingPaystack, setProcessingPaystack] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    amount: "",
    coins: "",
    currency: "NGN",
  });

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const email = localStorage.getItem("adminEmail");

      if (!token || !email) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/api/users/wallet/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch wallet");

      const data = await res.json();
      setWalletBalance(data.wallet?.balance || 0);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load wallet: " + err.message);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGeneratePaystackSession = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.amount || !formData.coins) {
      alert("All fields are required");
      return;
    }

    setProcessingPaystack(true);

    try {
      const token = localStorage.getItem("adminToken");
      const email = localStorage.getItem("adminEmail");

      const res = await fetch(`${API_BASE}/api/paystack/generate/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          full_name: formData.fullName,
          amount: parseFloat(formData.amount),
          coins: parseInt(formData.coins),
          currency: formData.currency,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to generate Paystack session");
      }

      const data = await res.json();

      if (data.session?.authorization_url) {
        window.open(data.session.authorization_url, "_blank");
        setShowPaystackModal(false);
        setFormData({ fullName: "", amount: "", coins: "", currency: "NGN" });
      } else {
        alert("No payment URL received from server");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to process payment: " + err.message);
    } finally {
      setProcessingPaystack(false);
    }
  };

  if (loading) {
    return (
      <div className="section fade-in">
        <h1>Loading wallet...</h1>
      </div>
    );
  }

  return (
    <div className="section fade-in">
      <h1
        style={{
          fontSize: "2.8rem",
          margin: "2rem 0",
          color: "var(--primary-color)",
          textAlign: "center",
        }}
      >
        Wallet Management
      </h1>

      <div
        className="card"
        style={{
          maxWidth: "600px",
          margin: "2rem auto",
          padding: "3rem 2rem",
          textAlign: "center",
          backgroundColor:
            "linear-gradient(135deg, var(--primary-color), #667eea)",
          backgroundImage:
            "linear-gradient(135deg, var(--primary-color), #667eea)",
          color: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", opacity: 0.9 }}>
          Wallet Balance
        </h2>
        <div
          style={{ fontSize: "3.5rem", fontWeight: "bold", margin: "1rem 0" }}
        >
          ₦{walletBalance?.toLocaleString() || "0"}
        </div>
        <p style={{ fontSize: "0.95rem", opacity: 0.85 }}>
          Available balance for transactions
        </p>
      </div>

      {/* Add Funds Button */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          className="btn"
          onClick={() => setShowPaystackModal(true)}
          style={{
            padding: "1rem 3rem",
            fontSize: "1.1rem",
            backgroundColor: "var(--primary-color)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          💳 Add Funds via Paystack
        </button>
      </div>

      {showPaystackModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaystackModal(false)}
        >
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowPaystackModal(false)}
            >
              ×
            </button>
            <h2>Add Funds to Wallet</h2>
            <form
              onSubmit={handleGeneratePaystackSession}
              style={{ marginTop: "1.5rem" }}
            >
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  disabled={processingPaystack}
                />
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  step="0.01"
                  min="0"
                  required
                  disabled={processingPaystack}
                />
              </div>

              <div className="form-group">
                <label>Coins to Receive *</label>
                <input
                  type="number"
                  name="coins"
                  value={formData.coins}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  min="1"
                  required
                  disabled={processingPaystack}
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  disabled={processingPaystack}
                >
                  <option value="NGN">NGN (Nigerian Naira)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn"
                disabled={processingPaystack}
                style={{
                  width: "100%",
                  padding: "1rem",
                  marginTop: "1rem",
                  backgroundColor: "var(--primary-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: processingPaystack ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {processingPaystack ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: "800px",
          margin: "3rem auto",
          padding: "2rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          borderLeft: "4px solid var(--primary-color)",
        }}
      >
        <h3>ℹ️ How to Add Funds</h3>
        <ol style={{ marginTop: "1rem", lineHeight: "1.8" }}>
          <li>Click the "Add Funds via Paystack" button above</li>
          <li>Enter your full name and desired amount</li>
          <li>Specify the number of coins you want to receive</li>
          <li>Choose your currency (NGN or USD)</li>
          <li>Click "Proceed to Payment" - you'll be redirected to Paystack</li>
          <li>Complete the payment securely</li>
          <li>Your wallet balance will be updated automatically</li>
        </ol>
      </div>
    </div>
  );
};

export default Wallet;
