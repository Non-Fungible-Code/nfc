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

const ProjectsPage = ({ projects }) => {
  return (
    <>
      <Head>
        <title>Projects</title>
      </Head>

      <Header />
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-16`]}>
        <div
          css={[
            tw`grid grid-cols-1 gap-2`,
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
                    <div>{`${project.numMints} of ${
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
  res = await nfc.numProjects();
  let n = 0;
  if (res.gt('1000')) {
    n = 1000;
  } else if (res.gt('0')) {
    n = res.toNumber();
  }
  res = await Promise.all(
    new Array(n).fill(null).map((_, idx) => nfc.project(idx)),
  );
  const projects = res;
  res = await Promise.all(res.map((_, idx) => nfc.tokenIdsByProjectId(idx)));
  const numMintss = res.map((r) => r.length);
  res = await Promise.all(res.map((r) => nfc.tokenURI(r[r.length - 1])));
  res = await Promise.all(res.map((r) => axios.get(r)));
  const previewUrls = res.map((r) => r.data.animation_url);

  return {
    props: {
      projects: projects
        .map((p, idx) => ({
          id: idx,
          name: p.name,
          description: p.description,
          pricePerTokenInWei: p.pricePerTokenInWei.toString(),
          maxNumEditions: p.maxNumEditions.toString(),
          numMints: numMintss[idx],
          previewUrl: previewUrls[idx],
        }))
        .reverse(),
    },
    revalidate: 1,
  };
}

export default ProjectsPage;
