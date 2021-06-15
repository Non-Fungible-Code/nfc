import Head from 'next/head';
import { useRouter } from 'next/router';
import React, {
  useReducer,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import ReactDom from 'react-dom';
import tw, { css, styled } from 'twin.macro';
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
  ui: {
    isModalOpen: false,
    isMenuModalOpen: false,
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
    case 'SET_UI_IS_MENU_MODAL_OPEN': {
      return {
        ...state,
        ui: {
          ...state.ui,
          isMenuModalOpen: action.payload,
        },
      };
    }
    case 'TOGGLE_UI_IS_MENU_MODAL_OPEN': {
      return {
        ...state,
        ui: {
          ...state.ui,
          isMenuModalOpen: !state.ui.isMenuModalOpen,
        },
      };
    }
    default: {
      return state;
    }
  }
};

const MenuModal = ({ children }) => {
  const ref = useRef(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    ref.current = document.querySelector('#menu-modal');
    setIsMounted(true);
  }, []);

  return isMounted ? ReactDom.createPortal(children, ref.current) : null;
};

const App = ({ Component, pageProps }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const router = useRouter();

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

  const handleMenuItemClick = useCallback(
    (pathname) => () => {
      router.push(pathname);
      dispatch({
        type: 'SET_UI_IS_MENU_MODAL_OPEN',
        payload: false,
      });
    },
    [],
  );

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
        <div css={[state?.ui?.isMenuModalOpen && tw`h-screen overflow-hidden`]}>
          <Component {...pageProps} />
        </div>
        {state?.ui?.isMenuModalOpen && (
          <MenuModal>
            <div
              css={[tw`fixed`, tw`left-0 top-0 right-0 bottom-0`, tw`bg-black`]}
            >
              <div
                css={[
                  tw`w-full`,
                  css`
                    height: 88px;
                  `,
                ]}
              />
              <div
                css={[
                  tw`container`,
                  tw`mx-auto`,
                  tw`px-4 pt-12`,
                  tw`text-white text-5xl`,
                ]}
              >
                {[
                  { name: 'All', pathname: '/projects' },
                  { name: 'Curated', pathname: '/projects/curated' },
                  { name: 'Gallery', pathname: '/tokens' },
                  { name: 'Create', pathname: '/create' },
                ].map(({ name, pathname }) => (
                  <div
                    css={[tw`py-2`]}
                    key={pathname}
                    onClick={handleMenuItemClick(pathname)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </MenuModal>
        )}
      </Context.Provider>
    </>
  );
};

export default App;
