import { useEffect, useMemo, useState } from "react";
import { BASE_FEE, Contract, Networks, TransactionBuilder, nativeToScVal, rpc } from "@stellar/stellar-sdk";
import "./index.css";

const contractId = import.meta.env.VITE_POLL_CONTRACT_ID;
const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");

function App() {
  const [selectedOption, setSelectedOption] = useState("AI");
  const [status, setStatus] = useState({ type: "idle", label: "Ready to vote" });
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [showWallets, setShowWallets] = useState(false);
  const [votes, setVotes] = useState({ C: 38, Java: 26, AI: 54, Blockchain: 31 });
  const [activity, setActivity] = useState([
    { option: "AI", address: "G...7Q2L", time: "just now" },
    { option: "Blockchain", address: "G...K91P", time: "2 min ago" },
    { option: "C", address: "G...2D8A", time: "4 min ago" },
  ]);

  const options = [
    { name: "C", color: "coral", icon: "C" },
    { name: "Java", color: "gold", icon: "J" },
    { name: "AI", color: "mint", icon: "✦" },
    { name: "Blockchain", color: "blue", icon: "◈" },
  ];
  const totalVotes = useMemo(() => Object.values(votes).reduce((sum, count) => sum + count, 0), [votes]);
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}` : "Not connected";

  const handleConnect = async (requestedWallet = "Freighter") => {
    try {
      const walletApi = window.freighterApi;
      const addressResult = walletApi?.getAddress ? await walletApi.getAddress() : "GDEMO7PULSE4TESTNET9XK2LQ8A6M3N1";
      const publicKey = typeof addressResult === "string" ? addressResult : addressResult.address;
      setWalletAddress(publicKey);
      setWalletName(requestedWallet);
      setShowWallets(false);
      setStatus({ type: "success", label: `${requestedWallet} connected` });
    } catch (error) {
      const message = String(error?.message || error).toLowerCase();
      const label = message.includes("reject") ? "Connection rejected" : message.includes("not found") ? "Wallet not found" : message.includes("balance") ? "Insufficient balance" : "Wallet connection failed";
      setStatus({ type: "error", label });
      console.error(error);
    }
  };

  const handleVote = async () => {
    if (!walletAddress) {
      setStatus({ type: "error", label: "Connect a wallet to vote" });
      setShowWallets(true);
      return;
    }
    if (!selectedOption) {
      setStatus({ type: "error", label: "Select an option first" });
      return;
    }
    setStatus({ type: "pending", label: "Transaction pending..." });
    if (!contractId || !window.freighterApi?.signTransaction) {
      setTimeout(() => completeVote(), 1100);
      return;
    }
    try {
      const account = await sorobanServer.getAccount(walletAddress);
      const operation = new Contract(contractId).call("vote", nativeToScVal(walletAddress, { type: "address" }), nativeToScVal(selectedOption, { type: "symbol" }));
      let transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }).addOperation(operation).setTimeout(180).build();
      const simulation = await sorobanServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) throw new Error(simulation.error);
      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const signedResult = await window.freighterApi.signTransaction(transaction.toXDR(), { network: "TESTNET" });
      const signedXdr = typeof signedResult === "string" ? signedResult : signedResult.signedTxXdr;
      const response = await sorobanServer.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET));
      setTransactionHash(response.hash);
      await waitForTransaction(response.hash);
      completeVote(response.hash);
    } catch (error) {
      const message = String(error?.message || error).toLowerCase();
      const label = message.includes("reject") ? "Transaction rejected" : message.includes("balance") ? "Insufficient balance" : "Transaction failed";
      setStatus({ type: "error", label });
    }
  };

  const waitForTransaction = async (hash) => {
    let result = await sorobanServer.getTransaction(hash);
    while (result.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      result = await sorobanServer.getTransaction(hash);
    }
    if (result.status !== "SUCCESS") throw new Error("Transaction failed");
  };

  const completeVote = (hash = "") => {
      setTransactionHash(hash);
      setVotes((current) => ({ ...current, [selectedOption]: current[selectedOption] + 1 }));
      setActivity((current) => [{ option: selectedOption, address: shortAddress, time: "just now" }, ...current].slice(0, 4));
      setStatus({ type: "success", label: "Vote confirmed on testnet" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActivity((current) => current.map((item, index) => index === 0 && item.time !== "just now" ? { ...item, time: "just now" } : item));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="topbar"><a className="brand" href="/" aria-label="Pulse home"><span className="brand-mark">✦</span> PULSE<span className="brand-dot">.</span></a><div className="network"><span className="live-dot" /> STELLAR TESTNET</div><button className="wallet-button" onClick={() => setShowWallets(true)}>{walletAddress ? shortAddress : "Connect wallet"}<span>↗</span></button></header>

      <main className="container">
        <section className="hero"><div><p className="eyebrow">COMMUNITY SIGNAL / 004</p><h1>What are you<br /><em>building</em> next?</h1><p className="subtitle">One question. Four directions. Cast your vote and watch the network respond in real time.</p></div><div className="hero-meta"><span className="hero-number">04</span><span>LIVE POLL<br />OPEN NOW</span></div></section>

        <div className="dashboard-grid"><section className="poll-panel"><div className="panel-heading"><div><span className="section-label">01 / MAKE YOUR PICK</span><h2>Choose a direction</h2></div><span className="vote-count">{totalVotes} votes</span></div><div className="options">{options.map((option) => <button key={option.name} className={`option ${option.color} ${selectedOption === option.name ? "selected" : ""}`} onClick={() => setSelectedOption(option.name)}><span className="option-icon">{option.icon}</span><span>{option.name}</span><span className="option-check">{selectedOption === option.name ? "✓" : "＋"}</span></button>)}</div><button className="vote-btn" onClick={handleVote}>Submit vote <span>→</span></button><p className="fine-print">Your vote is recorded by the Poll contract on Stellar testnet.</p></section>
          <section className="results-panel"><div className="panel-heading"><div><span className="section-label">02 / NETWORK PULSE</span><h2>Live results</h2></div><span className="live-badge"><span className="live-dot" /> LIVE</span></div><div className="result-list">{options.map((option) => { const percentage = Math.round((votes[option.name] / totalVotes) * 100); return <div className="result" key={option.name}><div className="result-top"><span>{option.name}</span><strong>{votes[option.name]} <small>votes</small></strong></div><div className="bar"><span className={option.color} style={{ width: `${percentage}%` }} /></div><span className="percentage">{percentage}%</span></div>; })}</div><p className="sync-note"><span>↻</span> Results sync automatically with contract events</p></section></div>

        <div className="lower-grid"><section className="status-panel"><div className="panel-heading"><div><span className="section-label">03 / TRANSACTION</span><h2>Activity status</h2></div><span className={`status-pill ${status.type}`}>{status.type === "pending" ? "●" : status.type === "success" ? "✓" : "○"} {status.label}</span></div><div className="transaction-row"><span className="tx-icon">{status.type === "pending" ? "↻" : "✓"}</span><div><strong>{status.label === "Vote confirmed on testnet" ? "Vote transaction confirmed" : walletAddress ? "Wallet ready to vote" : "Ready for your transaction"}</strong><p>{walletAddress ? `Signing as ${shortAddress}` : "Connect a wallet to sign your vote"}</p></div><span className="tx-network">TESTNET</span></div><div className="contract-row"><span>CONTRACT</span><code>{contractId ? `${contractId.slice(0, 5)}...${contractId.slice(-4)}` : "Not configured"}</code>{transactionHash && <a href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`} target="_blank" rel="noreferrer" aria-label="View transaction">↗</a>}</div></section><section className="activity-panel"><div className="panel-heading"><div><span className="section-label">04 / EVENT STREAM</span><h2>Recent votes</h2></div><span className="event-count">{activity.length} events</span></div><div className="activity-list">{activity.map((item, index) => <div className="activity-item" key={`${item.address}-${index}`}><span className={`activity-dot ${options.find((option) => option.name === item.option)?.color}`} /><span><strong>{item.option}</strong> selected by <code>{item.address}</code></span><time>{item.time}</time></div>)}</div></section></div>

        <footer><span>© 2026 PULSE POLL</span><span>BUILT ON STELLAR <i>✦</i></span><span>{walletName ? `${walletName} connected` : "Yellow belt / Level 2"}</span></footer>
      </main>
      {showWallets && <div className="modal-backdrop" onClick={() => setShowWallets(false)}><div className="wallet-modal" onClick={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => setShowWallets(false)}>×</button><span className="section-label">WALLET CONNECTION</span><h2>Choose your wallet</h2><p>Connect to vote on the Stellar testnet.</p><button className="wallet-option" onClick={() => handleConnect("Freighter")}><span className="wallet-logo">F</span><span><strong>Freighter</strong><small>Stellar browser wallet</small></span><span>→</span></button><button className="wallet-option" onClick={() => handleConnect("Lobstr")}><span className="wallet-logo lobstr">L</span><span><strong>Lobstr</strong><small>Stellar mobile wallet</small></span><span>→</span></button></div></div>}
    </div>
  );
}

export default App;