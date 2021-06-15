import React, { useEffect } from 'react';
import Head from 'next/head';
import tw, { css, styled } from 'twin.macro';

const Page = () => {
  return (
    <>
      <Head>
        <title>Please Conenct | NFC</title>
      </Head>

      <div css={[tw`container`, tw`mx-auto`]}>
        <div css={[tw`flex justify-center items-center`, tw`h-screen`]}>
          <h1>Please connect to your wallet</h1>
        </div>
      </div>
    </>
  );
};

export default Page;
