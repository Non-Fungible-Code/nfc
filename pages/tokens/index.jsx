import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import tw, { css, styled } from 'twin.macro';
import { ethers } from 'ethers';
import axios from 'axios';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import nfcAbi from '../../NFC.json';

const TokensPage = ({ tokens }) => {
  return (
    <>
      <Head>
        <title>Tokens</title>
      </Head>

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
      <Footer />
    </>
  );
};

export async function getStaticProps() {
  const { NETWORK, ALCHEMY_API_KEY, NFC_ADDRESS } = process.env;
  const provider = new ethers.providers.AlchemyProvider(
    NETWORK,
    ALCHEMY_API_KEY,
  );
  const nfc = new ethers.Contract(NFC_ADDRESS, nfcAbi, provider);
  let res;
  res = await nfc.totalSupply();
  let n = 0;
  if (res.gt('1000')) {
    n = 1000;
  } else if (res.gt('0')) {
    n = res.toNumber();
  }
  res = await Promise.all(
    new Array(n).fill(null).map((_, idx) => nfc.tokenURI(idx)),
  );
  const tokenUrls = res;
  res = await Promise.all(tokenUrls.map((url) => axios.get(url)));
  const tokens = res.map((r) => r.data);
  res = await Promise.all(
    new Array(n).fill(null).map((_, idx) => nfc.ownerOf(idx)),
  );
  const owners = res;

  return {
    props: {
      tokens: tokens
        .map((t, idx) => ({
          id: idx,
          name: t.name,
          description: t.description,
          animationUrl: t.animation_url,
          owner: owners[idx],
        }))
        .reverse(),
    },
    revalidate: 1,
  };
}

export default TokensPage;
