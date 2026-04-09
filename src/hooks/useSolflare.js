import { useState, useEffect, useCallback } from 'react';
import Solflare from '@solflare-wallet/sdk';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const NETWORK = 'devnet';
const CONNECTION = new Connection(clusterApiUrl(NETWORK), 'confirmed');

let walletInstance = null;

function getWallet() {
  if (!walletInstance) {
    walletInstance = new Solflare({ network: NETWORK });
  }
  return walletInstance;
}

export function useSolflare() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const wallet = getWallet();

    wallet.on('connect', () => {
      setConnected(true);
      setPublicKey(wallet.publicKey);
      setConnecting(false);
      setError(null);
    });

    wallet.on('disconnect', () => {
      setConnected(false);
      setPublicKey(null);
      setBalance(null);
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Fetch balance when connected
  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const bal = await CONNECTION.getBalance(publicKey);
        if (!cancelled) setBalance(bal / 1e9); // lamports to SOL
      } catch (e) {
        console.error('Balance fetch error:', e);
      }
    };

    fetchBalance();
    const iv = setInterval(fetchBalance, 15000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [publicKey]);

  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);
      const wallet = getWallet();
      await wallet.connect();
    } catch (e) {
      setError(e.message || 'Failed to connect');
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const wallet = getWallet();
      await wallet.disconnect();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  }, []);

  const signTransaction = useCallback(async (transaction) => {
    const wallet = getWallet();
    if (!wallet.isConnected) throw new Error('Wallet not connected');
    return wallet.signTransaction(transaction);
  }, []);

  const signAndSendTransaction = useCallback(async (transaction, options) => {
    const wallet = getWallet();
    if (!wallet.isConnected) throw new Error('Wallet not connected');
    return wallet.signAndSendTransaction(transaction, options);
  }, []);

  const shortenedAddress = publicKey
    ? publicKey.toBase58().slice(0, 4) + '••••' + publicKey.toBase58().slice(-4)
    : '';

  return {
    connected,
    connecting,
    publicKey,
    balance,
    error,
    shortenedAddress,
    connect,
    disconnect,
    signTransaction,
    signAndSendTransaction,
    connection: CONNECTION,
  };
}
