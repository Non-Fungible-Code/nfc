import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import tw, { css, styled } from 'twin.macro';
import {
  Loader as LoaderIcon,
  Plus as PlusIcon,
  X as XIcon,
} from 'react-feather';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ethers } from 'ethers';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import { Context } from '../_app';

const StyledHeader = styled(Header)(() => [
  tw`absolute! left-1/2`,
  tw`transform -translate-x-1/2`,
]);

const StyledFooter = styled(Footer)(() => [tw`sm:hidden`]);

const Button = styled.button(() => [
  tw`px-6 py-4`,
  tw`bg-black`,
  tw`text-white font-bold`,
  tw`rounded-full`,
  tw`shadow-lg`,
  tw`cursor-pointer`,
  tw`focus:outline-none`,
  ...liftWhenHoverMixin,
]);

const Field = styled.div(() => [
  tw`not-first:mt-4`,
  css`
    label,
    input,
    textarea,
    select {
      ${tw`block`}
      ${tw`w-full`}
    }

    input,
    textarea,
    select {
      ${tw`mt-1`}
      ${tw`p-2`}
      ${tw`border border-gray-200`}
      ${tw`rounded-xl`}
      ${tw`focus:(outline-none ring-2 ring-gray-200)`}
    }
  `,
]);

const CreatePage = () => {
  const [state, dispatch] = useContext(Context);

  const router = useRouter();

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

  const [formValueByName, setFormValueByName] = useState({
    codegenUrl: '',
    name: '',
    description: '',
    license: '',
    isLimitedEdition: 'NO',
    maxNumEditions: 1,
    price: 0.001,
  });
  const handleFormInputChange = useCallback(
    (e) => {
      setFormValueByName((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
      if (e.target.name === 'isLimitedEdition' && e.target.value === 'NO') {
        setFormValueByName((prev) => ({
          ...prev,
          maxNumEditions: 1,
        }));
      }
    },
    [setFormValueByName],
  );

  const [parameters, setParameters] = useState([]);
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
  const handleAddParameterButtonClick = useCallback(() => {
    setParameters((prev) => [
      ...prev,
      {
        id: uuidv4(),
        key: '',
        type: 'STRING',
        name: '',
        defaultValue: '',
      },
    ]);
  }, [setParameters]);
  const handleRemoveParameterButtonClick = useCallback(
    (id) => () => {
      setParameters((prev) => {
        const nextParameters = [...prev];
        const idx = nextParameters.findIndex((p) => p.id === id);
        nextParameters.splice(idx, 1);
        return nextParameters;
      });
    },
    [setParameters],
  );

  const [isCreating, setIsCreating] = useState(false);
  const handleCreateButtonClick = useCallback(
    async (e) => {
      try {
        e.preventDefault();

        setIsCreating(true);
        if (formRef.current.reportValidity()) {
          let res;
          res = await axios.get(
            `${
              formValueByName.codegenUrl
            }/api/export?address=${encodeURIComponent(
              signerAddress,
            )}${parameters.reduce(
              (prev, { key: k, defaultValue: v }) =>
                `${prev}&${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
              '',
            )}`,
          );
          console.log(res);
          const ex = res.data;

          res = await Promise.all(
            ex.paths.map(
              (p) =>
                new Promise((resolve, reject) =>
                  axios
                    .get(
                      `${formValueByName.codegenUrl}/api/exports/${ex.id}/${p}`,
                      {
                        responseType: 'blob',
                      },
                    )
                    .then((res) => {
                      resolve({
                        data: res.data,
                        path: `${ex.id}/${p}`,
                      });
                    })
                    .catch(reject),
                ),
            ),
          );
          console.log(res);

          const formData = new FormData();
          formData.append('name', `${formValueByName.name} #0`);
          formData.append('id', ex.id);
          res.forEach((f) => {
            formData.append('files', f.data, f.path);
          });

          res = await axios.post('/api/pin', formData);

          // const codeCid = res.data.codeCid;
          // res = await axios.post('/api/pin-cid', { cid: codeCid });
          // console.log(res);

          // res = await state.ipfs.node.add(
          //   JSON.stringify(
          //     parameters.map((p) => ({
          //       type: p.type,
          //       name: p.name,
          //       description: p.description,
          //       defaultValue: p.defaultValue,
          //     })),
          //   ),
          // );
          // const parameterCid = res.cid.toString();
          // res = await axios.post('/api/pin-cid', { cid: parameterCid });
          // console.log(res);

          // const project = {
          //   author: signerAddress,
          //   codegenUrl: formValueByName.codegenUrl,
          //   parameterCid,
          //   name: formValueByName.name,
          //   description: formValueByName.description,
          //   license: formValueByName.license,
          //   pricePerTokenInWei: ethers.utils.parseEther(
          //     `${formValueByName.price}`,
          //   ),
          //   maxNumEditions:
          //     formValueByName.isLimitedEdition === 'YES'
          //       ? ethers.BigNumber.from(formValueByName.maxNumEditions)
          //       : ethers.BigNumber.from(
          //           '115792089237316195423570985008687907853269984665640564039457584007913129639935',
          //         ),
          // };
          // console.log(project);
          // const token = {
          //   name: `${project.name} #0`,
          //   description: `${project.description}`,
          //   animation_url: `https://${tokenId}.ipfs.dweb.link/`,
          //   attributes: parameters.map((p) => ({
          //     trait_type: p.name,
          //     value: p.defaultValue,
          //   })),
          // };
          // console.log(token);
          // res = await state.ipfs.node.add(JSON.stringify(token));
          // const firstMintCid = res.cid.toString();
          // res = await axios.post('/api/pin-cid', { cid: firstMintCid });
          // console.log(res);
          // res = await state.eth.nfc
          //   .connect(state.eth.signer)
          //   .createProject(
          //     project.author,
          //     project.codegenUrl,
          //     project.parameterCid,
          //     project.name,
          //     project.description,
          //     project.license,
          //     project.pricePerTokenInWei,
          //     project.maxNumEditions,
          //     firstMintCid,
          //     { value: project.pricePerTokenInWei },
          //   );
          // console.log(res);
        }
        setIsCreating(false);
        router.push('/projects');
      } catch (err) {
        console.error(err);
        setIsCreating(false);
      }
    },
    [
      router,
      formValueByName.codegenUrl,
      formValueByName.name,
      signerAddress,
      parameters,
    ],
  );

  return (
    <>
      <Head>
        <title>Create</title>
      </Head>

      <StyledHeader />

      <div css={[tw`grid grid-cols-1`, tw`sm:grid-cols-2`]}>
        <div
          css={[
            tw`relative`,
            tw`col-span-1`,
            css`
              height: calc(100vh - 160px);
            `,
            tw`bg-gray-100`,
            tw`sm:h-screen`,
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
              src={
                formValueByName.codegenUrl
                  ? `${new URL(
                      '/api/preview',
                      formValueByName.codegenUrl,
                    )}?address=${encodeURIComponent(
                      signerAddress,
                    )}${parameters.reduce(
                      (prev, { key: k, defaultValue: v }) =>
                        `${prev}&${encodeURIComponent(k)}=${encodeURIComponent(
                          v,
                        )}`,
                      '',
                    )}`
                  : '/404'
              }
            />
          </div>
        </div>

        <div
          css={[
            tw`col-span-1`,
            tw`sm:relative`,
            tw`sm:h-screen`,
            tw`sm:overflow-y-auto`,
          ]}
        >
          <div
            css={[
              tw`hidden`,
              tw`sm:block`,
              tw`sm:(fixed right-0 top-0 w-1/2)`,
              tw`sm:pt-32`,
              tw`sm:bg-white`,
              tw`sm:z-10`,
            ]}
          />
          <div
            css={[
              tw`container`,
              tw`mx-auto`,
              tw`px-4 pt-8`,
              tw`sm:(px-8 pt-32)`,
            ]}
          >
            <form ref={formRef}>
              <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`]}>
                  <Field>
                    <label htmlFor="codegenUrl">Code Generation URL</label>
                    <input
                      id="codegenUrl"
                      type="url"
                      name="codegenUrl"
                      value={formValueByName.codegenUrl}
                      onChange={handleFormInputChange}
                      required
                    />
                  </Field>
                  <Field>
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formValueByName.name}
                      onChange={handleFormInputChange}
                      required
                    />
                  </Field>
                  <Field>
                    <label htmlFor="description">Description</label>
                    <textarea
                      css={[
                        css`
                          resize: none;
                        `,
                      ]}
                      id="description"
                      name="description"
                      value={formValueByName.description}
                      onChange={handleFormInputChange}
                      rows="3"
                      maxLength="500"
                      required
                    />
                  </Field>
                  <Field>
                    <label htmlFor="license">License</label>
                    <input
                      id="license"
                      type="text"
                      name="license"
                      value={formValueByName.license}
                      onChange={handleFormInputChange}
                    />
                  </Field>
                  <Field>
                    <label htmlFor="maxNumEditions">Max # of Editions</label>
                    <div css={[tw`flex`]}>
                      <select
                        css={[tw`flex-1`]}
                        name="isLimitedEdition"
                        value={formValueByName.isLimitedEdition}
                        onChange={handleFormInputChange}
                      >
                        <option value="NO">No Limit</option>
                        <option value="YES">Limit to</option>
                      </select>
                      <input
                        css={[
                          tw`flex-1`,
                          formValueByName.isLimitedEdition !== 'YES' &&
                            tw`hidden!`,
                          tw`ml-2`,
                        ]}
                        id="maxNumEditions"
                        type="number"
                        name="maxNumEditions"
                        value={formValueByName.maxNumEditions}
                        onChange={handleFormInputChange}
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                  </Field>
                  <Field>
                    <label htmlFor="price">Price</label>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={formValueByName.price}
                      onChange={handleFormInputChange}
                      min="0"
                      step="0.001"
                      required
                    />
                  </Field>
                </div>
              </div>
              <div css={[tw`mt-4`, tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`]}>
                  <h3 css={[tw`mb-4`]}>Parameters</h3>
                  <div css={[tw`mt-4`]}>
                    {parameters.map((p) => (
                      <React.Fragment key={p.id}>
                        <div
                          css={[
                            tw`relative`,
                            tw`my-4`,
                            tw`border-t border-gray-200`,
                          ]}
                        >
                          <button
                            css={[
                              tw`absolute right-0 top-1/2`,
                              tw`transform translate-x-1/2 -translate-y-1/2`,
                              tw`p-1`,
                              tw`bg-gray-200`,
                              tw`text-white`,
                              tw`rounded-full`,
                              tw`focus:outline-none`,
                            ]}
                            type="button"
                            onClick={handleRemoveParameterButtonClick(p.id)}
                          >
                            <XIcon size={14} />
                          </button>
                        </div>
                        <Field
                          css={[tw`grid grid-cols-1 gap-2`, tw`sm:grid-cols-2`]}
                        >
                          <input
                            id={`${p.id}__key`}
                            type="text"
                            name={`${p.id}__key`}
                            value={p.key}
                            onChange={handleParameterFieldChange}
                            required
                            placeholder="key"
                          />
                          <select
                            id={`${p.id}__type`}
                            type="text"
                            name={`${p.id}__type`}
                            value={p.type}
                            onChange={handleParameterFieldChange}
                            required
                          >
                            <option value="STRING">string</option>
                            <option value="NUMBER">number</option>
                          </select>
                          <input
                            id={`${p.id}__name`}
                            type="text"
                            name={`${p.id}__name`}
                            value={p.name}
                            onChange={handleParameterFieldChange}
                            required
                            placeholder="name"
                          />
                          <input
                            id={`${p.id}__defaultValue`}
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
                            name={`${p.id}__defaultValue`}
                            value={p.defaultValue}
                            onChange={handleParameterFieldChange}
                            required
                            placeholder="default value"
                          />
                        </Field>
                      </React.Fragment>
                    ))}
                  </div>
                  <div
                    css={[tw`relative`, tw`my-4`, tw`border-t border-gray-200`]}
                  >
                    <button
                      css={[
                        tw`absolute right-0 top-1/2`,
                        tw`transform translate-x-1/2 -translate-y-1/2`,
                        tw`p-1`,
                        tw`bg-gray-200`,
                        tw`text-white`,
                        tw`rounded-full`,
                        tw`focus:outline-none`,
                      ]}
                      type="button"
                      onClick={handleAddParameterButtonClick}
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div css={[tw`flex justify-end items-center`, tw`my-8`]}>
                <Button
                  css={[
                    css`
                      background-color: #fbda61;
                      background-image: linear-gradient(
                        45deg,
                        #fbda61 0%,
                        #ff5acd 100%
                      );
                    `,
                  ]}
                  onClick={handleCreateButtonClick}
                >
                  {isCreating ? <LoaderIcon tw="animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <StyledFooter />
    </>
  );
};

export default CreatePage;
