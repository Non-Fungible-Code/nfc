import tw, { css } from 'twin.macro';

export const liftWhenHoverMixin = [
  tw`transition-all duration-300`,
  tw`hover:(transform -translate-y-1)`,
  tw`hover:shadow-xl`,
  css`
    transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  `,
];
