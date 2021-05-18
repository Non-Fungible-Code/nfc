import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Error from 'next/error';
import tw, { css, styled } from 'twin.macro';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import axios from 'axios';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import { Context } from '../_app';
import nfcAbi from '../../NFC.json';

const StyledHeader = styled(Header)(() => [
  tw`absolute! left-1/2`,
  tw`transform -translate-x-1/2`,
]);

const ProjectPage = ({ project }) => {
  const [state, dispatch] = useContext(Context);

  const iframeRef = useRef(null);
  const formRef = useRef(null);

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

  const [parameters, setParameters] = useState(
    project.parameters.map((p) => ({
      ...p,
      value: p.defaultValue,
    })),
  );
  const handleParameterFieldChange = useCallback(
    (e) => {
      setParameters((prev) => {
        const nextParameters = [...prev];
        const [id, name] = e.target.name.split('__');
        const idx = nextParameters.findIndex((p) => p.id === id);
        const nextParameter = {
          ...nextParameters[idx],
          [name]: e.target.value,
        };
        nextParameters.splice(idx, 1, nextParameter);
        return nextParameters;
      });
    },
    [setParameters],
  );

  const handleMintButtonClick = useCallback(async (e) => {
    e.preventDefault();
    if (formRef.current.reportValidity()) {
      // console.log(project);
      // let res;
      // res = await state.eth.nfc.tokenIdsByProjectId(
      //   ethers.BigNumber.from(project.id),
      // );
      // console.log(res);
      // const tokenSerial = res.length;
      // res = await axios.get(
      //   `${project.codegenUrl}?address=${encodeURIComponent(
      //     signerAddress,
      //   )}${parameters.reduce(
      //     (prev, { name: k, defaultValue: v }) =>
      //       `${prev}&${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
      //     '',
      //   )}`,
      // );
      // res = await state.ipfs.node.add(res.data);
      // const webCid = res.cid.toString();
      // res = await axios.post('/api/pin-cid', { cid: webCid });
      // console.log(res);
      // const token = {
      //   name: `${project.name} #${tokenSerial}`,
      //   description: `${project.description}`,
      //   animation_url: `https://${webCid}.ipfs.dweb.link/`,
      //   attributes: parameters.map((p) => ({
      //     trait_type: p.name,
      //     value: p.value,
      //   })),
      // };
      // console.log(token);
      // res = await state.ipfs.node.add(JSON.stringify(token));
      // const tokenCid = res.cid.toString();
      // res = await axios.post('/api/pin-cid', { cid: tokenCid });
      // console.log(res);
      // res = await state.eth.nfc
      //   .connect(state.eth.signer)
      //   .mint(signerAddress, project.id, tokenCid, {
      //     value: project.pricePerTokenInWei,
      //   });
      // console.log(res);
    }
  }, []);

  return (
    <>
      <Head>
        <title>{`Project | ${project.name}`}</title>
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
          <iframe
            ref={iframeRef}
            src={`${
              project.codegenUrl
            }/api/preview?address=${encodeURIComponent(
              signerAddress,
            )}${parameters.reduce(
              (prev, { name: k, value: v }) =>
                `${prev}&${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
              '',
            )}`}
          />
        </div>
      </div>
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 py-8`]}>
        <div
          css={[tw`grid grid-cols-1`, tw`sm:grid-cols-2`, tw`xl:grid-cols-5`]}
        >
          <div css={[tw`col-span-1`, tw`xl:col-span-3`]}>
            <h2 css={[tw`mb-12`, tw`text-5xl font-bold`]}>{project.name}</h2>
            <p css={[tw`mb-8`, tw`sm:max-w-sm`]}>{project.description}</p>
            <p css={[tw`mb-8`, tw`font-bold`]}>
              Edition {project.nextSerial} of
              <span css={[tw`block`, tw`text-5xl`]}>
                {project.maxNumEditions ===
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                  ? '∞'
                  : project.maxNumEditions}
              </span>
            </p>
          </div>
          <div css={[tw`col-span-1`, tw`xl:col-span-2`]}>
            <form ref={formRef}>
              <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`, tw`border-b border-gray-200`]}>
                  {parameters.map((p) => (
                    <div key={p.id} css={[tw`not-first:mt-4`]}>
                      <label htmlFor={`${p.id}__value`} css={[tw`block`]}>
                        {p.name}
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
                        id={`${p.id}__value`}
                        type={(() => {
                          switch (p.type) {
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
                        name={`${p.id}__value`}
                        value={p.value}
                        onChange={handleParameterFieldChange}
                        required
                        placeholder={p.defaultValue}
                      />
                    </div>
                  ))}
                </div>
                <div css={[tw`p-8`]}>
                  <button
                    css={[
                      tw`w-full`,
                      tw`px-8 py-4`,
                      tw`bg-black`,
                      tw`text-white text-center font-bold`,
                      tw`rounded-xl`,
                      tw`cursor-pointer`,
                      tw`focus:outline-none`,
                      ...liftWhenHoverMixin,
                    ]}
                    onClick={handleMintButtonClick}
                  >
                    Mint for Ξ
                    {ethers.utils.formatEther(
                      ethers.BigNumber.from(project.pricePerTokenInWei),
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

export async function getStaticPaths() {
  const { NODE_ENV, ALCHEMY_API_KEY, NFC_ADDRESS } = process.env;
  const provider = new ethers.providers.AlchemyProvider(
    NODE_ENV === 'development' ? 'rinkeby' : 'homestead',
    ALCHEMY_API_KEY,
  );
  const nfc = new ethers.Contract(NFC_ADDRESS, nfcAbi, provider);
  let res;
  res = await nfc.numProjects();
  let n = 0;
  if (res.gt('100')) {
    n = 100;
  } else if (res.gt('0')) {
    n = res.toNumber();
  }
  return {
    paths: new Array(n)
      .fill(null)
      .map((_, idx) => ({ params: { id: `${idx}` } })),
    fallback: res.gt('100'),
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
  res = await nfc.project(params.id);
  const project = res;
  res = await axios.get(`https://ipfs.io/ipfs/${project.parameterCid}`);
  const parameters = res.data;
  res = await nfc.tokenIdsByProjectId(params.id);
  const nextSerial = res.length;
  res = await nfc.tokenURI(res[0]);
  res = await axios.get(res);
  const token = res.data;

  const projectInfo = {
    id: params.id,
    author: project.author,
    codegenUrl: project.codegenUrl,
    parameterCid: project.parameterCid,
    name: project.name,
    description: project.description,
    license: project.license,
    pricePerTokenInWei: project.pricePerTokenInWei.toString(),
    maxNumEditions: project.maxNumEditions.toString(),
    isPaused: project.isPaused,
    parameters: parameters.map((p) => ({
      ...p,
      id: uuidv4(),
    })),
    nextSerial,
    previewUrl: token.animation_url,
  };

  return {
    props: {
      project: projectInfo,
    },
    revalidate: 1,
  };
}

export default ProjectPage;
