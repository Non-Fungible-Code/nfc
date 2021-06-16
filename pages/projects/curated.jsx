import React from 'react';
import Head from 'next/head';
import tw, { css, styled } from 'twin.macro';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const CuratedProjectsPage = () => {
  return (
    <>
      <Head>
        <title>Curated Projects</title>
      </Head>

      <div css={[tw`flex flex-col`, tw`min-h-screen`]}>
        <Header />
        <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-16`]}>
          Coming soon...
        </main>
        <Footer css={[tw`mt-auto`]} />
      </div>
    </>
  );
};

export default CuratedProjectsPage;
