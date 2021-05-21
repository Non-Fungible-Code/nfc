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
  const codeFileInputRef = useRef(null);

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

  const [codeCid, setCodeCid] = useState('');
  const handleCodeFileInputChange = useCallback(() => {
    const pin = async () => {
      const formData = new FormData();
      formData.append('id', uuidv4());
      for (let i = 0; i < codeFileInputRef.current.files.length; i += 1) {
        formData.append(
          'files',
          codeFileInputRef.current.files[i],
          codeFileInputRef.current.files[i].webkitrelativepath,
        );
      }
      const res = await axios.post('/api/ipfs/pin-dir', formData);
      setCodeCid(res.data.cid);
    };
    const unpin = async () => {
      await axios.post('/api/ipfs/unpin', { cid: codeCid });
      setCodeCid('');
    };
    if (codeCid) {
      unpin();
    }
    let size = 0;
    for (let i = 0; i < codeFileInputRef.current.files.length; i += 1) {
      size += codeFileInputRef.current.files[i].size;
    }
    if (size > 5 * 1024 * 1024) {
      codeFileInputRef.current.files = null;
    }
    pin();
  }, [codeCid]);

  const [formValueByName, setFormValueByName] = useState({
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

        if (formRef.current.reportValidity()) {
          setIsCreating(true);

          let res;
          let formData;

          formData = new FormData();
          formData.append('id', uuidv4());
          formData.append(
            'file',
            new Blob(
              [
                JSON.stringify(
                  parameters.map((p) => ({
                    key: p.key,
                    type: p.type,
                    name: p.name,
                    defaultValue: p.defaultValue,
                  })),
                ),
              ],
              { type: 'application/json' },
            ),
            'parameters.json',
          );
          res = await axios.post('/api/ipfs/pin-file', formData);
          const parametersCid = res.data.cid;

          const project = {
            author: signerAddress,
            codeCid,
            parametersCid,
            name: formValueByName.name,
            description: formValueByName.description,
            license: formValueByName.license,
            pricePerTokenInWei: ethers.utils.parseEther(
              `${formValueByName.price}`,
            ),
            maxNumEditions:
              formValueByName.isLimitedEdition === 'YES'
                ? ethers.BigNumber.from(formValueByName.maxNumEditions)
                : ethers.BigNumber.from(
                    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                  ),
          };

          const token = {
            name: `${project.name} #1`,
            description: `${project.description}`,
            animation_url: `${new URL(
              '/',
              `https://${codeCid}.ipfs.dweb.link`,
            )}?address=${encodeURIComponent(signerAddress)}${parameters.reduce(
              (prev, { key: k, defaultValue: v }) =>
                `${prev}&${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
              '',
            )}`,
            attributes: parameters.map((p) => ({
              trait_type: p.name,
              value: p.defaultValue,
            })),
          };
          formData = new FormData();
          formData.append('id', uuidv4());
          formData.append(
            'file',
            new Blob([JSON.stringify(token)], { type: 'application/json' }),
            'token.json',
          );
          res = await axios.post('/api/ipfs/pin-file', formData);
          const tokenCid = res.data.cid;

          res = await state.eth.nfc
            .connect(state.eth.signer)
            .createProject(
              project.author,
              project.codeCid,
              project.parametersCid,
              project.name,
              project.description,
              project.license,
              project.pricePerTokenInWei,
              project.maxNumEditions,
              tokenCid,
              { value: project.pricePerTokenInWei },
            );
          console.log(res);

          setIsCreating(false);
          router.push('/projects');
        }
      } catch (err) {
        console.error(err);
        setIsCreating(false);
      }
    },
    [
      router,
      state.eth.nfc,
      state.eth.signer,
      signerAddress,
      parameters,
      codeCid,
      formValueByName.name,
      formValueByName.description,
      formValueByName.license,
      formValueByName.isLimitedEdition,
      formValueByName.maxNumEditions,
      formValueByName.price,
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
                codeCid
                  ? `${new URL(
                      '/',
                      `https://${codeCid}.ipfs.dweb.link`,
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
              sandbox="allow-scripts"
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
                    <label htmlFor="code">Code</label>
                    <input
                      ref={codeFileInputRef}
                      id="code"
                      type="file"
                      name="code"
                      webkitdirectory="true"
                      onChange={handleCodeFileInputChange}
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
