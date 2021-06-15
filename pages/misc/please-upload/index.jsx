import React, { useEffect } from 'react';
import Head from 'next/head';
import tw, { css, styled } from 'twin.macro';

const Page = () => {
  return (
    <>
      <Head>
        <title>Please Upload | NFC</title>
      </Head>

      <div css={[tw`container`, tw`mx-auto`]}>
        <div css={[tw`flex justify-center items-center`, tw`h-screen`]}>
          <h1>Please upload your codes</h1>
        </div>
      </div>
    </>
  );
};

export default Page;
