import * as React from 'react';
import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Preview,
  Section,
  Text,
  Img,
  Row,
  Column,
  Hr,
  Link,
} from '@react-email/components';

interface EmailProps {
  customerName: string;
  orderId: string;
  orderItems: any[];
  totalAmount: number;
}

export const OrderConfirmationEmail = ({
  customerName,
  orderId,
  orderItems,
  totalAmount,
}: EmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Rig Builders Order #{orderId} is Confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* LOGO AREA */}
          <Section style={logoContainer}>
             <Text style={logoText}>RIG BUILDERS</Text>
          </Section>

          {/* HERO HEADER */}
          <Section style={heroSection}>
            <Heading style={h1}>ORDER SECURED</Heading>
            <Text style={heroText}>
              Greetings, {customerName}. Your equipment has been authorized for assembly.
            </Text>
          </Section>

          {/* ORDER DETAILS */}
          <Section style={detailsSection}>
             <Text style={subHeader}>REFERENCE ID</Text>
             <Text style={idText}>{orderId}</Text>
          </Section>

          <Hr style={hr} />

          {/* ITEM LIST */}
          <Section>
            <Text style={subHeader}>MANIFEST</Text>
            {orderItems.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                   <Text style={itemName}>{item.name}</Text>
                   <Text style={itemCategory}>{item.category} | Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                   <Text style={itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* TOTAL */}
          <Section style={totalSection}>
            <Row>
                <Column>
                    <Text style={totalLabel}>TOTAL AUTHORIZED</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                    <Text style={totalPrice}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                </Column>
            </Row>
          </Section>

          {/* FOOTER */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated transmission from Rig Builders.
              <br />
              <Link href="https://rigbuilders.in" style={link}>Return to Base</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// --- STYLES ---
const main = {
  backgroundColor: '#000000',
  fontFamily: '"Orbitron", "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '100%',
  maxWidth: '600px',
};

const logoContainer = {
  padding: '20px',
  textAlign: 'center' as const,
  backgroundColor: '#121212',
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  margin: '0',
};

const heroSection = {
  padding: '40px 20px',
  textAlign: 'center' as const,
  background: 'linear-gradient(180deg, #121212 0%, #000000 100%)',
  borderBottom: '1px solid #333',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  letterSpacing: '2px',
};

const heroText = {
  color: '#8898aa',
  fontSize: '14px',
  margin: '0',
};

const detailsSection = {
  padding: '20px',
  textAlign: 'center' as const,
};

const subHeader = {
  color: '#8898aa',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  marginBottom: '5px',
};

const idText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
};

const hr = {
  borderColor: '#333',
  margin: '20px 0',
};

const itemRow = {
  marginBottom: '15px',
};

const itemName = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const itemCategory = {
  color: '#8898aa',
  fontSize: '10px',
  margin: '4px 0 0',
  textTransform: 'uppercase' as const,
};

const itemPrice = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const totalSection = {
  padding: '20px',
  backgroundColor: '#121212',
  borderRadius: '8px',
};

const totalLabel = {
  color: '#8898aa',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '1px',
};

const totalPrice = {
  color: '#4E2C8B', // Brand Purple
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const footer = {
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '20px',
};

const link = {
  color: '#4E2C8B',
  textDecoration: 'none',
  marginLeft: '10px',
};