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
  ${tw`rounded-lg shadow-lg overflow-hidden cursor-pointer`}
  ${tw`transition-all duration-300`}
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  &:hover {
    ${tw`transform -translate-y-1 shadow-xl`}
  }
`;

const CardContent = styled.div`
  ${tw`p-6`}
`;

const CodesPage = () => {
  return (
    <>
      <Head>
        <title>Codes</title>
      </Head>

      <Header />
      <Main>
        <Title>Codes</Title>
        <Grid>
          {new Array(25).fill(null).map((_, idx) => (
            <Link key={idx} href={`/codes/${idx}`}>
              <Card>
                <img src={`https://picsum.photos/id/${idx + 10}/640`} alt="" />
                <CardContent>
                  <h3>Code {idx}</h3>
                  <h4>Creator {idx}</h4>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Grid>
      </Main>
      <Footer />
    </>
  );
};

export default CodesPage;
