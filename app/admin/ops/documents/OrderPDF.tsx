import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// --- REGISTER FONT (Optional but recommended for bold/italics) ---
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
//     { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
//   ]
// });


// --- UTILS: NUMBER TO WORDS ---
const numberToWords = (n: number): string => {
  if (n < 0) return "Negative";
  if (n === 0) return "Zero";
  
  const single = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const formatTenth = (n: number): string => {
    let s = n.toString();
    let t = parseInt(s.substring(0, 1));
    let u = parseInt(s.substring(1));
    if (t === 1) return double[u];
    return tens[t] + (u === 0 ? '' : ' ' + single[u]);
  }

  if (n < 10) return single[n];
  if (n < 20) return double[n % 10];
  if (n < 100) return formatTenth(n);
  if (n < 1000) return single[Math.floor(n / 100)] + ' Hundred ' + (n % 100 === 0 ? '' : ' and ' + numberToWords(n % 100));
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 === 0 ? '' : ' ' + numberToWords(n % 1000));
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + ' Lakh ' + (n % 100000 === 0 ? '' : ' ' + numberToWords(n % 100000));
  return numberToWords(Math.floor(n / 10000000)) + ' Crore ' + (n % 10000000 === 0 ? '' : ' ' + numberToWords(n % 10000000));
}

// --- STYLES ---
const styles = StyleSheet.create({
  page: { padding: 25, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.3 },
  container: { border: '1px solid #000' },
  row: { flexDirection: 'row' },
  borderBottom: { borderBottom: '1px solid #000' },
  borderRight: { borderRight: '1px solid #000' },
  
  // HEADER STYLES
  headerTopSplit: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 110 },
  headerLeft: { width: '60%', padding: 12, borderRight: '1px solid #000' },
  headerRight: { width: '40%', flexDirection: 'column' }, // Removed padding to allow edge-to-edge borders inside
  logo: { width: 140, marginBottom: 8 },

  labelBold: { fontSize: 8, fontWeight: 'bold', marginTop: 3 },
  textNormal: { fontSize: 8 },

  // TAX INVOICE TITLE & META BOXES
  taxInvoiceBox: { padding: 10, borderBottom: '1px solid #000', alignItems: 'center', justifyContent: 'center' },
  taxInvoiceTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  metaInfoBox: { padding: 12, flex: 1, justifyContent: 'center' },
  metaLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  metaValue: { fontSize: 9, marginBottom: 8 },
  // ID STRIP
  idStrip: { flexDirection: 'row', borderBottom: '1px solid #000' },
  idCol: { width: '33.33%', padding: 5, borderRight: '1px solid #000' },
  idText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },

  // TABLE STYLES
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0', height: 25, alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 18, alignItems: 'center' },
  th: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid #000', height: '100%', padding: 4, justifyContent: 'center', display: 'flex', flexDirection: 'column' },
  td: { fontSize: 8, textAlign: 'center', borderRight: '1px solid #000', height: '100%', padding: 2 },
  
  // Column Widths
  colSr: { width: '5%' },
  colDesc: { width: '30%', textAlign: 'left', paddingLeft: 4 },
  colHsn: { width: '10%' },
  colQty: { width: '5%' },
  colUnit: { width: '5%' },
  colPrice: { width: '10%' },
  colTax: { width: '9%' },
  colTotal: { width: '13%', borderRight: 'none' },

  // FOOTER STYLES
  totalRow: { flexDirection: 'row', borderBottom: '1px solid #000', height: 20, alignItems: 'center' },
  footerSplit: { flexDirection: 'row', borderBottom: '1px solid #000' },
  footerHalf: { width: '50%', padding: 8 },
  termsRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 80 },
  termsBox: { width: '50%', padding: 8, borderRight: '1px solid #000' },
  signBox: { width: '50%', padding: 8, justifyContent: 'space-between', alignItems: 'flex-end' },
  bankBox: { padding: 8, textAlign: 'center' },
  noteBox: { borderTop: '1px solid #000', padding: 5, textAlign: 'center' }
});

export const OrderPDF = ({ order }: { order: any }) => {
  const items = order?.items || [];
  const taxDetails = order?.tax_details || {};
  
  const rawAddr = order?.billing_address || order?.shipping_address || {};
  
  const address = {
      fullName: rawAddr.fullName || rawAddr.name || order?.full_name || "Guest",
      addressLine1: rawAddr.addressLine1 || rawAddr.address || "",
      city: rawAddr.city || "",
      state: rawAddr.state || "",
      pincode: rawAddr.pincode || ""
  };
  const date = new Date(order?.created_at || Date.now()).toLocaleDateString('en-IN');
  const isInterState = (taxDetails.igst > 0); 

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
            
          {/* 1. HEADER SECTION (SPLIT 60/40) */}
            <View style={styles.headerTopSplit}>
                {/* LEFT SIDE: LOGO, ADDRESS, GSTIN, CONTACT */}
                <View style={styles.headerLeft}>
                    <Image style={styles.logo} src="/icons/logo.png" />
                    <Text style={styles.textNormal}><Text style={styles.labelBold}>ADDRESS: </Text>MCB Z2 12267, SAHIBZADA JUJHAR SINGH NAGAR,</Text>
                    <Text style={styles.textNormal}>STREET NO. 3A, BATHINDA, PUNJAB, INDIA - 151001</Text>
                    <Text style={{ fontSize: 9, marginTop: 4 }}><Text style={{ fontWeight: 'bold' }}>GSTIN: </Text>03PPSPS3291K1ZV</Text>
                    <Text style={{ fontSize: 9, marginTop: 4 }}><Text style={{ fontWeight: 'bold' }}>PHONE: </Text>+91 7707801014</Text>
                    <Text style={{ fontSize: 9, marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>EMAIL: </Text>info@rigbuilders.in</Text>
                </View>

                {/* RIGHT SIDE: TAX INVOICE TITLE & ORDER META INFO */}
                <View style={styles.headerRight}>
                    {/* TITLE BOX WITH BOTTOM BORDER */}
                    <View style={styles.taxInvoiceBox}>
                        <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
                    </View>
                    
                    {/* STACKED META INFO */}
                    <View style={styles.metaInfoBox}>
                        <Text style={styles.metaLabel}>SALES CHANNEL :</Text>
                        <Text style={styles.metaValue}>ONLINE</Text>
                        
                        <Text style={styles.metaLabel}>PAYMENT MODE :</Text>
                        <Text style={styles.metaValue}>
                            {order?.payment_mode === 'PARTIAL_COD' ? 'PARTIAL COD' : order?.payment_mode === 'ONLINE' ? 'ONLINE/UPI' : 'COD'}
                        </Text>
                        
                        <Text style={styles.metaLabel}>DELIVERY MODE :</Text>
                        <Text style={[styles.metaValue, { marginBottom: 0 }]}>COURIER</Text>
                    </View>
                </View>
            </View>

            {/* 2. ID STRIP (Proceed directly to ID Strip) */}
            <View style={styles.idStrip}>
                <View style={styles.idCol}><Text style={styles.idText}>DATE : {date}</Text></View>
                <View style={styles.idCol}><Text style={styles.idText}>INVOICE NO : {order?.invoice_no || "PENDING"}</Text></View>
                <View style={[styles.idCol, { borderRight: 'none' }]}><Text style={styles.idText}>ORDER ID : {order?.display_id}</Text></View>
            </View>

            {/* 4. ITEMS TABLE */}
            <View>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colSr]}>SR</Text>
                    <Text style={[styles.th, styles.colDesc]}>PRODUCT DESCRIPTION</Text>
                    <Text style={[styles.th, styles.colHsn]}>HSN/SAC</Text>
                    <Text style={[styles.th, styles.colQty]}>QTY</Text>
                    <Text style={[styles.th, styles.colUnit]}>UNIT</Text>
                    <Text style={[styles.th, styles.colPrice]}>PRICE</Text>
                    <Text style={[styles.th, styles.colTax]}>CGST</Text>
                    <Text style={[styles.th, styles.colTax]}>SGST</Text>
                    <Text style={[styles.th, styles.colTax]}>IGST</Text>
                    <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
                </View>

                {items.map((item: any, i: number) => {
                    const unitPrice = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1; 

                    const basicPrice = unitPrice / 1.18;
                    const totalTaxAmt = unitPrice - basicPrice;
                    const totalLine = unitPrice * qty;

                    return (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.td, styles.colSr]}>{i + 1}</Text>
                            <Text style={[styles.td, styles.colDesc]}>{item.name}</Text>
                            <Text style={[styles.td, styles.colHsn]}>{item.hsn_code || '8471'}</Text>
                            <Text style={[styles.td, styles.colQty]}>{qty}</Text>
                            <Text style={[styles.td, styles.colUnit]}>PCS</Text>
                            <Text style={[styles.td, styles.colPrice]}>{basicPrice.toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colTax]}>{isInterState ? "0.00" : (totalTaxAmt / 2).toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colTax]}>{isInterState ? "0.00" : (totalTaxAmt / 2).toFixed(2)}</Text>
                            <Text style={[styles.td, styles.colTax]}>{isInterState ? totalTaxAmt.toFixed(2) : "0.00"}</Text>
                            <Text style={[styles.td, styles.colTotal, { borderRight: 'none' }]}>
                                {totalLine.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                    );
                })}
                
                {/* Minimum height filler row */}
                <View style={[styles.tableRow, { height: 100 }]} />
                
                {/* 5. TOTALS CALCULATION BLOCK */}
                {(() => {
                    const total = Number(order?.total_amount || 0);
                    let advance = 0;
                    let balance = 0;

                    if (order?.payment_mode === 'PARTIAL_COD') {
                        advance = Number(order.amount_paid) || Math.round(total * 0.10);
                        balance = total - advance;
                    } else if (order?.payment_mode === 'ONLINE' || order?.payment_mode === 'AMAZON_PAY') {
                        advance = total;
                        balance = 0;
                    } else {
                        advance = 0;
                        balance = total;
                    }

                    return (
                        <View>
                            <View style={styles.totalRow}>
                                <View style={{ width: '87%', paddingRight: 10 }}>
                                    <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>GRAND TOTAL</Text>
                                </View>
                                <View style={{ width: '13%' }}>
                                    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                        {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>
                            </View>

                            {/* SHOW SPLIT IF PARTIAL COD */}
                            {order?.payment_mode === 'PARTIAL_COD' && (
                                <>
                                    <View style={[styles.row, { borderBottom: '1px solid #000', height: 20, alignItems: 'center' }]}>
                                        <View style={{ width: '87%', paddingRight: 10 }}>
                                            <Text style={{ textAlign: 'right', fontSize: 8 }}>LESS: ADVANCE RECEIVED</Text>
                                        </View>
                                        <View style={{ width: '13%' }}>
                                            <Text style={{ textAlign: 'center', fontSize: 8 }}>
                                                {advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row, { borderBottom: '1px solid #000', height: 20, alignItems: 'center', backgroundColor: '#e0e0e0' }]}>
                                        <View style={{ width: '87%', paddingRight: 10 }}>
                                            <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>BALANCE DUE (COD)</Text>
                                        </View>
                                        <View style={{ width: '13%' }}>
                                            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    );
                })()}
            </View>

            {/* 6. AMOUNT IN WORDS */}
            <View style={[styles.borderBottom, { padding: 5 }]}>
                <Text style={styles.labelBold}>AMOUNT IN WORDS : <Text style={{ fontWeight: 'normal' }}>{numberToWords(order?.total_amount || 0).toUpperCase()} RUPEES ONLY</Text></Text>
            </View>

            {/* 7. ADDRESSES FOOTER */}
            <View style={styles.footerSplit}>
                <View style={[styles.footerHalf, styles.borderRight]}>
                    <Text style={styles.labelBold}>BILLED TO :</Text>
                    <Text style={styles.textNormal}>{address.fullName}</Text>
                    <Text style={styles.textNormal}>{address.addressLine1}</Text>
                    <Text style={styles.textNormal}>{address.city}, {address.state} - {address.pincode}</Text>
                </View>
                <View style={styles.footerHalf}>
                    <Text style={styles.labelBold}>SHIPPED TO :</Text>
                    <Text style={styles.textNormal}>{address.fullName}</Text>
                    <Text style={styles.textNormal}>{address.addressLine1}</Text>
                    <Text style={styles.textNormal}>{address.city}, {address.state} - {address.pincode}</Text>
                </View>
            </View>

            {/* 8. TERMS & SIGNATORY */}
            <View style={styles.termsRow}>
                <View style={styles.termsBox}>
                    <Text style={styles.labelBold}>TERMS & CONDITIONS :</Text>
                    <Text style={{ fontSize: 7, marginTop: 2 }}>1. Every Product is backed by Manufacturer's Warranty.</Text>
                    <Text style={{ fontSize: 7, marginTop: 1 }}>2. Returns are only accepted under transit damage with unboxing video proof.</Text>
                    <Text style={{ fontSize: 7, marginTop: 1 }}>3. All Legal Matters governed by the courts of Bathinda, Punjab.</Text>
                </View>
                <View style={styles.signBox}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>FOR RIG BUILDERS</Text>
                    <Text style={styles.labelBold}>AUTHORIZED SIGNATORY</Text>
                </View>
            </View>

            {/* 9. BANK DETAILS */}
            <View style={styles.bankBox}>
                <Text style={styles.labelBold}>BANK DETAILS :</Text>
                <Text style={styles.textNormal}>BANK NAME : PUNJAB NATIONAL BANK, CIVIL LINES, BATHINDA</Text>
                <Text style={styles.textNormal}>A/C NO : 0730102100000998</Text>
                <Text style={styles.textNormal}>IFSC CODE : PUNB0073010</Text>
            </View>
            
            <View style={styles.noteBox}>
                <Text style={{ fontSize: 7, fontWeight: 'bold' }}>NOTE</Text>
                <Text style={{ fontSize: 7 }}>TAX IS NOT PAYABLE UNDER REVERSE CHARGES</Text>
            </View>
        </View>
      </Page>
    </Document>
  );
};