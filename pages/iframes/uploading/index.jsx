import React, { useEffect } from 'react';
import Head from 'next/head';
import tw, { css, styled } from 'twin.macro';
import { Loader as LoaderIcon } from 'react-feather';

const Page = () => {
  return (
    <>
      <Head>
        <title>Uploading Upload | NFC</title>
      </Head>

      <div css={[tw`container`, tw`mx-auto`]}>
        <div css={[tw`flex justify-center items-center`, tw`h-screen`]}>
          <LoaderIcon tw="animate-spin" />
        </div>
      </div>
    </>
  );
};

export default Page;
