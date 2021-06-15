import React, { useCallback, useContext } from 'react';
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

const fetchProjects = async (nfc) => {
  const numProjects = await nfc.numProjects();
  let numProjectsToShow = 0;
  let offset = ethers.BigNumber.from(0);
  if (numProjects.gt('1000')) {
    numProjectsToShow = 1000;
    offset = numProjects.sub('1000');
  } else if (numProjects.gt('0')) {
    numProjectsToShow = numProjects.toNumber();
  }
  const projectIds = new Array(numProjectsToShow)
    .fill(null)
    .map((_, idx) => offset.add(idx));

  const projects = await Promise.all(projectIds.map((id) => nfc.project(id)));

  const projectTokenIdss = await Promise.all(
    projectIds.map((id) => nfc.tokenIdsByProjectId(id)),
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

  const result = projects.map((p, idx) => ({
    id: projectIds[idx].toString(),
    name: p.name,
    description: p.description,
    pricePerTokenInWei: p.pricePerTokenInWei.toString(),
    maxNumEditions: p.maxNumEditions.toString(),
    numTokens: projectNumTokenss[idx],
    previewUrl: projectPreviewUrls[idx],
  }));
  result.reverse();
  return result;
};

const ProjectsPage = ({ projects: initialProjects }) => {
  const [state, dispatch] = useContext(Context);

  const fetcher = useCallback(
    () => fetchProjects(state.eth.nfc),
    [state?.eth?.nfc],
  );
  const { data: projects, err } = useSWR(
    state?.eth?.nfc ? '/projects' : null,
    fetcher,
    {
      initialData: initialProjects,
    },
  );

  // TODO: Handle errors
  if (err) {
    console.error(err);
  }

  return (
    <>
      <Head>
        <title>Projects</title>
      </Head>

      <Header />
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-12`, tw`sm:pt-16`]}>
        {!projects ? (
          <div>Loading...</div>
        ) : (
          <div
            css={[
              tw`grid grid-cols-1 gap-4`,
              tw`sm:(grid-cols-3 gap-4)`,
              tw`xl:(grid-cols-4 gap-8)`,
            ]}
          >
            {projects.map((project) => (
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
                    <iframe src={project.previewUrl} sandbox="allow-scripts" />
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
      <Footer />
    </>
  );
};

export async function getStaticProps() {
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
  const projects = await fetchProjects(nfc);

  return {
    props: {
      projects,
    },
    revalidate: 10,
  };
}

export default ProjectsPage;
