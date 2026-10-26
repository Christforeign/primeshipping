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

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirmez votre changement d’adresse pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ ...footer, margin: '0 0 20px', color: emailTheme.primary, fontWeight: 'bold' }}>{siteName}</Text>
        <Heading style={h1}>Confirmez votre changement d’adresse</Heading>
        <Text style={text}>
          Vous avez demandé de changer votre adresse e-mail sur {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          vers{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour confirmer ce changement :
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmer le changement
        </Button>
        <Text style={footer}>
          Si vous n’avez pas demandé ce changement, sécurisez votre compte
          immédiatement.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
