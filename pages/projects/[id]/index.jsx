import React, { useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import tw, { css } from 'twin.macro';
import {
  Loader as LoaderIcon,
  Image as ImageIcon,
  ExternalLink as ExternalLinkIcon,
} from 'react-feather';
import { ethers } from 'ethers';
import axios from 'axios';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { liftWhenHoverMixin } from '../../../utils/style';
import { Context } from '../../_app';
import nfcAbi from '../../../NFC.json';

const ProjectPage = ({ project }) => {
  const router = useRouter();

  const [state] = useContext(Context);

  const projectParameterByKey = useMemo(
    () =>
      (project?.parameters &&
        project.parameters.reduce(
          (prev, param) => ({ ...prev, [param.key]: param }),
          {},
        )) ??
      {},
    [project?.parameters],
  );
  const defaultTokenArgumentByParameterKey = useMemo(
    () =>
      Object.entries(projectParameterByKey).reduce(
        (prev, [paramKey, param]) => ({
          ...prev,
          [paramKey]: param.defaultValue,
        }),
        {},
      ),
    [projectParameterByKey],
  );
  const [tokenArgumentByParameterKey, setTokenArgumentByParameterKey] =
    useState(defaultTokenArgumentByParameterKey);
  const handleFormTokenArgumentInputChange = useCallback((e) => {
    setTokenArgumentByParameterKey((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const tokenPreviewUrl = useMemo(
    () =>
      project?.codeCid && state?.eth?.signerAddress
        ? `${new URL(
            `/?${new URLSearchParams({
              address: state.eth.signerAddress,
              ...Object.entries(tokenArgumentByParameterKey).reduce(
                (prev, [paramKey, arg]) => ({
                  ...prev,
                  [paramKey]: arg,
                }),
                {},
              ),
            })}`,
            `https://${project.codeCid}.ipfs.${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
          )}`
        : '',
    [project?.codeCid, state?.eth?.signerAddress, tokenArgumentByParameterKey],
  );

  const [isMinting, setIsMinting] = useState(false);
  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (e.target.reportValidity()) {
        const pin = async (blob, filename) => {
          const formData = new FormData();
          formData.append('file', blob, filename);
          const res = await axios.post(
            `${new URL('ipfs/pin', process.env.NEXT_PUBLIC_API_BASE_URL)}`,
            formData,
          );
          return res.data.cid;
        };
        try {
          setIsMinting(true);

          const token = {
            name: `${project.name}`,
            description: `${project.description}`,
            animation_url: tokenPreviewUrl,
            attributes: Object.entries(tokenArgumentByParameterKey).map(
              ([paramKey, arg]) => ({
                trait_type: projectParameterByKey[paramKey].name,
                value: arg,
              }),
            ),
          };
          const tokenCid = await pin(
            new Blob([JSON.stringify(token)], { type: 'application/json' }),
            'token.json',
          );

          const { emitter } = state.eth.notify.transaction({
            sendTransaction: async () => {
              const tx = await state.eth.nfc
                .connect(state.eth.signer)
                .mint(
                  state.eth.signerAddress,
                  ethers.BigNumber.from(project.id),
                  tokenCid,
                  {
                    value: ethers.BigNumber.from(project.pricePerTokenInWei),
                  },
                );
              return tx.hash;
            },
          });
          emitter.on('txConfirmed', () => {
            router.push('/tokens');
          });
        } catch (err) {
          console.error(err);
          state.eth.notify.notification({
            eventCode: 'tokenMintError',
            type: 'error',
            message: err.message,
          });
        } finally {
          setIsMinting(false);
        }
      }
    },
    [
      router,
      state?.eth?.nfc,
      state?.eth?.signer,
      state?.eth?.signerAddress,
      state?.eth?.notify,
      tokenPreviewUrl,
      project?.name,
      project?.description,
      tokenArgumentByParameterKey,
      projectParameterByKey,
      project?.id,
      project?.pricePerTokenInWei,
    ],
  );

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`Project | ${project.name}`}</title>
      </Head>

      <Header css={[tw`absolute left-1/2`, tw`transform -translate-x-1/2`]} />
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
          <iframe
            title="Token Preview"
            src={
              !state?.eth?.signerAddress
                ? '/misc/please-connect'
                : tokenPreviewUrl
            }
            sandbox="allow-scripts"
          />
        </div>
      </div>
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 py-8`]}>
        <div
          css={[tw`grid grid-cols-1`, tw`sm:grid-cols-2`, tw`xl:grid-cols-5`]}
        >
          <div css={[tw`col-span-1`, tw`xl:col-span-3`]}>
            <h2 css={[tw`mb-12`, tw`text-5xl font-bold`]}>{project.name}</h2>
            <p css={[tw`mb-8`, tw`whitespace-pre-wrap`, tw`sm:max-w-md`]}>
              {project.description}
            </p>
            <p css={[tw`mb-8`, tw`font-bold`]}>
              Edition {project.numTokens} of
              <span css={[tw`block`, tw`text-5xl`]}>
                {project.maxNumEditions ===
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                  ? '∞'
                  : project.maxNumEditions}
              </span>
            </p>
            <div css={[tw`mb-8`]}>
              <Link href="/tokens">
                <div
                  css={[
                    tw`flex justify-between items-center`,
                    tw`max-w-sm`,
                    tw`p-4`,
                    tw`rounded-xl`,
                    tw`shadow-lg`,
                    tw`cursor-pointer`,
                    ...liftWhenHoverMixin,
                  ]}
                >
                  <div css={[tw`flex items-center`]}>
                    <ImageIcon css={[tw`mr-4`]} />
                    <span css={[tw`text-sm font-semibold`]}>
                      Browse Gallery
                    </span>
                  </div>
                  <div>
                    <ExternalLinkIcon
                      css={[tw`invisible`, tw`text-gray-300`]}
                    />
                  </div>
                </div>
              </Link>
            </div>
          </div>
          <div css={[tw`col-span-1`, tw`xl:col-span-2`]}>
            <form onSubmit={handleFormSubmit}>
              <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`, tw`border-b border-gray-200`]}>
                  {Object.entries(projectParameterByKey).length > 0
                    ? Object.entries(projectParameterByKey).map(
                        ([paramKey, param]) => (
                          <div key={paramKey} css={[tw`not-first:mt-4`]}>
                            <label htmlFor={paramKey} css={[tw`block`]}>
                              {param.name}
                            </label>
                            <input
                              css={[
                                tw`block`,
                                tw`w-full`,
                                tw`mt-1`,
                                tw`p-2`,
                                tw`border border-gray-200`,
                                tw`rounded-xl`,
                                tw`focus:(outline-none ring-2 ring-gray-200)`,
                              ]}
                              id={paramKey}
                              type={(() => {
                                switch (param.type) {
                                  case 'STRING': {
                                    return 'text';
                                  }
                                  case 'NUMBER': {
                                    return 'number';
                                  }
                                  default: {
                                    return 'text';
                                  }
                                }
                              })()}
                              name={paramKey}
                              value={tokenArgumentByParameterKey[paramKey]}
                              onChange={handleFormTokenArgumentInputChange}
                              required
                              placeholder={param.defaultValue}
                            />
                          </div>
                        ),
                      )
                    : 'No parameters'}
                </div>
                <div css={[tw`p-8`]}>
                  <button
                    css={[
                      tw`flex justify-center items-center`,
                      tw`w-full`,
                      tw`px-8 py-4`,
                      !state?.eth?.signerAddress ||
                      project.isPaused ||
                      ethers.BigNumber.from(project.numTokens).gte(
                        project.maxNumEditions,
                      )
                        ? tw`bg-gray-300`
                        : tw`bg-black`,
                      tw`text-white text-center font-bold`,
                      tw`rounded-xl`,
                      !state?.eth?.signerAddress ||
                      project.isPaused ||
                      ethers.BigNumber.from(project.numTokens).gte(
                        project.maxNumEditions,
                      ) ||
                      isMinting
                        ? tw`cursor-not-allowed`
                        : tw`cursor-pointer`,
                      tw`focus:outline-none`,
                      ...(!state?.eth?.signerAddress ||
                      project.isPaused ||
                      ethers.BigNumber.from(project.numTokens).gte(
                        project.maxNumEditions,
                      ) ||
                      isMinting
                        ? []
                        : liftWhenHoverMixin),
                    ]}
                    type="submit"
                    disabled={
                      !state?.eth?.signerAddress ||
                      project.isPaused ||
                      ethers.BigNumber.from(project.numTokens).gte(
                        project.maxNumEditions,
                      ) ||
                      isMinting
                    }
                  >
                    {!state?.eth?.signerAddress ? (
                      'Please Connect First'
                    ) : project.isPaused ? (
                      'Paused'
                    ) : ethers.BigNumber.from(project.numTokens).gte(
                        project.maxNumEditions,
                      ) ? (
                      'Sold Out'
                    ) : isMinting ? (
                      <LoaderIcon tw="animate-spin" />
                    ) : (
                      `Mint for Ξ${ethers.utils.formatEther(
                        ethers.BigNumber.from(project.pricePerTokenInWei),
                      )}`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

ProjectPage.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    codeCid: PropTypes.string.isRequired,
    parameters: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['STRING', 'NUMBER']).isRequired,
        name: PropTypes.string.isRequired,
        defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
      }),
    ).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    pricePerTokenInWei: PropTypes.string.isRequired,
    maxNumEditions: PropTypes.string.isRequired,
    license: PropTypes.string.isRequired,
    isPaused: PropTypes.bool.isRequired,
    numTokens: PropTypes.number.isRequired,
  }).isRequired,
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

  const numProjects = await nfc.numProjects();
  let numProjectsToBuildFirst = 0;
  let offset = ethers.BigNumber.from(0);
  if (numProjects.gt('1000')) {
    numProjectsToBuildFirst = 1000;
    offset = numProjects.sub('1000');
  } else if (numProjects.gt('0')) {
    numProjectsToBuildFirst = numProjects.toNumber();
  }
  const projectIds = new Array(numProjectsToBuildFirst)
    .fill(null)
    .map((_, idx) => offset.add(idx));
  return {
    paths: projectIds.map((id) => ({ params: { id: id.toString() } })),
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

    const projectId = params.id;

    const project = await nfc.project(ethers.BigNumber.from(projectId));

    const projectParameters = await axios
      .get(
        `${new URL(
          `/ipfs/${project.parametersCid}`,
          `https://${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
        )}`,
      )
      .then((res) => res.data);
    const projectTokenIds = await nfc.tokenIdsByProjectId(projectId);
    const projectNumTokens = projectTokenIds.length;

    return {
      props: {
        project: {
          id: projectId,
          author: project.author,
          codeCid: project.codeCid,
          parameters: projectParameters,
          name: project.name,
          description: project.description,
          license: project.license,
          pricePerTokenInWei: project.pricePerTokenInWei.toString(),
          maxNumEditions: project.maxNumEditions.toString(),
          isPaused: project.isPaused,
          numTokens: projectNumTokens,
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

export default ProjectPage;
