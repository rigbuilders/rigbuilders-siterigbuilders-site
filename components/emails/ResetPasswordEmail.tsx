import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  resetLink: string;
  userName?: string;
}

export default function ResetPasswordEmail({ resetLink, userName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Rig Builders password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset Your Password</Heading>
          <Text style={text}>
            Hi {userName || 'Builder'},
          </Text>
          <Text style={text}>
            We received a request to reset the password for your Rig Builders account. 
            If you didn't ask for this, you can safely ignore this email.
          </Text>
          <Section style={btnContainer}>
            <Link style={button} href={resetLink}>
              Set New Password
            </Link>
          </Section>
          <Text style={footer}>
            This link will expire in 24 hours.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// STYLES
const main = {
  backgroundColor: '#121212',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#A0A0A0',
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '30px',
};

const button = {
  backgroundColor: '#4E2C8B',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  fontWeight: 'bold',
};

const footer = {
  color: '#555',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '40px',
};