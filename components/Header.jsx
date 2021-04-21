import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import tw, { styled } from 'twin.macro';

const Root = styled.header`
  ${tw`relative container flex justify-between items-center px-4 xl:px-0 mx-auto mt-8`}
`;

const Logo = styled.div``;

const TabBar = styled.div`
  ${tw`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex p-2 bg-white rounded-lg shadow-xl`}
`;

const Tab = styled.div`
  ${tw`px-6 py-2 text-lg font-medium rounded-lg cursor-pointer`}
  ${(props) => props.isActive && tw`bg-black text-white`}
  &:hover {
    ${(props) => !props.isActive && tw`bg-gray-100`}
  }
`;

const Menu = styled.div`
  ${tw`flex`}
`;

const ConnectButton = styled.div`
  ${tw`px-6 py-4 bg-black text-white rounded-full cursor-pointer`}
  ${tw`transition-all duration-300`}
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  &:hover {
    ${tw`transform -translate-y-1 shadow-xl`}
  }
`;

const tabs = [
  {
    name: 'Feed',
    pathname: '/codes',
  },
  {
    name: 'Creators',
    pathname: '/creators',
  },
];

const Header = (props) => {
  const { className } = props;

  const router = useRouter();

  return (
    <Root className={className}>
      <Logo>NFC</Logo>
      {/* <TabBar> */}
      {/*   {tabs.map((t) => ( */}
      {/*     <Link key={t.name} href={t.pathname}> */}
      {/*       <Tab isActive={router.pathname === t.pathname}>{t.name}</Tab> */}
      {/*     </Link> */}
      {/*   ))} */}
      {/* </TabBar> */}
      <Menu>
        <ConnectButton>Connect Wallet</ConnectButton>
      </Menu>
    </Root>
  );
};

export default Header;
