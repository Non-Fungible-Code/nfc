import React from 'react';

import { createGlobalStyle } from 'styled-components';
import tw, { theme, GlobalStyles as BaseStyles } from 'twin.macro';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <BaseStyles />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
