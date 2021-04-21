import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import tw, { styled } from 'twin.macro';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Main = styled.main`
  ${tw`container px-4 xl:px-0 pt-16 mx-auto`}
`;

const Title = styled.h2`
  ${tw`text-4xl mb-4`}
`;

const Grid = styled.div`
  ${tw`grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8`}
`;

const Card = styled.div`
  ${tw`rounded-lg shadow-lg overflow-hidden`}
`;

const CardContent = styled.div`
  ${tw`p-6`}
`;

const CreatorsPage = () => {
  return (
    <>
      <Head>
        <title>Creators</title>
      </Head>

      <Header />
      <Main>
        <Title>Creators</Title>
        <p>Comming soon...</p>
      </Main>
      <Footer />
    </>
  );
};

export default CreatorsPage;
