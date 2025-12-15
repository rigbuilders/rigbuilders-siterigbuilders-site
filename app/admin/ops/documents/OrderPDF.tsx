import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- STYLING ---
const brandColor = '#4E2C8B'; // Rig Builders Purple
const lightGray = '#F5F5F5';
const darkGray = '#333333';
const borderColor = '#E0E0E0';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: darkGray, lineHeight: 1.4 },
  
  // Header Section
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logoContainer: { width: '50%' },
  logoText: { fontSize: 26, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase' },
  logoSub: { fontSize: 8, color: '#666', marginTop: 2 },
  invoiceTitleContainer: { width: '50%', alignItems: 'flex-end', justifyContent: 'center' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: darkGray },
  
  // Info Boxes (Bill To / Invoice Details)
  infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 10 },
  box: { width: '48%' },
  boxTitle: { fontSize: 9, fontWeight: 'bold', color: brandColor, marginBottom: 4, textTransform: 'uppercase' },
  text: { fontSize: 9, marginBottom: 2 },
  
  // Grid Table
  table: { width: '100%', marginBottom: 20, borderWidth: 1, borderColor: borderColor, borderRadius: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: borderColor, minHeight: 24, alignItems: 'center' },
  headerRow: { backgroundColor: brandColor }, // Purple Header
  headerCell: { color: 'white', fontWeight: 'bold', fontSize: 8, padding: 5, textAlign: 'center' },
  cell: { padding: 5, fontSize: 8, textAlign: 'center', color: darkGray },
  
  // Column Widths
  col1: { width: '5%' },  // Sr No
  col2: { width: '45%', textAlign: 'left', paddingLeft: 8 }, // Description
  col3: { width: '15%' }, // HSN/SAC
  col4: { width: '10%' }, // Qty
  col5: { width: '25%', textAlign: 'right', paddingRight: 8 }, // Amount

  // Totals Section
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '40%', marginBottom: 5 },
  totalLabel: { fontWeight: 'bold', fontSize: 9 },
  totalValue: { fontSize: 10 },
  grandTotal: { borderTopWidth: 1, borderTopColor: darkGray, paddingTop: 5, marginTop: 5 },
  grandTotalText: { fontSize: 12, fontWeight: 'bold', color: brandColor },

  // Footer / Bank / Terms
  footerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 10 },
  termsBox: { width: '55%' },
  signBox: { width: '40%', alignItems: 'center', justifyContent: 'flex-end', height: 60 },
  termText: { fontSize: 7, color: '#666', marginBottom: 2 },
  boldTerm: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  
  // Warranty Page Styles
  warrantyCard: { borderWidth: 2, borderColor: brandColor, borderRadius: 8, padding: 20, marginTop: 20 },
  warrantyTitle: { fontSize: 18, fontWeight: 'bold', color: brandColor, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
  serialRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
});

export const OrderPDF = ({ order, items }: { order: any, items: any[] }) => {
  // Safe helper to format currency
  const formatCurrency = (amount: number) => `Rs. ${(amount || 0).toLocaleString("en-IN")}`;

  return (
    <Document>
      {/* --- PAGE 1: TAX INVOICE --- */}
      <Page size="A4" style={styles.page}>
        
        {/* 1. Header with Logo Area */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>RIG BUILDERS</Text>
            <Text style={styles.text}>Tech Hub, Silicon Valley of India</Text>
            <Text style={styles.text}>Bangalore, Karnataka - 560001</Text>
            <Text style={styles.text}>GSTIN: 29AAAAA0000A1Z5</Text>
            <Text style={styles.text}>Email: support@rigbuilders.in</Text>
          </View>
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>Original for Recipient</Text>
          </View>
        </View>

        {/* 2. Billing & Shipping Details */}
        <View style={styles.infoContainer}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Billed To:</Text>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{order.guest_info?.name || "Cash Customer"}</Text>
            <Text style={styles.text}>{order.guest_info?.address || "Counter Sale"}</Text>
            <Text style={styles.text}>Phone: {order.guest_info?.phone}</Text>
            <Text style={styles.text}>Email: {order.guest_info?.email}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Invoice Details:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.text}>Invoice No:</Text>
              <Text style={{ ...styles.text, fontWeight: 'bold' }}>{order.order_display_id}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.text}>Date:</Text>
              <Text style={styles.text}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.text}>Place of Supply:</Text>
              <Text style={styles.text}>Karnataka (29)</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.text}>Payment Mode:</Text>
              <Text style={styles.text}>Online / Prepaid</Text>
            </View>
          </View>
        </View>

        {/* 3. The Product Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, styles.col1]}>#</Text>
            <Text style={[styles.headerCell, styles.col2]}>Item Description</Text>
            <Text style={[styles.headerCell, styles.col3]}>HSN/SAC</Text>
            <Text style={[styles.headerCell, styles.col4]}>Qty</Text>
            <Text style={[styles.headerCell, styles.col5]}>Amount</Text>
          </View>

          {/* Rows */}
          {(items || []).map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, styles.col1]}>{i + 1}</Text>
              <View style={[styles.cell, styles.col2]}>
                  <Text style={{ fontWeight: 'bold' }}>{item.product_name}</Text>
                  <Text style={{ fontSize: 7, color: '#666', marginTop: 2 }}>Cat: {item.category}</Text>
              </View>
              <Text style={[styles.cell, styles.col3]}>8471</Text>
              <Text style={[styles.cell, styles.col4]}>1</Text>
              {/* Note: Showing "Included" for components if part of a build, or calculate split price if needed. 
                  For now using cost_price logic or placeholder if total is aggregated. */}
              <Text style={[styles.cell, styles.col5]}>-</Text>
            </View>
          ))}
        </View>

        {/* 4. Totals & Bank Info */}
        <View style={{ flexDirection: 'row' }}>
            {/* Left Side: Bank Info & Amount in Words */}
            <View style={{ width: '55%' }}>
                <Text style={styles.boldTerm}>Bank Details for NEFT/RTGS:</Text>
                <Text style={styles.text}>Bank Name: HDFC Bank</Text>
                <Text style={styles.text}>A/c Name: RIG BUILDERS TECHNOLOGIES</Text>
                <Text style={styles.text}>A/c No: 50200012345678</Text>
                <Text style={styles.text}>IFSC: HDFC0001234</Text>
                <Text style={styles.text}>Branch: Koramangala, Bangalore</Text>
            </View>

            {/* Right Side: Calculation */}
            <View style={{ width: '45%' }}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Taxable Amount:</Text>
                    {/* Assuming tax included, basic logic for display */}
                    <Text style={styles.totalValue}>{formatCurrency(order.total_amount * 0.82)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>CGST (9%):</Text>
                    <Text style={styles.totalValue}>{formatCurrency(order.total_amount * 0.09)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>SGST (9%):</Text>
                    <Text style={styles.totalValue}>{formatCurrency(order.total_amount * 0.09)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.grandTotalText}>Grand Total:</Text>
                    <Text style={styles.grandTotalText}>{formatCurrency(order.total_amount)}</Text>
                </View>
            </View>
        </View>

        {/* 5. Footer / Signatory */}
        <View style={styles.footerContainer}>
            <View style={styles.termsBox}>
                <Text style={styles.boldTerm}>Terms & Conditions:</Text>
                <Text style={styles.termText}>1. Goods once sold will not be taken back.</Text>
                <Text style={styles.termText}>2. Warranty provided by respective manufacturers.</Text>
                <Text style={styles.termText}>3. Physical damage is not covered under warranty.</Text>
                <Text style={styles.termText}>4. Subject to Bangalore Jurisdiction only.</Text>
            </View>
            <View style={styles.signBox}>
                <Text style={{ fontSize: 8, marginBottom: 30 }}>For RIG BUILDERS</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Authorized Signatory</Text>
            </View>
        </View>

      </Page>

      {/* --- PAGE 2: OFFICIAL WARRANTY SHEET --- */}
      <Page size="A4" style={styles.page}>
         <View style={styles.warrantyCard}>
            <Text style={styles.warrantyTitle}>Rig Builders Warranty Certificate</Text>
            
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 10 }}>This document certifies the hardware configuration for:</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginVertical: 5 }}>Order #{order.order_display_id}</Text>
                {order.build_id && <Text style={{ fontSize: 12, color: brandColor }}>Build ID: {order.build_id}</Text>}
            </View>

            <View style={[styles.row, styles.headerRow, { marginTop: 10 }]}>
                 <Text style={[styles.headerCell, { width: '40%' }]}>Component</Text>
                 <Text style={[styles.headerCell, { width: '40%' }]}>Serial Number (S/N)</Text>
                 <Text style={[styles.headerCell, { width: '20%' }]}>Warranty</Text>
            </View>

            {(items || []).map((item, i) => (
                <View key={i} style={styles.serialRow}>
                    <Text style={{ width: '40%', fontSize: 9 }}>{item.product_name}</Text>
                    <Text style={{ width: '40%', fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{item.serial_number || "PENDING"}</Text>
                    <Text style={{ width: '20%', fontSize: 9, color: 'green' }}>Active</Text>
                </View>
            ))}

            <View style={{ marginTop: 30, padding: 10, backgroundColor: lightGray, borderRadius: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>Important Support Info:</Text>
                <Text style={{ fontSize: 9, marginBottom: 3 }}>• Please retain this sheet for any warranty claims.</Text>
                <Text style={{ fontSize: 9, marginBottom: 3 }}>• For support, email support@rigbuilders.in with your Build ID.</Text>
                <Text style={{ fontSize: 9 }}>• Boxes/accessories for major components (GPU/Mobo) are required for RMA.</Text>
            </View>
         </View>
      </Page>
    </Document>
  );
};