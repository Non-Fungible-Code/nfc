import { createGlobalStyle } from 'styled-components';
import tw from 'twin.macro';

const GlobalStyle = createGlobalStyle`
  body {
    ${tw`antialiased`}
  }
`;

export default GlobalStyle;
