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
        <Link href="https://twitter.com/nf_code" target="_blank">
          Twitter
        </Link>
        <Link href="https://discord.gg/HqSxPknrRd" target="_blank">
          Discord
        </Link>
        <Link href="https://github.com/Non-Fungible-Code" target="_blank">
          Github
        </Link>
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
        <Link href="https://docs.nfcode.art/" target="_blank">
          About
        </Link>
        <Link href="https://docs.nfcode.art/faqs" target="_blank">
          Help
        </Link>
      </div>
    </div>
  );
};

export default Footer;
