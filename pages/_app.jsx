import Head from 'next/head';
import React, { useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import ipfs from 'ipfs';

import '../styles.css';
import GlobalStyles from '../components/GlobalStyles';
import nfcAbi from '../NFC.json';

const { NEXT_PUBLIC_NFC_ADDRESS } = process.env;

export const Context = React.createContext();

const initialState = {
  eth: {
    provider: null,
    signer: null,
    nfc: null,
  },
  ipfs: {
    node: null,
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ETH_PROVIDER': {
      const { provider } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          provider,
        },
      };
    }
    case 'SET_ETH_SIGNER': {
      const { signer } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          signer,
        },
      };
    }
    case 'SET_ETH_NFC': {
      const { nfc } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          nfc,
        },
      };
    }
    case 'SET_IPFS_NODE': {
      const { node } = action.payload;
      return {
        ...state,
        ipfs: {
          ...state.ipfs,
          node,
        },
      };
    }
    default: {
      return state;
    }
  }
};

const App = ({ Component, pageProps }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handleChainChanged = (chainId) => {
      window.location.reload();
    };
    window.ethereum.on('chainChanged', handleChainChanged);
    const getChain = async () => {
      // const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // handleChainChanged(chainId);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      dispatch({
        type: 'SET_ETH_PROVIDER',
        payload: {
          provider,
        },
      });
    };
    getChain();
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [dispatch]);

  useEffect(() => {
    if (state.eth.provider) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts?.length) {
          return;
        }
        const signer = state.eth.provider.getSigner(accounts[0]);
        dispatch({
          type: 'SET_ETH_SIGNER',
          payload: {
            signer,
          },
        });
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      const getAccounts = async () => {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        handleAccountsChanged(accounts);
      };
      getAccounts();
      return () => {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged,
        );
      };
    }
  }, [dispatch, state.eth.provider]);

  useEffect(() => {
    if (state.eth.provider) {
      const nfc = new ethers.Contract(
        NEXT_PUBLIC_NFC_ADDRESS,
        nfcAbi,
        state.eth.provider,
      );
      dispatch({
        type: 'SET_ETH_NFC',
        payload: {
          nfc,
        },
      });
    }
  }, [dispatch, state.eth.provider]);

  useEffect(() => {
    const createIpfsNode = async () => {
      const node = await ipfs.create();
      dispatch({
        type: 'SET_IPFS_NODE',
        payload: {
          node,
        },
      });
    };
    createIpfsNode();
  }, [dispatch]);

  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <GlobalStyles />
      <Context.Provider value={[state, dispatch]}>
        <Component {...pageProps} />
      </Context.Provider>
    </>
  );
};

export default App;
