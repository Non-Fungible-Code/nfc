import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Link from 'next/link';
import tw, { css } from 'twin.macro';
import { ethers } from 'ethers';
import axios from 'axios';
import useSWR from 'swr';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import { Context } from '../_app';
import nfcAbi from '../../NFC.json';

const fetchCuratedProjects = async (nfc, curatedProjectIds) => {
  const curatedProjects = await Promise.all(
    curatedProjectIds.map((id) => nfc.project(ethers.BigNumber.from(id))),
  );

  const projectTokenIdss = await Promise.all(
    curatedProjectIds.map((id) => nfc.tokenIdsByProjectId(id)),
  );

  const projectNumTokenss = projectTokenIdss.map((ids) => ids.length);

  const projectPreviewTokenUris = await Promise.all(
    projectTokenIdss.map((ids) => nfc.tokenURI(ids[0])),
  );
  const projectPreviewTokens = await Promise.all(
    projectPreviewTokenUris.map((uri) =>
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
  const projectPreviewUrls = projectPreviewTokens.map(
    (token) => token.animation_url,
  );

  const result = curatedProjects.map((project, idx) => ({
    id: curatedProjectIds[idx].toString(),
    name: project.name,
    description: project.description,
    pricePerTokenInWei: project.pricePerTokenInWei.toString(),
    maxNumEditions: project.maxNumEditions.toString(),
    numTokens: projectNumTokenss[idx],
    previewUrl: projectPreviewUrls[idx],
  }));
  result.reverse();
  return result;
};

const CuratedProjectsPage = ({ curatedProjects: initialCuratedProjects }) => {
  const [state] = useContext(Context);

  const fetcher = useCallback(
    () =>
      fetchCuratedProjects(
        state.eth.nfc,
        process.env.NEXT_PUBLIC_CURATED_PROJECT_IDS.split(','),
      ),
    [state?.eth?.nfc],
  );
  const { data: curatedProjects, err } = useSWR(
    state?.eth?.nfc ? '/projects/curated' : null,
    fetcher,
    {
      initialData: initialCuratedProjects,
      refreshInterval: 1000,
    },
  );

  // TODO: Handle errors
  if (err) {
    console.error(err);
  }

  return (
    <>
      <Head>
        <title>Curated Projects</title>
      </Head>

      <div css={[tw`flex flex-col`, tw`min-h-screen`]}>
        <Header />
        <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-12`, tw`sm:pt-16`]}>
          {!curatedProjects ? (
            <div>Loading...</div>
          ) : (
            <div
              css={[
                tw`grid grid-cols-1 gap-4`,
                tw`sm:(grid-cols-3 gap-4)`,
                tw`xl:(grid-cols-4 gap-8)`,
              ]}
            >
              {curatedProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
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
                        title="Project Preview"
                        src={project.previewUrl}
                        sandbox="allow-scripts"
                      />
                    </div>
                    <div css={[tw`p-6`]}>
                      <h3 css={[tw`text-2xl font-bold`]}>{project.name}</h3>
                      <div
                        css={[
                          tw`flex justify-between items-center`,
                          tw`mt-8`,
                          tw`text-gray-500`,
                        ]}
                      >
                        <div>
                          Ξ
                          {ethers.utils.formatEther(
                            ethers.BigNumber.from(project.pricePerTokenInWei),
                          )}
                        </div>
                        <div>{`${project.numTokens} of ${
                          project.maxNumEditions ===
                          '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                            ? '∞'
                            : project.maxNumEditions
                        }`}</div>
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

CuratedProjectsPage.propTypes = {
  curatedProjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      pricePerTokenInWei: PropTypes.string.isRequired,
      maxNumEditions: PropTypes.string.isRequired,
      numTokens: PropTypes.number.isRequired,
      previewUrl: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
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
  const curatedProjects = await fetchCuratedProjects(
    nfc,
    process.env.NEXT_PUBLIC_CURATED_PROJECT_IDS.split(','),
  );

  return {
    props: {
      curatedProjects,
    },
    revalidate: 10,
  };
}

export default CuratedProjectsPage;
