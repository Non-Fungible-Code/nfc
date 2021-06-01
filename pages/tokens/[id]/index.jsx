import React, { useContext, useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Error from 'next/error';
import tw, { css, styled } from 'twin.macro';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import axios from 'axios';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { liftWhenHoverMixin } from '../../../utils/style';
import { Context } from '../../_app';
import nfcAbi from '../../../NFC.json';

const StyledHeader = styled(Header)(() => [
  tw`absolute! left-1/2`,
  tw`transform -translate-x-1/2`,
]);

const TokenPage = ({ token }) => {
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
  }, [state?.eth?.signer]);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`Token | ${token.name}`}</title>
      </Head>

      <StyledHeader />
      <div
        css={[
          tw`relative`,
          css`
            height: calc(100vh - 160px);
          `,
          tw`bg-gray-100`,
        ]}
      >
        <div
          css={[
            tw`absolute inset-x-4 top-32 bottom-8`,
            tw`bg-white`,
            tw`shadow-lg`,
            css`
              > iframe {
                ${tw`absolute left-0 top-0 w-full h-full`}
              }
            `,
            tw`sm:(inset-x-8 top-32 bottom-16)`,
          ]}
        >
          <iframe src={token.animationUrl} sandbox="allow-scripts" />
        </div>
      </div>
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 py-8`]}>
        <div
          css={[tw`grid grid-cols-1`, tw`sm:grid-cols-2`, tw`xl:grid-cols-5`]}
        >
          <div css={[tw`col-span-1`, tw`xl:col-span-3`]}>
            <h2 css={[tw`mb-12`, tw`text-5xl font-bold`]}>{token.name}</h2>
            <p css={[tw`mb-8`, tw`whitespace-pre-wrap`, tw`sm:max-w-sm`]}>
              {token.description}
            </p>
            <p css={[tw`mb-8`, tw`font-bold`]}>
              Edition {ethers.BigNumber.from(token.id).add(1).toString()} of
              <span css={[tw`block`, tw`text-5xl`]}>
                {token.project.maxNumEditions ===
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                  ? '∞'
                  : token.project.maxNumEditions}
              </span>
            </p>
          </div>
          <div css={[tw`col-span-1`, tw`xl:col-span-2`]}>
            <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
              <div css={[tw`p-8`]}>
                <div css={[tw`flex`]}>
                  <div css={[tw`pr-8`, tw`mr-8`, tw`border-r border-gray-200`]}>
                    <div css={[tw`mb-4`, tw`font-semibold`]}>Minted for</div>
                    <div css={[tw`text-4xl font-bold`]}>
                      Ξ
                      {`${ethers.utils.formatEther(
                        ethers.BigNumber.from(token.project.pricePerTokenInWei),
                      )}`}
                    </div>
                  </div>
                  <div>
                    <div css={[tw`mb-2`, tw`font-semibold`]}>Owned by</div>
                    <div
                      css={[tw`inline-block`, tw`rounded-full`, tw`shadow-lg`]}
                    >
                      <div css={[tw`p-4`, tw`text-sm`]}>
                        {`${token.owner.slice(0, 6)}...${token.owner.slice(
                          token.owner.length - 4,
                        )}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export async function getStaticPaths() {
  const { NODE_ENV, ALCHEMY_API_KEY, NFC_ADDRESS } = process.env;
  const provider = new ethers.providers.AlchemyProvider(
    NODE_ENV === 'development' ? 'rinkeby' : 'homestead',
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
  return {
    paths: new Array(n)
      .fill(null)
      .map((_, idx) => ({ params: { id: `${idx}` } })),
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { NODE_ENV, ALCHEMY_API_KEY, NFC_ADDRESS } = process.env;
  const provider = new ethers.providers.AlchemyProvider(
    NODE_ENV === 'development' ? 'rinkeby' : 'homestead',
    ALCHEMY_API_KEY,
  );
  const nfc = new ethers.Contract(NFC_ADDRESS, nfcAbi, provider);
  let res;
  const tokenId = params.id;
  res = await nfc.tokenURI(tokenId);
  const tokenUrl = res;
  res = await axios.get(tokenUrl);
  const token = res.data;
  res = await nfc.ownerOf(tokenId);
  const tokenOwner = res;
  res = await nfc.projectIdByTokenId(tokenId);
  const tokenProjectId = res;
  res = await nfc.project(tokenProjectId);
  const tokenProject = res;

  return {
    props: {
      token: {
        id: tokenId.toString(),
        animationUrl: token.animation_url,
        name: token.name,
        description: token.description,
        owner: tokenOwner,
        project: {
          id: tokenProjectId.toString(),
          maxNumEditions: tokenProject.maxNumEditions.toString(),
          pricePerTokenInWei: tokenProject.pricePerTokenInWei.toString(),
        },
      },
    },
    revalidate: 1,
  };
}

export default TokenPage;
