import React, { useContext, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import tw, { css, styled } from 'twin.macro';
import { Menu as MenuIcon } from 'react-feather';

import { Context } from '../../pages/_app';
import { liftWhenHoverMixin } from '../../utils/style';

const Button = styled.button(() => [
  tw`px-6 py-4`,
  tw`bg-black`,
  tw`text-white font-bold`,
  tw`rounded-full`,
  tw`shadow-lg`,
  tw`cursor-pointer`,
  tw`focus:outline-none`,
  ...liftWhenHoverMixin,
]);

const TabBar = styled.div(() => [
  tw`hidden`,
  tw`absolute left-1/2`,
  tw`transform -translate-x-1/2`,
  tw`p-2`,
  tw`bg-white`,
  tw`rounded-xl`,
  tw`shadow-lg`,
  tw`sm:flex`,
]);

const Tab = styled.div(({ isActive }) => [
  tw`px-6 py-2`,
  tw`mx-1`,
  tw`text-lg font-semibold`,
  tw`rounded-xl`,
  tw`cursor-pointer`,
  isActive && tw`bg-black text-white`,
  !isActive && tw`hover:bg-gray-200`,
]);

const tabs = [
  {
    name: 'Curated',
    pathname: '/projects/curated',
  },
  {
    name: 'All',
    pathname: '/projects',
  },
];

const Header = ({ className }) => {
  const router = useRouter();
  const [state, dispatch] = useContext(Context);

  const [signerAddress, setSignerAddress] = useState(null);
  useEffect(() => {
    const getSignerAddress = async () => {
      const addr = await state.eth.signer.getAddress();
      setSignerAddress(addr);
    };
    if (state.eth.signer) {
      getSignerAddress();
    }
  }, [state.eth.signer]);

  const handleConnectButtonClick = useCallback(async () => {
    if (state.eth.provider) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      const signer = state.eth.provider.getSigner(accounts[0]);
      dispatch({
        type: 'SET_ETHERSJS_SIGNER',
        payload: {
          signer,
        },
      });
    }
  }, [dispatch, state.eth.provider]);

  return (
    <header
      className={className}
      css={[
        tw`relative`,
        tw`flex justify-between items-center`,
        tw`container`,
        tw`mx-auto`,
        tw`px-4 pt-8`,
        tw`z-50`,
      ]}
    >
      <Link href="/">
        <div css={[tw`cursor-pointer`]}>NFC</div>
      </Link>
      {router.pathname !== '/create' && (
        <TabBar>
          {tabs.map((t) => (
            <Link key={t.name} href={t.pathname}>
              <Tab isActive={router.pathname === t.pathname}>{t.name}</Tab>
            </Link>
          ))}
        </TabBar>
      )}
      <div
        css={[
          tw`flex justify-end items-center`,
          css`
            > button {
              ${tw`ml-2`}
              ${tw`sm:ml-6`}
            }
          `,
        ]}
      >
        {signerAddress && router.pathname !== '/create' && (
          <Link href="/create">
            <Button
              css={[
                tw`hidden`,
                css`
                  background-color: #fbda61;
                  background-image: linear-gradient(
                    45deg,
                    #fbda61 0%,
                    #ff5acd 100%
                  );
                `,
                tw`sm:block`,
              ]}
            >
              Create
            </Button>
          </Link>
        )}
        {signerAddress ? (
          <Button
            css={[tw`p-1.5`, tw`bg-white`, tw`text-black`, tw`sm:(px-6 py-4)`]}
          >
            <div
              css={[
                css`
                  width: 44px;
                  height: 44px;
                `,
                tw`bg-gradient-to-br from-purple-400 to-purple-900`,
                tw`rounded-full`,
                tw`sm:hidden`,
              ]}
            />
            <span css={[tw`hidden`, tw`sm:inline`]}>
              {`${signerAddress.slice(0, 6)}...${signerAddress.slice(
                signerAddress.length - 4,
              )}`}
            </span>
          </Button>
        ) : (
          <Button onClick={handleConnectButtonClick}>Connect</Button>
        )}
        <Button css={[tw`p-1.5`, tw`bg-white`, tw`text-black`, tw`sm:hidden`]}>
          <div
            css={[
              tw`flex justify-center items-center`,
              css`
                width: 44px;
                height: 44px;
              `,
              tw`rounded-full`,
            ]}
          >
            <MenuIcon />
          </div>
        </Button>
      </div>
    </header>
  );
};

export default Header;
