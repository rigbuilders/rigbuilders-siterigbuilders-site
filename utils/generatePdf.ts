import jsPDF from "jspdf";

// Helper: Loads image, resizes it, and converts to compressed JPEG to save space
const loadCompressedImage = (url: string, maxWidth = 1000): Promise<{ data: string, width: number, height: number } | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    
    img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too big (Max width logic)
        if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
            // Fill white background (transparency becomes black in JPEG otherwise)
            // For icons with transparency, we might want PNG, but for file size JPEG is king.
            // If your icons have transparent backgrounds, we can assume a dark grey fill to match footer
            ctx.fillStyle = "#121212"; 
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Export as compressed JPEG (Quality 0.7 = 70%)
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve({ data: dataUrl, width, height });
        } else {
            resolve(null);
        }
    };

    img.onerror = () => {
        console.warn(`Failed to load PDF image: ${url}`);
        resolve(null);
    };
  });
};

// Helper: Fetches font file and converts to base64 for jsPDF
const loadFont = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Font fetch failed: ${url}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix to get raw base64
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => {
          console.error("FileReader error");
          resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load font:", url, e);
    return null;
  }
};

export const generateSpecSheetPDF = async (config: any) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // --- 1. BACKGROUND ---
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // --- 2. PRELOAD ASSETS (Images + Local Fonts) ---
  const logoPath = "/icons/navbar/logo.png"; 
  const defaultRigPath = "/images/Default custom rig/3.jpg";
  const rigImagePath = config.specs?.cabinet?.image || defaultRigPath;
  
  // Footer Icons
  const phoneIconPath = "/icons/ConfigPDF/1.png";
  const emailIconPath = "/icons/ConfigPDF/2.png";
  const webIconPath = "/icons/ConfigPDF/3.png";

  // CHANGED: Fonts are now loaded from local public/fonts folder
  const fontRegUrl = "/fonts/Saira-Regular.ttf";
  const fontBoldUrl = "/fonts/Saira-Bold.ttf";

  try {
      // Load EVERYTHING in parallel
      const [logoObj, rigObj, phoneObj, emailObj, webObj, fontReg, fontBold] = await Promise.all([
          loadCompressedImage(logoPath, 500),
          loadCompressedImage(rigImagePath, 1200),
          loadCompressedImage(phoneIconPath, 100),
          loadCompressedImage(emailIconPath, 100),
          loadCompressedImage(webIconPath, 100),
          loadFont(fontRegUrl),
          loadFont(fontBoldUrl)
      ]);

      // --- REGISTER FONTS ---
      let fontName = "helvetica"; // Default fallback
      
      if (fontReg) {
          doc.addFileToVFS("Saira-Regular.ttf", fontReg);
          doc.addFont("Saira-Regular.ttf", "Saira", "normal");
          fontName = "Saira";
      }
      if (fontBold) {
          doc.addFileToVFS("Saira-Bold.ttf", fontBold);
          doc.addFont("Saira-Bold.ttf", "Saira", "bold");
      }

      // --- 3. HEADER ---
      if (logoObj) {
          const displayWidth = 40; 
          const displayHeight = (logoObj.height / logoObj.width) * displayWidth;
          doc.addImage(logoObj.data, "JPEG", margin, 10, displayWidth, displayHeight, undefined, 'FAST');
      } else {
          doc.setFont(fontName, "bold");
          doc.setFontSize(24);
          doc.setTextColor(255, 255, 255);
          doc.text("RIG BUILDERS", margin, 20);
      }

      // Title / Date
      doc.setFont(fontName, "normal");
      doc.setFontSize(10);
      doc.setTextColor(160, 160, 160);
      doc.text(`Configuration: ${config.name || "Custom Build"}`, pageWidth - margin, 15, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 20, { align: "right" });

      // --- 4. MAIN VISUAL ---
      let currentY = 35;
      
      if (rigObj) {
          doc.setFillColor(26, 26, 26);
          doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 80, 3, 3, "F");
          
          const imgContainerHeight = 80;
          const imgContainerWidth = pageWidth - (margin * 2);
          const scaleFactor = Math.min(imgContainerWidth / rigObj.width, imgContainerHeight / rigObj.height) * 0.9; 
          const drawW = rigObj.width * scaleFactor;
          const drawH = rigObj.height * scaleFactor;
          const centerX = margin + (imgContainerWidth - drawW) / 2;
          const centerY = currentY + (imgContainerHeight - drawH) / 2;

          doc.addImage(rigObj.data, "JPEG", centerX, centerY, drawW, drawH, undefined, 'FAST');
          currentY += 90;
      }

      // --- 5. SPECS GRID ---
      doc.setFont(fontName, "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("HARDWARE MANIFEST", margin, currentY);
      currentY += 8;

      const colGap = 5;
      const cardHeight = 20;
      const colWidth = (pageWidth - (margin * 2) - colGap) / 2;
      
      const specsList = [
          { label: "PROCESSOR", val: config.specs?.cpu?.name },
          { label: "GRAPHICS CARD", val: config.specs?.gpu?.name },
          { label: "MOTHERBOARD", val: config.specs?.motherboard?.name },
          { label: "MEMORY", val: config.specs?.ram?.name },
          { label: "STORAGE", val: config.specs?.storage?.name },
          { label: "COOLING", val: config.specs?.cooler?.name },
          { label: "POWER SUPPLY", val: config.specs?.psu?.name },
          { label: "CABINET", val: config.specs?.cabinet?.name },
          { label: "MONITOR", val: config.specs?.monitor?.name },
      ].filter(item => item.val);

      doc.setFontSize(8);

      specsList.forEach((item, i) => {
          if (currentY + cardHeight > pageHeight - 40) {
              doc.addPage();
              doc.setFillColor(18, 18, 18);
              doc.rect(0, 0, pageWidth, pageHeight, "F");
              currentY = 20;
          }

          const isLeftCol = i % 2 === 0;
          const xPos = isLeftCol ? margin : margin + colWidth + colGap;
          
          doc.setFillColor(26, 26, 26);
          doc.setDrawColor(50, 50, 50);
          doc.roundedRect(xPos, currentY, colWidth, cardHeight, 2, 2, "FD");

          doc.setTextColor(120, 75, 185); 
          doc.setFont(fontName, "bold");
          doc.setFontSize(6);
          doc.text(item.label, xPos + 4, currentY + 6);

          doc.setTextColor(255, 255, 255);
          doc.setFont(fontName, "normal");
          doc.setFontSize(9);
          
          const maxTextWidth = colWidth - 8;
          let text = item.val || "-";
          if (doc.getTextWidth(text) > maxTextWidth) {
              text = doc.splitTextToSize(text, maxTextWidth)[0] + "...";
          }
          doc.text(text, xPos + 4, currentY + 14);

          if (!isLeftCol) currentY += cardHeight + 4;
      });

      if (specsList.length % 2 !== 0) currentY += cardHeight + 4;

      // --- 6. PRICE ---
      currentY += 5;
      doc.setDrawColor(120, 75, 185);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setTextColor(160, 160, 160);
      doc.text("TOTAL ESTIMATE", margin, currentY + 5);
      
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      const priceString = `Rs. ${Number(config.total_price || config.price).toLocaleString("en-IN")}`;
      doc.text(priceString, pageWidth - margin, currentY + 5, { align: "right" });

      // --- 7. FOOTER ---
      const footerY = pageHeight - 30;
      doc.setFillColor(10, 10, 10);
      doc.rect(0, footerY, pageWidth, 30, "F");
      
      doc.setFontSize(8);
      doc.setFont(fontName, "normal");
      doc.setTextColor(200, 200, 200);

      const iconSize = 6; 
      const textY = footerY + 20;
      const iconY = footerY + 8;

      if (emailObj) doc.addImage(emailObj.data, "JPEG", 40, iconY, iconSize, iconSize, undefined, 'FAST');
      doc.text("info@rigbuilders.in", 43, textY, { align: "center" });

      if (phoneObj) doc.addImage(phoneObj.data, "JPEG", (pageWidth / 2) - (iconSize/2), iconY, iconSize, iconSize, undefined, 'FAST');
      doc.text("+91 7707801014", pageWidth / 2, textY, { align: "center" });

      if (webObj) doc.addImage(webObj.data, "JPEG", pageWidth - 46, iconY, iconSize, iconSize, undefined, 'FAST');
      doc.text("www.rigbuilders.in", pageWidth - 43, textY, { align: "center" });

      doc.save(`RigBuilders_Config_${config.id || "Custom"}.pdf`);

  } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Could not generate PDF. Please try again.");
  }
};