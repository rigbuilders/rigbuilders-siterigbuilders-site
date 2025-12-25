import * as React from 'react';
import { Html, Body, Container, Section, Text, Heading, Row, Column, Hr, Img, Link } from '@react-email/components';

// ✅ DEFINE PROPS: Matches what route.ts is sending now
interface EmailProps {
  order: any;      // Accepts the full Supabase order object
  taxDetails?: any; // Optional, in case you want to show tax summary later
}

export default function OrderConfirmationEmail({ order }: EmailProps) {
  // Safe extraction of data from the 'order' object
  const { 
    display_id = "ORD-PENDING", 
    full_name = "Customer", 
    items = [], 
    total_amount = 0,
    shipping_address = {}
  } = order || {};

  return (
    <Html>
      <Body style={main}>
        <Container style={container}>
          {/* LOGO */}
          <Section style={{ textAlign: 'center', padding: '20px 0' }}>
            <Img 
              src="https://rigbuilders.in/icons/navbar/logo.png" 
              width="150" 
              alt="Rig Builders"
              style={{ margin: '0 auto' }} 
            />
          </Section>

          {/* GREETING */}
          <Heading style={h1}>Order Confirmed!</Heading>
          <Text style={text}>
            Hi {full_name},<br/>
            Thank you for your purchase. We have received your order and are getting it ready!
          </Text>

          {/* ORDER INFO */}
          <Section style={infoBox}>
            <Text style={infoText}><strong>Order ID:</strong> {display_id}</Text>
            <Text style={infoText}><strong>Total Amount:</strong> ₹{total_amount.toLocaleString('en-IN')}</Text>
          </Section>

          <Hr style={hr} />

          {/* ORDER ITEMS SUMMARY */}
          <Section>
            <Text style={subHeading}>Order Summary</Text>
            {items.map((item: any, index: number) => (
              <Row key={index} style={{ marginBottom: '10px' }}>
                <Column style={{ width: '70%' }}>
                  <Text style={itemText}>{item.name} (x{item.quantity})</Text>
                </Column>
                <Column style={{ width: '30%', textAlign: 'right' }}>
                  <Text style={itemText}>₹{item.price}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* SHIPPING ADDRESS */}
          <Section>
             <Text style={subHeading}>Shipping Address</Text>
             <Text style={addressText}>
               {shipping_address.addressLine1}<br/>
               {shipping_address.city}, {shipping_address.state} - {shipping_address.pincode}<br/>
               Phone: {shipping_address.phone}
             </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginTop: '30px' }}>
             <Link href="https://rigbuilders.in/orders" style={button}>
               View Your Order
             </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- STYLES ---
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' as const, margin: '30px 0' };
const text = { color: '#525f7f', fontSize: '16px', lineHeight: '24px', textAlign: 'left' as const, padding: '0 40px' };
const infoBox = { padding: '20px 40px', backgroundColor: '#f9f9f9', margin: '20px 0' };
const infoText = { margin: '5px 0', color: '#333', fontSize: '14px' };
const subHeading = { color: '#333', fontSize: '18px', fontWeight: 'bold', padding: '0 40px', marginBottom: '10px' };
const itemText = { fontSize: '14px', color: '#525f7f', padding: '0 40px' };
const addressText = { fontSize: '14px', color: '#525f7f', lineHeight: '20px', padding: '0 40px' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
const button = { backgroundColor: '#000', borderRadius: '5px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '200px', padding: '12px', margin: '0 auto' };