import React from 'react';
import tw, { styled } from 'twin.macro';

const Root = styled.footer`
  ${tw`container flex flex-col md:flex-row md:justify-between px-4 xl:px-0 mx-auto py-12`}
`;

const Social = styled.div`
  ${tw`flex md:-ml-3`}
`;

const Support = styled.div`
  ${tw`flex md:-mr-3`}
`;

const Link = styled.a`
  ${tw`pr-3 md:px-3 text-sm text-gray-400`}
`;

const Footer = () => {
  return (
    <Root>
      <Social>
        <Link>Twitter</Link>
        <Link>Discord</Link>
        <Link>Github</Link>
      </Social>
      <Support>
        <Link>Community Guidelines</Link>
        <Link>Help</Link>
      </Support>
    </Root>
  );
};

export default Footer;
