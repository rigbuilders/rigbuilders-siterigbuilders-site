import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

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
  headerLeft: { width: '55%', padding: 10 },
  headerRight: { width: '45%' },
  titleBox: { height: 35, justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #000' },
  titleText: { fontSize: 14, fontWeight: 'bold' },
  logo: { width: 120, marginBottom: 5 },
  labelBold: { fontSize: 8, fontWeight: 'bold', marginTop: 3 },
  textNormal: { fontSize: 8 },
  rightInfoBox: { padding: 10, justifyContent: 'center' },
  idStrip: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: 'transparent' },
  idCol: { width: '33.33%', padding: 5, borderRight: '1px solid #000' },
  idText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: 'transparent', height: 20, alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 18, alignItems: 'center' },
  th: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid #000', height: '100%', padding: 2 },
  td: { fontSize: 8, textAlign: 'center', borderRight: '1px solid #000', height: '100%', padding: 2 },
  colSr: { width: '5%' },
  colDesc: { width: '30%', textAlign: 'left', paddingLeft: 4 },
  colHsn: { width: '10%' },
  colQty: { width: '5%' },
  colUnit: { width: '5%' },
  colPrice: { width: '10%' },
  colTax: { width: '9%' },
  colTax2: { width: '9%' },
  colTax3: { width: '9%' },
  colTotal: { width: '13%', borderRight: 'none' },
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
  // FIX: Check billing_address OR shipping_address
  // FIX: Handle both Database format (name/address) and PDF format (fullName/addressLine1)
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
            {/* 1. HEADER */}
            {/* CALCULATE SPLITS FOR PDF */}
            {(() => {
                const total = Number(order?.total_amount || 0);
                let advance = 0;
                let balance = 0;

                // Logic: Determine how much is already paid vs due
                if (order?.payment_mode === 'PARTIAL_COD') {
                    // If DB has 'amount_paid', use it. Otherwise assume 10%.
                    advance = Number(order.amount_paid) || Math.round(total * 0.10);
                    balance = total - advance;
                } else if (order?.payment_mode === 'ONLINE' || order?.payment_mode === 'AMAZON_PAY') {
                    advance = total;
                    balance = 0;
                } else {
                    // Full COD case
                    advance = 0;
                    balance = total;
                }

                return (
                    <View>
                        {/* 1. GRAND TOTAL ROW */}
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

                        {/* 2. SHOW SPLIT IF PARTIAL COD (Crucial for Courier) */}
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

            {/* 2. ID STRIP */}
            <View style={styles.idStrip}>
                <View style={styles.idCol}><Text style={styles.idText}>DATE : {date}</Text></View>
                <View style={styles.idCol}><Text style={styles.idText}>INVOICE NO : {order?.invoice_no || "PENDING"}</Text></View>
                <View style={[styles.idCol, { borderRight: 'none' }]}><Text style={styles.idText}>ORDER ID : {order?.display_id}</Text></View>
            </View>

            {/* 3. TABLE */}
            <View>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colSr]}>SR</Text>
                    <Text style={[styles.th, styles.colDesc]}>PRODUCT DESCRIPTION</Text>
                    <Text style={[styles.th, styles.colHsn]}>HSN/SAC</Text>
                    <Text style={[styles.th, styles.colQty]}>QTY</Text>
                    <Text style={[styles.th, styles.colUnit]}>UNIT</Text>
                    <Text style={[styles.th, styles.colPrice]}>PRICE</Text>
                    <Text style={[styles.th, styles.colTax]}>CGST</Text>
                    <Text style={[styles.th, styles.colTax2]}>SGST</Text>
                    <Text style={[styles.th, styles.colTax3]}>IGST</Text>
                    <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
                </View>

                {items.map((item: any, i: number) => {
                    // 1. Get Values & Handle "NaN" safety
                    const unitPrice = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1; 

                    // 2. GST Calculation (No Math.round)
                    // We keep the exact decimal values for calculation
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
                            
                            {/* 3. Display with .toFixed(2) for 2 decimal places */}
                            <Text style={[styles.td, styles.colPrice]}>
                                {basicPrice.toFixed(2)}
                            </Text>

                            {/* CGST (Half of Tax) */}
                            <Text style={[styles.td, styles.colTax]}>
                                {isInterState ? "0.00" : (totalTaxAmt / 2).toFixed(2)}
                            </Text>

                            {/* SGST (Half of Tax) */}
                            <Text style={[styles.td, styles.colTax2]}>
                                {isInterState ? "0.00" : (totalTaxAmt / 2).toFixed(2)}
                            </Text>

                            {/* IGST (Full Tax if Interstate) */}
                            <Text style={[styles.td, styles.colTax3]}>
                                {isInterState ? totalTaxAmt.toFixed(2) : "0.00"}
                            </Text>

                            <Text style={[styles.td, styles.colTotal, { borderRight: 'none' }]}>
                                {totalLine.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                    );
                })}
                
                <View style={[styles.tableRow, { height: 100 }]} />
                
                <View style={styles.totalRow}>
                    <View style={{ width: '87%', paddingRight: 10 }}>
                        <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>GRAND TOTAL</Text>
                    </View>
                    <View style={{ width: '13%' }}>
                        <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {/* FIX: Ensure number format */}
                            {Number(order?.total_amount || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 4. AMOUNT IN WORDS */}
            <View style={[styles.borderBottom, { padding: 5 }]}>
                <Text style={styles.labelBold}>AMOUNT IN WORDS : <Text style={{ fontWeight: 'normal' }}>{numberToWords(order?.total_amount || 0).toUpperCase()} RUPEES ONLY</Text></Text>
            </View>

            {/* 5. ADDRESSES (Fixed Variable) */}
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

            {/* 6. TERMS & SIGNATORY */}
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

            {/* 7. BANK */}
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