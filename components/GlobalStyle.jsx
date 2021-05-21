import { createGlobalStyle } from 'styled-components';
import tw from 'twin.macro';

const GlobalStyle = createGlobalStyle`
  body {
    ${tw`antialiased`}
    font-family: 'Montserrat', sans-serif;
  }
`;

export default GlobalStyle;
