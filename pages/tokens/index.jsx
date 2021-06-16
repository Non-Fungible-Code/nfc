import React, { useContext, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import tw, { css, styled } from 'twin.macro';
import { ethers } from 'ethers';
import axios from 'axios';
import useSWR from 'swr';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import { Context } from '../_app';
import nfcAbi from '../../NFC.json';

const fetchTokens = async (nfc) => {
  const numTokens = await nfc.totalSupply();
  let numTokensToShow = 0;
  let offset = ethers.BigNumber.from(0);
  if (numTokens.gt('1000')) {
    numTokensToShow = 1000;
    offset = numTokens.sub('1000');
  } else if (numTokens.gt('0')) {
    numTokensToShow = numTokens.toNumber();
  }
  const tokenIds = new Array(numTokensToShow)
    .fill(null)
    .map((_, idx) => offset.add(idx));

  const tokenUris = await Promise.all(tokenIds.map((id) => nfc.tokenURI(id)));

  const tokens = await Promise.all(
    tokenUris.map((uri) =>
      axios
        .get(
          `${new URL(
            `/ipfs/${uri.split('://')[1]}`,
            `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
          )}`,
        )
        .then((r) => r.data),
    ),
  );

  const tokenOwners = await Promise.all(tokenIds.map((id) => nfc.ownerOf(id)));

  const result = tokens.map((token, idx) => ({
    id: tokenIds[idx].toString(),
    name: token.name,
    description: token.description,
    animationUrl: token.animation_url,
    owner: tokenOwners[idx],
  }));
  result.reverse();
  return result;
};

const TokensPage = ({ tokens: initialTokens }) => {
  const [state, dispatch] = useContext(Context);

  const fetcher = useCallback(
    () => fetchTokens(state.eth.nfc),
    [state?.eth?.nfc],
  );
  const { data: tokens, err } = useSWR(
    state?.eth?.nfc ? '/tokens' : null,
    fetcher,
    {
      initialData: initialTokens,
    },
  );

  // TODO: Handle errors
  if (err) {
    console.error(err);
  }

  return (
    <>
      <Head>
        <title>Tokens</title>
      </Head>

      <div css={[tw`flex flex-col`, tw`min-h-screen`]}>
        <Header />
        <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-16`]}>
          <div
            css={[
              tw`grid grid-cols-1 gap-8`,
              tw`sm:(grid-cols-3)`,
              tw`xl:(grid-cols-4)`,
            ]}
          >
            {tokens.map((token) => (
              <Link key={token.id} href={`/tokens/${token.id}`}>
                <div
                  css={[
                    tw`rounded-xl`,
                    tw`shadow-lg`,
                    tw`overflow-hidden`,
                    tw`cursor-pointer`,
                    ...liftWhenHoverMixin,
                  ]}
                >
                  <div
                    css={[
                      tw`relative`,
                      css`
                        padding-top: 100%;
                        iframe {
                          ${tw`absolute left-0 top-0 w-full h-full`}
                        }
                      `,
                    ]}
                  >
                    <iframe src={token.animationUrl} sandbox="allow-scripts" />
                  </div>
                  <div css={[tw`p-6`]}>
                    <h3 css={[tw`text-2xl font-bold`]}>{token.name}</h3>
                    <div
                      css={[
                        tw`flex justify-between items-center`,
                        tw`mt-8`,
                        tw`text-gray-500`,
                      ]}
                    >
                      <div>
                        {`${token.owner.slice(0, 6)}...${token.owner.slice(
                          token.owner.length - 4,
                        )}`}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
        <Footer css={[tw`mt-auto`]} />
      </div>
    </>
  );
};

export async function getStaticProps() {
  const provider = new ethers.providers.AlchemyProvider(
    process.env.NEXT_PUBLIC_NETWORK,
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  );
  const nfc = new ethers.Contract(
    process.env.NEXT_PUBLIC_NFC_ADDRESS,
    nfcAbi,
    provider,
  );
  const tokens = await fetchTokens(nfc);

  return {
    props: {
      tokens,
    },
    revalidate: 10,
  };
}

export default TokensPage;
