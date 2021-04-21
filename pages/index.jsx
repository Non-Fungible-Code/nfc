import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/codes');
  }, [router]);

  return (
    <>
      <Head>
        <title>NFC</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </>
  );
}
