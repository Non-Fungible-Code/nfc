import Head from 'next/head';
import React, { useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import ipfs from 'ipfs';
import BncOnboard from 'bnc-onboard';

import '../styles.css';
import GlobalStyles from '../components/GlobalStyles';
import nfcAbi from '../NFC.json';

const { NODE_ENV } = process.env;

const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK === 'homestead' ? 1 : 4;
const RPC_URL = `https://eth-${
  process.env.NEXT_PUBLIC_NETWORK === 'homestead' ? 'mainnet' : 'rinkeby'
}.alchemyapi.io/v2/7VW-n3NQm8Rucsb-68QkhS36mn2vFTce`;

export const Context = React.createContext();

const initialState = {
  eth: {
    onboard: null,
    wallet: null,
    provider: null,
    signer: null,
    signerAddress: '',
    nfc: null,
  },
  ipfs: {
    node: null,
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ETH_ONBOARD': {
      const { onboard } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          onboard,
        },
      };
    }
    case 'SET_ETH_WALLET': {
      const { wallet } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          wallet,
        },
      };
    }
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
    case 'SET_ETH_SIGNER_ADDRESS': {
      const { signerAddress } = action.payload;
      return {
        ...state,
        eth: {
          ...state.eth,
          signerAddress,
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
    const onboard = BncOnboard({
      dappId: process.env.NEXT_PUBLIC_BNC_API_KEY,
      hideBranding: true,
      networkId: NETWORK_ID,
      subscriptions: {
        address: (addr) => {
          dispatch({
            type: 'SET_ETH_SIGNER_ADDRESS',
            payload: {
              signerAddress: addr ?? '',
            },
          });
        },
        network: (networkId) => {
          console.log('networkId:', networkId);
          if (networkId !== NETWORK_ID) {
            // TODO:
            throw new Error('Wrong network');
          }
        },
        balance: () => {
          // TODO:
        },
        wallet: (wallet) => {
          if (wallet.provider) {
            dispatch({
              type: 'SET_ETH_WALLET',
              payload: {
                wallet,
              },
            });

            const provider = new ethers.providers.Web3Provider(wallet.provider);
            dispatch({
              type: 'SET_ETH_PROVIDER',
              payload: {
                provider,
              },
            });

            const signer = provider.getSigner();
            dispatch({
              type: 'SET_ETH_SIGNER',
              payload: {
                signer,
              },
            });
          } else {
            dispatch({
              type: 'SET_ETH_WALLET',
              payload: {
                wallet: null,
              },
            });
            dispatch({
              type: 'SET_ETH_PROVIDER',
              payload: {
                provider: null,
              },
            });
            dispatch({
              type: 'SET_ETH_SIGNER',
              payload: {
                signer: null,
              },
            });
          }
        },
      },
      walletSelect: {
        wallets: [
          { walletName: 'metamask', preferred: true },
          {
            walletName: 'walletConnect',
            rpc: {
              [NETWORK_ID]: RPC_URL,
            },
            preferred: true,
          },
          { walletName: 'coinbase', preferred: true },
          {
            walletName: 'ledger',
            rpcUrl: RPC_URL,
          },
        ],
      },
      walletCheck: [
        { checkName: 'derivationPath' },
        { checkName: 'accounts' },
        { checkName: 'connect' },
        { checkName: 'network' },
        { checkName: 'balance', minimumBalance: '0' },
      ],
    });
    dispatch({
      type: 'SET_ETH_ONBOARD',
      payload: {
        onboard,
      },
    });
  }, []);

  useEffect(() => {
    if (state.eth.provider) {
      const nfc = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFC_ADDRESS,
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
  }, [state?.eth?.provider]);

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
  }, []);

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
