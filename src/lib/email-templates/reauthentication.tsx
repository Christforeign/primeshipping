import * as React from 'react'
import { emailTheme } from './theme'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ ...footer, margin: '0 0 20px', color: emailTheme.primary, fontWeight: 'bold' }}>{'PRIME SHIPPING'}</Text>
        <Heading style={h1}>Confirmez votre identité</Heading>
        <Text style={text}>Utilisez le code ci-dessous pour confirmer votre identité :</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Ce code expirera prochainement. Si vous ne l’avez pas demandé, vous pouvez
          ignorer cet e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: emailTheme.background, fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: emailTheme.foreground,
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: emailTheme.foreground,
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: emailTheme.foreground,
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: emailTheme.muted, margin: '30px 0 0' }
