import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import tw, { css, styled } from 'twin.macro';
import { ethers } from 'ethers';
import axios from 'axios';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { liftWhenHoverMixin } from '../../utils/style';
import nfcAbi from '../../NFC.json';

const ProjectsPage = ({ projects }) => {
  return (
    <>
      <Head>
        <title>Curated Projects</title>
      </Head>

      <Header />
      <main css={[tw`container`, tw`mx-auto`, tw`px-4 pt-16`]}>
        Coming soon...
      </main>
      <Footer />
    </>
  );
};

export default ProjectsPage;
