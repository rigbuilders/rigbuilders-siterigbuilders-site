import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// The built-in Helvetica has no ₹ (U+20B9) glyph — it renders a "notdef" box that
// looks like a tiny "1". Register Saira (shipped in /public/fonts), which includes
// the rupee sign, so ₹ prints correctly.
Font.register({
  family: 'Saira',
  fonts: [
    { src: '/fonts/Saira-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Saira-Bold.ttf', fontWeight: 'bold' },
  ],
});

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const inr = (n: number) => (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrOrDash = (n: number) => (Number(n) > 0 ? inr(n) : '-');

// --- NUMBER TO WORDS (Indian system) ---
const numToWords = (input: number): string => {
  let num = Math.round(Number(input) || 0);
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n: number) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : ''));
  const three = (n: number) => (n < 100 ? two(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : ''));
  const parts: string[] = [];
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) parts.push(three(crore) + ' Crore');
  if (lakh) parts.push(three(lakh) + ' Lakh');
  if (thousand) parts.push(three(thousand) + ' Thousand');
  if (num) parts.push(three(num));
  return parts.join(' ');
};

const NAVY = '#0b0b0b';
const STEEL = '#2e4a6b';

const styles = StyleSheet.create({
  page: { paddingHorizontal: 34, paddingVertical: 34, fontFamily: 'Saira', fontSize: 10, color: '#111', lineHeight: 1.4 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: `2px solid ${NAVY}`, paddingBottom: 16, marginBottom: 20 },
  headerLeft: { width: '55%' },
  headerRight: { width: '45%', alignItems: 'flex-end' },
  // Explicit width AND height define a fixed box; objectFit: "contain" then
  // guarantees the full logo always fits inside it (letterboxed if needed)
  // instead of being cropped, regardless of the source image's own
  // proportions — objectFit has nothing to fit "into" without both
  // dimensions set, so leaving height unset would make it a no-op.
  logo: { width: 120, height: 44, marginBottom: 10, objectFit: "contain" },
  bizMeta: { fontSize: 8.5, color: '#444', lineHeight: 1.6 },
  bizStrong: { color: '#111' },
  docTitle: { fontSize: 22, fontWeight: 'bold', color: STEEL, marginBottom: 20 },
  metaLine: { fontSize: 9, color: '#333', textAlign: 'right', marginBottom: 5 },
  metaLabel: { color: '#888' },

  // Parties
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  blockLeft: { width: '50%', alignItems: 'flex-start' },
  blockRight: { width: '50%', alignItems: 'flex-end' },
  blockH: { fontSize: 8, color: '#888', letterSpacing: 0.6, marginBottom: 5 },
  blockName: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
  blockMeta: { fontSize: 9, color: '#333', lineHeight: 1.5 },

  // Items table
  tHead: { flexDirection: 'row', backgroundColor: NAVY },
  th: { color: '#fff', fontSize: 7.5, paddingVertical: 6, paddingHorizontal: 4, fontWeight: 'bold' },
  tRow: { flexDirection: 'row', borderBottom: '1px solid #dddddd' },
  td: { fontSize: 8.5, paddingVertical: 7, paddingHorizontal: 4 },
  cSr: { width: '4%' },
  cDesc: { width: '26%' },
  cHsn: { width: '9%' },
  cQty: { width: '6%', textAlign: 'right' },
  cTaxable: { width: '15%', textAlign: 'right' },
  cGst: { width: '14%', textAlign: 'right' },
  cIgst: { width: '11%', textAlign: 'right' },
  cTotal: { width: '15%', textAlign: 'right' },

  // Totals
  totals: { width: 250, alignSelf: 'flex-end', marginTop: 18 },
  tLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 9.5, color: '#333' },
  tGrand: { flexDirection: 'row', justifyContent: 'space-between', borderTop: `2px solid ${NAVY}`, marginTop: 5, paddingTop: 8 },
  tGrandLabel: { fontSize: 12, fontWeight: 'bold', color: NAVY },
  tGrandVal: { fontSize: 12, fontWeight: 'bold', color: STEEL },
  dueLine: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f2f5f8', paddingVertical: 5, paddingHorizontal: 4, marginTop: 6, fontSize: 9.5, fontWeight: 'bold', color: NAVY },

  words: { fontSize: 9, color: '#444', marginTop: 18, borderTop: '1px solid #eeeeee', paddingTop: 10 },

  // Footer
  foot: { flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid #cccccc', paddingTop: 14, marginTop: 22 },
  footH: { fontSize: 8, color: '#888', letterSpacing: 0.6, marginBottom: 4 },
  footMeta: { fontSize: 9, lineHeight: 1.6, color: '#333' },
  signWrap: { width: '40%', alignItems: 'flex-end' },
  signFor: { fontSize: 9, fontWeight: 'bold', color: '#111' },
  signBox: { marginTop: 42, borderTop: '1px solid #999999', paddingTop: 4, width: 150, textAlign: 'center', color: '#555', fontSize: 9 },
  note: { fontSize: 8, color: '#888', marginTop: 16, textAlign: 'center' },
});

export const OrderPDF = ({ order }: { order: any }) => {
  const items: any[] = order?.items || [];
  const taxDetails = order?.tax_details || {};

  const rawAddr = order?.billing_address || order?.shipping_address || {};
  const address = {
    fullName: rawAddr.fullName || rawAddr.name || order?.full_name || 'Guest',
    line1: rawAddr.addressLine1 || rawAddr.address || '',
    city: rawAddr.city || '',
    state: rawAddr.state || '',
    pincode: rawAddr.pincode || '',
  };
  const shipState = order?.shipping_address?.state || address.state || '';
  const date = new Date(order?.created_at || Date.now()).toLocaleDateString('en-IN');

  const COMPANY_STATE = 'punjab';
  const supplyState = String(shipState).trim().toLowerCase();
  const isInterState = supplyState ? supplyState !== COMPANY_STATE : (taxDetails.igst > 0);

  // --- DISCOUNT DISTRIBUTION (prices are GST-inclusive; coupon spread pro-rata) ---
  const grandTotal = Number(order?.total_amount || 0);
  const grossSubtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const orderDiscount = Number(order?.discount) > 0 ? Number(order.discount) : Math.max(0, round2(grossSubtotal - grandTotal));
  const netItemsIncl = Math.max(0, grossSubtotal - orderDiscount);
  const discountRatio = grossSubtotal > 0 ? netItemsIncl / grossSubtotal : 1;
  const shippingIncl = round2(Math.max(0, grandTotal - netItemsIncl));

  // Per-line taxable + tax split (discounted).
  const rows = items.map((it) => {
    const qty = Number(it.quantity) || 1;
    const inclLine = (Number(it.price) || 0) * qty * discountRatio; // discounted, incl. GST
    const taxable = round2(inclLine / 1.18);
    const gst = round2(taxable * 0.18);
    return {
      name: it.configurator_name || it.name || 'Item',
      hsn: it.hsn_code || '8471',
      qty,
      taxable,
      cgstSgst: isInterState ? 0 : gst,
      igst: isInterState ? gst : 0,
      total: round2(taxable + gst),
    };
  });
  if (shippingIncl > 0) {
    const taxable = round2(shippingIncl / 1.18);
    const gst = round2(taxable * 0.18);
    rows.push({
      name: 'Shipping & Handling', hsn: '9968', qty: 1, taxable,
      cgstSgst: isInterState ? 0 : gst, igst: isInterState ? gst : 0, total: round2(taxable + gst),
    });
  }

  const totalTaxable = round2(rows.reduce((s, r) => s + r.taxable, 0));
  const totalGst = round2(grandTotal - totalTaxable);
  const cgst = isInterState ? 0 : round2(totalGst / 2);
  const sgst = isInterState ? 0 : round2(totalGst / 2);
  const igst = isInterState ? totalGst : 0;

  const mode = order?.payment_mode;
  const amountPaid =
    mode === 'ONLINE' || mode === 'AMAZON_PAY'
      ? grandTotal
      : mode === 'PARTIAL_COD'
      ? (Number(order?.amount_paid) || round2(grandTotal * 0.1))
      : (Number(order?.amount_paid) || 0);
  const balanceDue = round2(grandTotal - amountPaid);
  const paymentLabel =
    mode === 'PARTIAL_COD' ? 'Partial COD' : mode === 'ONLINE' ? 'Online / UPI' : mode === 'AMAZON_PAY' ? 'Amazon Pay' : 'Cash on Delivery';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src="/icons/logo.png" />
            <Text style={styles.bizMeta}>MCB Z2 12267, Sahibzada Jujhar Singh Nagar,</Text>
            <Text style={styles.bizMeta}>Street No. 3A, Bathinda, Punjab, India - 151001</Text>
            <Text style={styles.bizMeta}><Text style={styles.bizStrong}>GSTIN:</Text> 03PPSPS3291K1ZV   <Text style={styles.bizStrong}>PAN:</Text> PPSPS3291K</Text>
            <Text style={styles.bizMeta}><Text style={styles.bizStrong}>Phone:</Text> +91 7707801014</Text>
            <Text style={styles.bizMeta}><Text style={styles.bizStrong}>Email:</Text> info@rigbuilders.in</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>TAX INVOICE</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Invoice No: </Text>{order?.invoice_no || 'PENDING'}</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Order ID: </Text>{order?.display_id || '-'}</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Date: </Text>{date}</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Place of Supply: </Text>{address.state || '-'}</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Payment: </Text>{paymentLabel}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.parties}>
          <View style={styles.blockLeft}>
            <Text style={styles.blockH}>BILLED TO</Text>
            <Text style={styles.blockName}>{address.fullName}</Text>
            <Text style={styles.blockMeta}>{address.line1}</Text>
            <Text style={styles.blockMeta}>{address.city}, {address.state} - {address.pincode}</Text>
          </View>
          <View style={styles.blockRight}>
            <Text style={styles.blockH}>SHIPPED TO</Text>
            <Text style={styles.blockName}>{address.fullName}</Text>
            <Text style={[styles.blockMeta, { textAlign: 'right' }]}>{address.line1}</Text>
            <Text style={[styles.blockMeta, { textAlign: 'right' }]}>{address.city}, {address.state} - {address.pincode}</Text>
            <Text style={[styles.blockMeta, { color: '#888', marginTop: 3, textAlign: 'right' }]}>
              {isInterState ? 'Inter-state supply — IGST' : 'Intra-state supply — CGST + SGST'}
            </Text>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View>
          <View style={styles.tHead}>
            <Text style={[styles.th, styles.cSr]}>#</Text>
            <Text style={[styles.th, styles.cDesc]}>DESCRIPTION</Text>
            <Text style={[styles.th, styles.cHsn]}>HSN/SAC</Text>
            <Text style={[styles.th, styles.cQty]}>QTY</Text>
            <Text style={[styles.th, styles.cTaxable]}>TAXABLE</Text>
            <Text style={[styles.th, styles.cGst]}>CGST/SGST</Text>
            <Text style={[styles.th, styles.cIgst]}>IGST</Text>
            <Text style={[styles.th, styles.cTotal]}>TOTAL</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={styles.tRow}>
              <Text style={[styles.td, styles.cSr]}>{i + 1}</Text>
              <Text style={[styles.td, styles.cDesc]}>{r.name}</Text>
              <Text style={[styles.td, styles.cHsn]}>{r.hsn}</Text>
              <Text style={[styles.td, styles.cQty]}>{r.qty}</Text>
              <Text style={[styles.td, styles.cTaxable]}>{inr(r.taxable)}</Text>
              <Text style={[styles.td, styles.cGst]}>{inrOrDash(r.cgstSgst)}</Text>
              <Text style={[styles.td, styles.cIgst]}>{inrOrDash(r.igst)}</Text>
              <Text style={[styles.td, styles.cTotal]}>{inr(r.total)}</Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totals}>
          <View style={styles.tLine}><Text>Total Taxable Value</Text><Text>₹ {inr(totalTaxable)}</Text></View>
          {isInterState ? (
            <View style={styles.tLine}><Text>IGST @ 18%</Text><Text>₹ {inr(igst)}</Text></View>
          ) : (
            <>
              <View style={styles.tLine}><Text>CGST @ 9%</Text><Text>₹ {inr(cgst)}</Text></View>
              <View style={styles.tLine}><Text>SGST @ 9%</Text><Text>₹ {inr(sgst)}</Text></View>
            </>
          )}
          <View style={styles.tGrand}>
            <Text style={styles.tGrandLabel}>Grand Total</Text>
            <Text style={styles.tGrandVal}>₹ {inr(grandTotal)}</Text>
          </View>
          {balanceDue > 0 && (
            <View style={styles.dueLine}>
              <Text>Payable on Delivery (COD)</Text>
              <Text>₹ {inr(balanceDue)}</Text>
            </View>
          )}
        </View>

        {/* AMOUNT IN WORDS */}
        <Text style={styles.words}>Amount in words: Rupees {numToWords(grandTotal)} Only</Text>

        {/* FOOTER */}
        <View style={styles.foot}>
          <View style={{ width: '55%' }}>
            <Text style={styles.footH}>BANK DETAILS</Text>
            <Text style={styles.footMeta}>Punjab National Bank, Civil Lines, Bathinda</Text>
            <Text style={styles.footMeta}>A/C No: 0730102100000998</Text>
            <Text style={styles.footMeta}>IFSC: PUNB0073010</Text>
          </View>
          <View style={styles.signWrap}>
            <Text style={styles.signFor}>For Rig Builders</Text>
            <Text style={styles.signBox}>Authorised Signatory</Text>
          </View>
        </View>

        <Text style={styles.note}>Tax is not payable under reverse charges.</Text>
      </Page>
    </Document>
  );
};
