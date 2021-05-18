import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/projects');
  });

  return (
    <>
      <Head>
        <title>NFC</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </>
  );
};

export default HomePage;
