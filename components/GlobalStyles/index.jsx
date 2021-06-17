import React from 'react';
import { createGlobalStyle } from 'styled-components';
import tw, { GlobalStyles as BaseStyles } from 'twin.macro';

// Import fonts in /fonts.css
const CustomStyles = createGlobalStyle`
  body {
    ${tw`antialiased`}
    font-family: 'Montserrat', sans-serif;
  }

  .bn-notify-notifications {
    z-index: 100;
  }

  .bn-onboard-modal {
    z-index: 101;
  }
`;

const GlobalStyles = () => (
  <>
    <BaseStyles />
    <CustomStyles />
  </>
);

export default GlobalStyles;
