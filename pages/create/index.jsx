import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  useMemo,
} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import tw, { css, styled } from 'twin.macro';
import {
  Loader as LoaderIcon,
  HelpCircle as HelpCircleIcon,
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
  const [state] = useContext(Context);

  const router = useRouter();

  const codeFileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [projectCodeCid, setProjectCodeCid] = useState('');
  const handleFormCodeFileInputChange = useCallback(async () => {
    const pin = async () => {
      const formData = new FormData();
      for (let i = 0; i < codeFileInputRef.current.files.length; i += 1) {
        formData.append(
          'files',
          codeFileInputRef.current.files[i],
          codeFileInputRef.current.files[i].webkitrelativepath,
        );
      }
      const { cid } = await axios
        .post(
          `${new URL('ipfs/pin', process.env.NEXT_PUBLIC_API_BASE_URL)}`,
          formData,
        )
        .then((res) => res.data);
      setProjectCodeCid(cid);
    };
    const unpin = async (cid) => {
      await axios.post(
        `${new URL('ipfs/unpin', process.env.NEXT_PUBLIC_API_BASE_URL)}`,
        { cid },
      );
      setProjectCodeCid('');
    };

    try {
      setIsUploading(true);
      let size = 0;
      for (let i = 0; i < codeFileInputRef.current.files.length; i += 1) {
        size += codeFileInputRef.current.files[i].size;
      }
      if (
        size >
        Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_IN_MB) * 1024 * 1024
      ) {
        throw new Error(
          `Exceed the maximum of total upload size: ${Number(
            process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_IN_MB,
          )}MB`,
        );
      }
      if (projectCodeCid) {
        await unpin(projectCodeCid);
      }
      await pin();
      codeFileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      state.eth.notify.notification({
        eventCode: 'projectCodeUploadError',
        type: 'error',
        message: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  }, [projectCodeCid, state?.eth?.notify]);

  const [formValueByName, setFormValueByName] = useState({
    name: '',
    description: '',
    license: '',
    isLimitedEdition: 'NO',
    maxNumEditions: 1,
    price: 0.001,
  });
  const handleFormInputChange = useCallback((e) => {
    setFormValueByName((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      ...(e.target.name === 'isLimitedEdition' && e.target.value === 'NO'
        ? {
            maxNumEditions: 1,
          }
        : {}),
    }));
  }, []);

  const [projectParameters, setProjectParameters] = useState([]);
  const handleParameterFieldChange = useCallback(
    (id, name) => (e) => {
      setProjectParameters((prev) => {
        const nextParameters = [...prev];
        const idx = nextParameters.findIndex((param) => param.id === id);
        const nextParameter = {
          ...nextParameters[idx],
          [name]: e.target.value,
        };
        nextParameters.splice(idx, 1, nextParameter);
        return nextParameters;
      });
    },
    [],
  );
  const handleAddParameterButtonClick = useCallback(() => {
    setProjectParameters((prev) => [
      ...prev,
      {
        id: uuidv4(),
        key: '',
        type: 'STRING',
        name: '',
        defaultValue: '',
      },
    ]);
  }, []);
  const handleRemoveParameterButtonClick = useCallback(
    (id) => () => {
      setProjectParameters((prev) => {
        const nextParameters = [...prev];
        const idx = nextParameters.findIndex((param) => param.id === id);
        nextParameters.splice(idx, 1);
        return nextParameters;
      });
    },
    [],
  );

  const tokenPreviewUrl = useMemo(
    () =>
      projectCodeCid && state?.eth?.signerAddress
        ? `${new URL(
            `/?${new URLSearchParams({
              address: state.eth.signerAddress,
              ...projectParameters.reduce(
                (prev, param) => ({
                  ...prev,
                  [param.key]: param.defaultValue,
                }),
                {},
              ),
            })}`,
            `https://${projectCodeCid}.ipfs.${process.env.NEXT_PUBLIC_IPFS_GATEWAY_DOMAIN}`,
          )}`
        : '',
    [projectCodeCid, state?.eth?.signerAddress, projectParameters],
  );

  const [isCreating, setIsCreating] = useState(false);
  const handleFormSubmit = useCallback(
    async (e) => {
      try {
        e.preventDefault();
        if (e.target.reportValidity()) {
          const pin = async (blob, filename) => {
            const formData = new FormData();
            formData.append('file', blob, filename);
            const { cid } = await axios
              .post(
                `${new URL('ipfs/pin', process.env.NEXT_PUBLIC_API_BASE_URL)}`,
                formData,
              )
              .then((res) => res.data);
            return cid;
          };
          setIsCreating(true);

          if (
            projectParameters.length >
            Number(process.env.NEXT_PUBLIC_MAX_NUM_PROJECT_PARAMETERS)
          ) {
            throw new Error(
              `Exceed the maximum of project parameters: ${Number(
                process.env.NEXT_PUBLIC_MAX_NUM_PROJECT_PARAMETERS,
              )}`,
            );
          }
          if (
            new Set(projectParameters.map((param) => param.key)).size <
            projectParameters.length
          ) {
            throw new Error('Duplicate parameter keys');
          }

          const projectParametersCid = await pin(
            new Blob(
              [
                JSON.stringify(
                  projectParameters.map((param) => ({
                    key: param.key,
                    type: param.type,
                    name: param.name,
                    defaultValue: param.defaultValue,
                  })),
                ),
              ],
              { type: 'application/json' },
            ),
            'parameters.json',
          );

          const project = {
            author: state.eth.signerAddress,
            codeCid: projectCodeCid,
            parametersCid: projectParametersCid,
            name: formValueByName.name,
            description: formValueByName.description,
            license: formValueByName.license,
            pricePerTokenInWei: ethers.utils.parseEther(
              `${formValueByName.price}`,
            ),
            maxNumEditions:
              formValueByName.isLimitedEdition === 'NO'
                ? ethers.BigNumber.from(
                    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                  )
                : ethers.BigNumber.from(formValueByName.maxNumEditions),
          };

          // TODO: Let users customize token names and descriptions?
          const token = {
            name: `${project.name}`,
            description: `${project.description}`,
            animation_url: tokenPreviewUrl,
            attributes: projectParameters.map((param) => ({
              trait_type: param.name,
              value: param.defaultValue,
            })),
          };
          const tokenCid = await pin(
            new Blob([JSON.stringify(token)], { type: 'application/json' }),
            'token.json',
          );

          const { emitter } = state.eth.notify.transaction({
            sendTransaction: async () => {
              const tx = await state.eth.nfc
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
              return tx.hash;
            },
          });
          emitter.on('txConfirmed', () => {
            router.push('/projects');
          });
        }
      } catch (err) {
        console.error(err);
        state.eth.notify.notification({
          eventCode: 'projectCreateError',
          type: 'error',
          message: !projectCodeCid ? 'Please upload your code' : err.message,
        });
      } finally {
        setIsCreating(false);
      }
    },
    [
      router,
      state?.eth?.nfc,
      state?.eth?.signer,
      state?.eth?.signerAddress,
      state?.eth?.notify,
      projectParameters,
      projectCodeCid,
      formValueByName.name,
      formValueByName.description,
      formValueByName.license,
      formValueByName.isLimitedEdition,
      formValueByName.maxNumEditions,
      formValueByName.price,
      tokenPreviewUrl,
    ],
  );

  return (
    <>
      <Head>
        <title>Create</title>
      </Head>

      <Header css={[tw`absolute left-1/2`, tw`transform -translate-x-1/2`]} />
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
              tw`sm:(inset-x-8 top-32 bottom-16)`,
            ]}
          >
            {!state?.eth?.signerAddress ? (
              <div
                css={[
                  tw`absolute left-0 top-0 w-full h-full`,
                  tw`flex justify-center items-center`,
                ]}
              >
                <h1>Please connect to your wallet</h1>
              </div>
            ) : isUploading ? (
              <div
                css={[
                  tw`absolute left-0 top-0 w-full h-full`,
                  tw`flex justify-center items-center`,
                ]}
              >
                <LoaderIcon tw="animate-spin" />
              </div>
            ) : !tokenPreviewUrl ? (
              <div
                css={[
                  tw`absolute left-0 top-0 w-full h-full`,
                  tw`flex justify-center items-center`,
                ]}
              >
                <h1>Please upload your codes</h1>
              </div>
            ) : (
              <iframe
                css={[tw`absolute left-0 top-0 w-full h-full`]}
                title="Token Preview"
                src={tokenPreviewUrl}
                allow="accelerometer; autoplay; encrypted-media; fullscreen; gyroscope; picture-in-picture"
                sandbox="allow-scripts"
              />
            )}
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
            <form onSubmit={handleFormSubmit}>
              <div css={[tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`]}>
                  <div css={[tw`flex items-center`]}>
                    <label
                      css={[
                        tw`px-6 py-4`,
                        !state?.eth?.signerAddress
                          ? tw`bg-gray-300`
                          : tw`bg-black`,
                        tw`text-white font-bold`,
                        tw`rounded-full`,
                        tw`shadow-lg`,
                        !state?.eth?.signerAddress || isUploading
                          ? tw`cursor-not-allowed`
                          : tw`cursor-pointer`,
                        tw`focus:outline-none`,
                        ...(!state?.eth?.signerAddress || isUploading
                          ? []
                          : liftWhenHoverMixin),
                        tw`inline-block`,
                        tw`my-4`,
                      ]}
                      htmlFor="code"
                    >
                      {isUploading ? (
                        <LoaderIcon tw="animate-spin" />
                      ) : projectCodeCid ? (
                        'Replace'
                      ) : (
                        'Upload a Folder'
                      )}
                    </label>
                    <input
                      ref={codeFileInputRef}
                      id="code"
                      type="file"
                      name="code"
                      webkitdirectory="true"
                      onChange={handleFormCodeFileInputChange}
                      required
                      disabled={!state?.eth?.signerAddress || isUploading}
                      hidden
                    />
                    <a
                      css={[tw`ml-4`]}
                      href="https://docs.nfcode.art/guides/create"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <HelpCircleIcon />
                    </a>
                  </div>
                  <Field>
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formValueByName.name}
                      onChange={handleFormInputChange}
                      required
                      placeholder="Give your NFC a dope name!"
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
                      maxLength="1000"
                      required
                      placeholder="What's your project? Why is it cool? Does it have any customizable parameters? How to specify them?"
                    />
                  </Field>
                  <Field>
                    <label htmlFor="maxNumEditions">Editions</label>
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
                    <label htmlFor="price">Price (ETH)</label>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={formValueByName.price}
                      onChange={handleFormInputChange}
                      min="0"
                      step="0.001"
                      required
                      placeholder="0.001"
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
                      placeholder="Go for NFT License or just leave it blank"
                    />
                  </Field>
                </div>
              </div>
              <div css={[tw`mt-4`, tw`rounded-xl`, tw`shadow-lg`]}>
                <div css={[tw`p-8`]}>
                  <h3 css={[tw`mb-4`]}>Parameters (10 Max.)</h3>
                  <div css={[tw`mt-4`]}>
                    {projectParameters.map((param) => (
                      <React.Fragment key={param.id}>
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
                            onClick={handleRemoveParameterButtonClick(param.id)}
                          >
                            <XIcon size={14} />
                          </button>
                        </div>
                        <Field
                          css={[tw`grid grid-cols-1 gap-2`, tw`sm:grid-cols-2`]}
                        >
                          <input
                            id={`${param.id}__key`}
                            type="text"
                            name={`${param.id}__key`}
                            value={param.key}
                            onChange={handleParameterFieldChange(
                              param.id,
                              'key',
                            )}
                            required
                            placeholder="key"
                          />
                          <select
                            id={`${param.id}__type`}
                            type="text"
                            name={`${param.id}__type`}
                            value={param.type}
                            onChange={handleParameterFieldChange(
                              param.id,
                              'type',
                            )}
                            required
                          >
                            <option value="STRING">string</option>
                            <option value="NUMBER">number</option>
                          </select>
                          <input
                            id={`${param.id}__name`}
                            type="text"
                            name={`${param.id}__name`}
                            value={param.name}
                            onChange={handleParameterFieldChange(
                              param.id,
                              'name',
                            )}
                            required
                            placeholder="name"
                          />
                          <input
                            id={`${param.id}__defaultValue`}
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
                            name={`${param.id}__defaultValue`}
                            value={param.defaultValue}
                            onChange={handleParameterFieldChange(
                              param.id,
                              'defaultValue',
                            )}
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
                <button
                  css={[
                    tw`px-6 py-4`,
                    !state?.eth?.signerAddress
                      ? tw`bg-gray-300`
                      : css`
                          background-color: #fbda61;
                          background-image: linear-gradient(
                            45deg,
                            #fbda61 0%,
                            #ff5acd 100%
                          );
                        `,
                    tw`text-white font-bold`,
                    tw`rounded-full`,
                    tw`shadow-lg`,
                    tw`cursor-pointer`,
                    !state?.eth?.signerAddress || isCreating
                      ? tw`cursor-not-allowed`
                      : tw`cursor-pointer`,
                    tw`focus:outline-none`,
                    ...(!state?.eth?.signerAddress || isCreating
                      ? []
                      : liftWhenHoverMixin),
                  ]}
                  type="submit"
                  disabled={!state?.eth?.signerAddress || isCreating}
                >
                  {!state?.eth?.signerAddress ? (
                    'Please Connect First'
                  ) : isCreating ? (
                    <LoaderIcon tw="animate-spin" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer css={[tw`sm:hidden`]} />
    </>
  );
};

export default CreatePage;
