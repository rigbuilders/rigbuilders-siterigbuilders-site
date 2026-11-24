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
  Hr,
} from '@react-email/components';

interface QuotationReadyEmailProps {
  loginLink: string;       // seamless magic link → signs them in and lands on the dashboard
  quotationNo?: string;    // e.g. RB-QO-2026-001
  buildName?: string;      // quotation title / build name
  total?: number;          // final amount (₹)
  userName?: string;
  newAccount?: boolean;    // was the account just created for them?
}

export default function QuotationReadyEmail({
  loginLink,
  quotationNo,
  buildName,
  total,
  userName,
  newAccount,
}: QuotationReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Rig Builders quotation{quotationNo ? ` ${quotationNo}` : ''} is ready to view</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>RIG<span style={{ color: '#ff5a1f' }}>BUILDERS</span></Text>

          <Heading style={h1}>Your quotation is ready</Heading>

          <Text style={text}>Hi {userName || 'there'},</Text>
          <Text style={text}>
            {newAccount
              ? 'We’ve prepared your custom quotation and set up a secure account for you so you can view and download it anytime.'
              : 'We’ve prepared a new quotation for you — it’s waiting in your dashboard.'}
          </Text>

          <Section style={card}>
            {quotationNo ? (
              <Text style={cardRow}><span style={cardLabel}>Quotation</span><span style={cardVal}>{quotationNo}</span></Text>
            ) : null}
            {buildName ? (
              <Text style={cardRow}><span style={cardLabel}>Build</span><span style={cardVal}>{buildName}</span></Text>
            ) : null}
            {typeof total === 'number' && total > 0 ? (
              <Text style={cardRow}><span style={cardLabel}>Total</span><span style={{ ...cardVal, color: '#ff5a1f' }}>₹{total.toLocaleString('en-IN')}</span></Text>
            ) : null}
          </Section>

          <Section style={btnContainer}>
            <Link style={button} href={loginLink}>
              View my quotation →
            </Link>
          </Section>
          <Text style={subtle}>
            This button signs you in automatically. Once inside, you can view every quotation on your
            account and download a PDF. You can set a password from your dashboard to log back in anytime.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Rig Builders · Custom Gaming PCs &amp; Workstations · Bathinda, Punjab<br />
            info@rigbuilders.in · www.rigbuilders.in
          </Text>
          <Text style={footerTiny}>
            If you didn’t request this quotation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// STYLES
const main = {
  backgroundColor: '#0e0e0e',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};
const container = {
  margin: '0 auto',
  padding: '40px 28px',
  maxWidth: '560px',
};
const brand = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.06em',
  textAlign: 'center' as const,
  margin: '0 0 8px',
};
const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  margin: '18px 0 26px',
};
const text = {
  color: '#b9b9b9',
  fontSize: '15px',
  lineHeight: '25px',
  margin: '0 0 14px',
};
const card = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '18px 0 6px',
};
const cardRow = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  margin: '6px 0',
  fontSize: '14px',
};
const cardLabel = { color: '#8a8a8a' };
const cardVal = { color: '#ffffff', fontWeight: 'bold' as const };
const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '26px',
  marginBottom: '14px',
};
const button = {
  backgroundColor: '#ff5a1f',
  borderRadius: '8px',
  color: '#0e0e0e',
  fontSize: '16px',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '13px 30px',
  fontWeight: 'bold' as const,
};
const subtle = {
  color: '#7c7c7c',
  fontSize: '12.5px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 10px',
};
const hr = { borderColor: '#242424', margin: '28px 0 16px' };
const footer = {
  color: '#6f6f6f',
  fontSize: '12px',
  lineHeight: '19px',
  textAlign: 'center' as const,
};
const footerTiny = {
  color: '#4f4f4f',
  fontSize: '11px',
  textAlign: 'center' as const,
  marginTop: '14px',
};
