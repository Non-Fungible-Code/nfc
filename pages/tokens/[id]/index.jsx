import React, { useContext, useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Error from 'next/error';
import tw, { css, styled } from 'twin.macro';
import {
  Globe as GlobeIcon,
  Box as BoxIcon,
  Code as CodeIcon,
  ExternalLink as ExternalLinkIcon,
} from 'react-feather';
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
              Edition {token.serialNo} of
              <span css={[tw`block`, tw`text-5xl`]}>
                {token.project.maxNumEditions ===
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                  ? '∞'
                  : token.project.maxNumEditions}
              </span>
            </p>
            <div css={[tw`mb-8`]}>
              <a
                css={[
                  tw`flex justify-between items-center`,
                  tw`max-w-sm`,
                  tw`p-4`,
                  tw`rounded-xl`,
                  tw`shadow-lg`,
                  tw`cursor-pointer`,
                  ...liftWhenHoverMixin,
                ]}
                href={`https://${
                  process.env.NEXT_PUBLIC_NETWORK === 'homestead'
                    ? ''
                    : `${process.env.NEXT_PUBLIC_NETWORK}.`
                }etherscan.io/token/${process.env.NEXT_PUBLIC_NFC_ADDRESS}?a=${
                  token.id
                }`}
                target="_blank"
                rel="noreferrer"
              >
                <div css={[tw`flex items-center`]}>
                  <GlobeIcon css={[tw`mr-4`]} />
                  <span css={[tw`text-sm font-semibold`]}>
                    See on Etherscan
                  </span>
                </div>
                <div>
                  <ExternalLinkIcon css={[tw`text-gray-300`]} />
                </div>
              </a>
              <a
                css={[
                  tw`flex justify-between items-center`,
                  tw`max-w-sm`,
                  tw`p-4`,
                  tw`rounded-xl`,
                  tw`shadow-lg`,
                  tw`cursor-pointer`,
                  ...liftWhenHoverMixin,
                  tw`mt-4`,
                ]}
                href={token.animationUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div css={[tw`flex items-center`]}>
                  <BoxIcon css={[tw`mr-4`]} />
                  <span css={[tw`text-sm font-semibold`]}>See on IPFS</span>
                </div>
                <div>
                  <ExternalLinkIcon css={[tw`text-gray-300`]} />
                </div>
              </a>
              <a
                css={[
                  tw`flex justify-between items-center`,
                  tw`max-w-sm`,
                  tw`p-4`,
                  tw`rounded-xl`,
                  tw`shadow-lg`,
                  tw`cursor-pointer`,
                  ...liftWhenHoverMixin,
                  tw`mt-4`,
                ]}
                href={`${new URL(
                  `/ipfs/${token.uri.split('://')[1]}`,
                  `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <div css={[tw`flex items-center`]}>
                  <CodeIcon css={[tw`mr-4`]} />
                  <span css={[tw`text-sm font-semibold`]}>
                    See IPFS Metadata
                  </span>
                </div>
                <div>
                  <ExternalLinkIcon css={[tw`text-gray-300`]} />
                </div>
              </a>
            </div>
          </div>
          <div css={[tw`col-span-1`, tw`xl:col-span-2`]}>
            <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
              <div css={[tw`p-8`, tw`border-b border-gray-200`]}>
                <div css={[tw`flex flex-wrap`]}>
                  <div
                    css={[
                      tw`w-full`,
                      tw`pb-4`,
                      tw`mb-4`,
                      tw`sm:w-min`,
                      tw`sm:(pr-8 pb-0)`,
                      tw`sm:(mr-8 mb-0)`,
                      tw`sm:(border-r border-gray-200)`,
                    ]}
                  >
                    <div css={[tw`mb-2`, tw`font-semibold`, tw`sm:mb-4`]}>
                      Minted for
                    </div>
                    <div css={[tw`text-4xl font-bold`]}>
                      Ξ
                      {`${ethers.utils.formatEther(
                        ethers.BigNumber.from(token.project.pricePerTokenInWei),
                      )}`}
                    </div>
                  </div>
                  <div css={[tw`w-full`, tw`sm:w-min`]}>
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
              <div css={[tw`p-8`]}>
                <Link href={`/projects/${token.project.id}`}>
                  <button
                    css={[
                      tw`flex justify-center items-center`,
                      tw`w-full`,
                      tw`px-8 py-4`,
                      tw`bg-black`,
                      tw`text-white text-center font-bold`,
                      tw`rounded-xl`,
                      tw`cursor-pointer`,
                      tw`focus:outline-none`,
                      ...liftWhenHoverMixin,
                    ]}
                    type="button"
                  >
                    Mint
                  </button>
                </Link>
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
  const { ALCHEMY_API_KEY } = process.env;
  const provider = new ethers.providers.AlchemyProvider(
    process.env.NEXT_PUBLIC_NETWORK,
    ALCHEMY_API_KEY,
  );
  const nfc = new ethers.Contract(
    process.env.NEXT_PUBLIC_NFC_ADDRESS,
    nfcAbi,
    provider,
  );

  const numTokens = await nfc.totalSupply();
  let numTokensToBuildFirst = 0;
  let offset = ethers.BigNumber.from(0);
  if (numTokens.gt('1000')) {
    numTokensToBuildFirst = 1000;
    offset = numTokens.sub('1000');
  } else if (numTokens.gt('0')) {
    numTokensToBuildFirst = numTokens.toNumber();
  }
  const tokenIds = new Array(numTokensToBuildFirst)
    .fill(null)
    .map((_, idx) => offset.add(idx));
  return {
    paths: tokenIds.map((id) => ({ params: { id: id.toString() } })),
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { ALCHEMY_API_KEY } = process.env;

  try {
    const provider = new ethers.providers.AlchemyProvider(
      process.env.NEXT_PUBLIC_NETWORK,
      ALCHEMY_API_KEY,
    );
    const nfc = new ethers.Contract(
      process.env.NEXT_PUBLIC_NFC_ADDRESS,
      nfcAbi,
      provider,
    );

    const tokenId = params.id;

    const tokenUri = await nfc.tokenURI(ethers.BigNumber.from(tokenId));

    const token = await axios
      .get(
        `${new URL(
          `/ipfs/${tokenUri.split('://')[1]}`,
          `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
        )}`,
      )
      .then((r) => r.data);

    const tokenOwner = await nfc.ownerOf(tokenId);

    const tokenProjectId = await nfc.projectIdByTokenId(tokenId);
    const tokenProject = await nfc.project(tokenProjectId);

    const tokenProjectTokenIds = await nfc.tokenIdsByProjectId(tokenProjectId);
    const tokenSerialNo =
      1 + tokenProjectTokenIds.map((id) => id.toString()).indexOf(tokenId);

    return {
      props: {
        token: {
          id: tokenId,
          uri: tokenUri,
          animationUrl: token.animation_url,
          name: token.name,
          description: token.description,
          owner: tokenOwner,
          project: {
            id: tokenProjectId.toString(),
            maxNumEditions: tokenProject.maxNumEditions.toString(),
            pricePerTokenInWei: tokenProject.pricePerTokenInWei.toString(),
          },
          serialNo: tokenSerialNo,
        },
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error(err);
    return {
      notFound: true,
      revalidate: 10,
    };
  }
}

export default TokenPage;
