import React from 'react';
import tw, { css, styled } from 'twin.macro';

const Link = styled.a(() => [tw`text-sm text-gray-400`]);

const Footer = ({ className }) => {
  return (
    <div
      className={className}
      css={[
        tw`container`,
        tw`mx-auto`,
        tw`px-4 py-12`,
        tw`sm:flex sm:justify-between sm:items-center`,
      ]}
    >
      <div
        css={[
          tw`flex`,
          css`
            > a {
              ${tw`mr-2`}
            }
          `,
        ]}
      >
        <Link href="https://twitter.com/nf_code">Twitter</Link>
        <Link href="https://discord.gg/HqSxPknrRd">Discord</Link>
        <Link href="https://github.com/Non-Fungible-Code">Github</Link>
      </div>
      <div
        css={[
          tw`flex`,
          css`
            > a {
              ${tw`mr-2`}
              ${tw`sm:(mr-0 ml-2)`}
            }
          `,
        ]}
      >
        <Link href="">About</Link>
        <Link href="">Help</Link>
      </div>
    </div>
  );
};

export default Footer;
