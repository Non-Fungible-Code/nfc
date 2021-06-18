import React, { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import tw, { css } from 'twin.macro';
import { ethers } from 'ethers';
import axios from 'axios';
import useSWR from 'swr';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { liftWhenHoverMixin } from '../../../utils/style';
import { Context } from '../../_app';
import nfcAbi from '../../../NFC.json';

const fetchAccountTokens = async (nfc, accountAddress) => {
  const numTokens = await nfc.balanceOf(accountAddress);

  let numTokensToShow = 0;
  let offset = ethers.BigNumber.from(0);
  if (numTokens.gt('1000')) {
    numTokensToShow = 1000;
    offset = numTokens.sub('1000');
  } else if (numTokens.gt('0')) {
    numTokensToShow = numTokens.toNumber();
  }

  const tokenIdxs = new Array(numTokensToShow)
    .fill(null)
    .map((_, idx) => offset.add(idx));
  const tokenIds = await Promise.all(
    tokenIdxs.map((idx) => nfc.tokenOfOwnerByIndex(accountAddress, idx)),
  );

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

  const tokenProjectIds = await Promise.all(
    tokenIds.map((id) => nfc.projectIdByTokenId(id)),
  );
  const tokenProjectIdsSet = new Set(tokenProjectIds);

  const tokenProjectTokenIdss = await Promise.all(
    [...tokenProjectIdsSet].map(async (id) => {
      const tokenProjectTokenIds = await nfc.tokenIdsByProjectId(id);
      return {
        id,
        tokenIds: tokenProjectTokenIds,
      };
    }),
  );
  const tokenProjectTokenIdsByProjectId = tokenProjectTokenIdss.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.id]: curr.tokenIds,
    }),
    {},
  );
  const tokenSerialNos = tokenIds.map((id, idx) => {
    const tokenProjectId = tokenProjectIds[idx];
    return (
      1 +
      tokenProjectTokenIdsByProjectId[tokenProjectId]
        .map((i) => i.toString())
        .indexOf(id.toString())
    );
  });

  const result = tokens.map((token, idx) => ({
    id: tokenIds[idx].toString(),
    animationUrl: token.animation_url,
    name: token.name,
    description: token.description,
    serialNo: tokenSerialNos[idx],
  }));
  result.reverse();
  return result;
};

const AccountPage = ({ account }) => {
  const router = useRouter();

  const [state] = useContext(Context);

  const fetcher = useCallback(
    (key) => fetchAccountTokens(state.eth.nfc, key.split('/')[2]),
    [state?.eth?.nfc],
  );
  const { data: accountTokens = account?.tokens, err } = useSWR(
    state?.eth?.nfc && account?.address
      ? `/accounts/${account.address}/tokens`
      : null,
    fetcher,
    {
      ...(!!account?.tokens && { initialData: account.tokens }),
      refreshInterval: 1000,
    },
  );

  // TODO: Handle errors
  if (err) {
    console.error(err);
  }

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${account.address}'s Collection`}</title>
      </Head>

      <div css={[tw`flex flex-col`, tw`min-h-screen`]}>
        <Header />
        <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-16`]}>
          <h1 css={[tw`pb-8`, tw`text-5xl font-bold`, tw`break-all`]}>
            {`${account.address}'s`}
            <br />
            Collection
          </h1>
          {accountTokens.length === 0 ? (
            <>
              <p css={[tw`mt-16`]}>Seems like you have nothing here 🥲</p>
              <Link href="/projects/curated">
                <button
                  css={[
                    tw`px-6 py-4`,
                    tw`bg-black`,
                    tw`text-white font-bold`,
                    tw`rounded-full`,
                    tw`shadow-lg`,
                    tw`cursor-pointer`,
                    tw`focus:outline-none`,
                    ...liftWhenHoverMixin,
                    tw`inline-block`,
                    tw`mt-8`,
                  ]}
                  type="button"
                >
                  Start Browsing Now
                </button>
              </Link>
            </>
          ) : (
            <div
              css={[
                tw`grid grid-cols-1 gap-8`,
                tw`sm:(grid-cols-3)`,
                tw`xl:(grid-cols-4)`,
              ]}
            >
              {accountTokens.map((token) => (
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
                      <iframe
                        title="Token"
                        src={token.animationUrl}
                        sandbox="allow-scripts"
                      />
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
                        <div>{`#${token.serialNo}`}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
        <Footer css={[tw`mt-auto`]} />
      </div>
    </>
  );
};

AccountPage.propTypes = {
  account: PropTypes.shape({
    address: PropTypes.string.isRequired,
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        animationUrl: PropTypes.string.isRequired.animation_url,
        name: PropTypes.string.isRequired.name,
        description: PropTypes.string.isRequired.description,
        serialNo: PropTypes.number.isRequired,
      }).isRequired,
    ).isRequired,
  }),
};

export async function getStaticPaths() {
  const provider = new ethers.providers.AlchemyProvider(
    process.env.NEXT_PUBLIC_NETWORK,
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
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

  const ownerAddresses = await Promise.all(
    tokenIds.map((id) => nfc.ownerOf(id)),
  );
  const ownerAddressesSet = new Set(ownerAddresses);

  return {
    paths: [...ownerAddressesSet].map((address) => ({ params: { address } })),
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  try {
    const provider = new ethers.providers.AlchemyProvider(
      process.env.NEXT_PUBLIC_NETWORK,
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    );
    const nfc = new ethers.Contract(
      process.env.NEXT_PUBLIC_NFC_ADDRESS,
      nfcAbi,
      provider,
    );

    const accountAddress = params.address;

    const tokens = await fetchAccountTokens(nfc, accountAddress);

    return {
      props: {
        account: {
          address: accountAddress,
          tokens,
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

export default AccountPage;
