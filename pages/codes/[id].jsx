import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import tw, { styled } from 'twin.macro';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const StyledHeader = styled(Header)`
  &&& {
    ${tw`absolute left-1/2 transform -translate-x-1/2`}
  }
`;

const Main = styled.main`
  ${tw`container px-4 xl:px-0 py-8 mx-auto`}
`;

const Hero = styled.div`
  ${tw`flex justify-center items-center p-36 bg-gray-100`}
`;

const Grid = styled.div`
  ${tw`grid grid-cols-12`}
`;

const InfoColumn = styled.div`
  ${tw`col-span-12 md:col-span-8`}
`;

const MintColumn = styled.div`
  ${tw`col-span-12 md:col-span-4`}
`;

const Name = styled.h2`
  ${tw`mb-16 text-4xl`}
`;

const Description = styled.p`
  ${tw`md:max-w-md mb-8`}
`;

const MintButton = styled.div`
  ${tw`px-8 py-4 bg-black text-white text-center rounded-xl cursor-pointer`}
  ${tw`transition-all duration-300`}
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  &:hover {
    ${tw`transform -translate-y-1 shadow-xl`}
  }
`;

const CodePage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Code: {id}</title>
      </Head>

      <StyledHeader />
      <Hero>
        <iframe
          src="http://localhost:3001/?ADDRESS=0x4340ac786edF408a0C8e9a2505727CDe8C17AC51"
          width="800"
          height="600"
        />
      </Hero>
      <Main>
        <Grid>
          <InfoColumn>
            <Name>Gas Badge</Name>
            <Description>
              Amet elit adipisicing dolorem omnis ad Dolor corporis enim in
              inventore eos Est perferendis optio eum quos nulla ipsa Numquam
              minus perspiciatis veniam possimus est Voluptatem quos magnam
              adipisci blanditiis.
            </Description>
          </InfoColumn>
          <MintColumn>
            <MintButton>Mint</MintButton>
            {/* <h3>History</h3> */}
            {/* <div> */}
            {/*   {new Array(25).fill(null).map((_, idx) => ( */}
            {/*     <div>{idx}</div> */}
            {/*   ))} */}
            {/* </div> */}
          </MintColumn>
        </Grid>
      </Main>
      <Footer />
    </>
  );
};

export default CodePage;
