import * as React from 'react'
import { emailTheme } from './theme'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirmez votre adresse e-mail pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ ...footer, margin: '0 0 20px', color: emailTheme.primary, fontWeight: 'bold' }}>{siteName}</Text>
        <Heading style={h1}>Confirmez votre adresse e-mail</Heading>
        <Text style={text}>
          Merci de votre inscription sur{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Confirmez votre adresse e-mail (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) en cliquant sur le bouton ci-dessous :
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmer mon adresse
        </Button>
        <Text style={footer}>
          Si vous n’avez pas créé de compte, vous pouvez ignorer cet e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: emailTheme.primary,
  color: emailTheme.background,
  fontSize: '14px',
  border: `1px solid ${emailTheme.primary}`,
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: emailTheme.muted, margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: ${emailTheme.primary} !important; color: ${emailTheme.background} !important; }
  }
  [data-ogsc] .dm-btn { background-color: ${emailTheme.primary} !important; color: ${emailTheme.background} !important; }
  [data-ogsb] .dm-btn { background-color: ${emailTheme.primary} !important; color: ${emailTheme.background} !important; }
`
