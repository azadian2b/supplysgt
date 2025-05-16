import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';

/**
 * Custom hook for generating and managing 2062 hand receipt PDFs
 */
const usePdfGeneration = (uicCode, uicName) => {
  const [generating, setGenerating] = useState(false);
  const [generatedPdfs, setGeneratedPdfs] = useState([]);
  const client = generateClient();

  // Generate hand receipt number
  const generateHandReceiptNumber = (soldier) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const dateStr = `${year}${month}${day}`;
    const lastName = soldier.lastName.substring(0, 3).toUpperCase();
    const firstName = soldier.firstName.substring(0, 1).toUpperCase();
    
    return `${dateStr}${lastName}${firstName}`;
  };

  // Format item description for 2062 form
  const formatItemDescription = (item) => {
    const name = item.masterData?.commonName || `Item ${item.nsn}`;
    const serialPart = item.serialNumber ? `:${item.serialNumber}` : '';
    const stockPart = item.stockNumber ? ` - ${item.stockNumber}` : '';
    
    return `${name}${serialPart}${stockPart}`;
  };

  // Generate 2062 PDF for a given soldier and their equipment
  const generate2062Pdf = async (soldier, soldierItems) => {
    try {
      // Load the existing fillable PDF form
      const formUrl = `${process.env.PUBLIC_URL}/DA Form 2062.pdf`;
      const formBytes = await fetch(formUrl).then(res => res.arrayBuffer());
      
      // Load the PDF document, ignoring potential encryption
      const pdfDoc = await PDFDocument.load(formBytes, { 
        ignoreEncryption: true 
      });
      
      // Get the form from the document
      const form = pdfDoc.getForm();
      
      // Generate hand receipt number
      const receiptNumber = generateHandReceiptNumber(soldier);
      
      // Fill form fields
      // Main fields
      form.getTextField('form1[0].Page1[0].FROM[0]').setText(`${uicCode} - ${uicName}`);
      form.getTextField('form1[0].Page1[0].TO[0]').setText(`${soldier.rank} ${soldier.lastName}, ${soldier.firstName}`);
      form.getTextField('form1[0].Page1[0].RECPTNR[0]').setText(receiptNumber);
      
      // Item fields
      const maxItemsPerPage = 16; // Based on the form layout
      
      // ---- Group non-serialized, non-stock-numbered items ----
      const groupedItems = {};
      const individualItems = [];
      
      soldierItems.forEach(item => {
        if (!item.serialNumber && !item.stockNumber) {
          // Potentially groupable item
          const key = item.equipmentMasterID;
          if (!groupedItems[key]) {
            groupedItems[key] = {
              ...item, // Use first item as template
              quantity: 0
            };
          }
          groupedItems[key].quantity += 1;
        } else {
          // Individual item (serialized or has stock number)
          individualItems.push({ ...item, quantity: 1 });
        }
      });
      
      // Combine grouped and individual items into the final list for the form
      const formItems = [...Object.values(groupedItems), ...individualItems];
      // Sort for consistent order if needed (optional)
      formItems.sort((a, b) => (a.nsn || '').localeCompare(b.nsn || ''));
      
      // ---- Process items for the form ----
      formItems.forEach((item, index) => {
        // Determine if we're on the first page or need to use overflow fields
        const fieldSuffix = index === 0 ? '' : `_${index}`;
        
        // Account for page overflow
        if (index >= maxItemsPerPage) {
          console.log(`Warning: More than ${maxItemsPerPage} items, some may not fit on the form`);
          // We could handle this by creating additional form pages if needed
          return; // Skip items beyond first page for now
        }
        
        // Fill item fields
        // Stock number (NSN)
        form.getTextField(`form1[0].Page1[0].STOCKNRA${fieldSuffix}[0]`).setText(item.nsn);
        
        // Item description - Set smaller font size
        const description = formatItemDescription(item);
        const descriptionField = form.getTextField(`form1[0].Page1[0].ITEMDESA${fieldSuffix}[0]`);
        descriptionField.setFontSize(8); // Set font size to 8pt
        descriptionField.setText(description);
        
        // Unit of issue
        form.getTextField(`form1[0].Page1[0].UIA${fieldSuffix}[0]`).setText('ea');
        
        // Quantity - Use the calculated quantity
        form.getTextField(`form1[0].Page1[0].QTYAA${fieldSuffix}[0]`).setText(item.quantity.toString());
        //just set quantity authorized to quantity
        form.getTextField(`form1[0].Page1[0].QTYAUTHA${fieldSuffix}[0]`).setText(item.quantity.toString());
      });
      
      // Flatten the form (optional, makes it non-editable)
      form.flatten();
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Convert to data URL for download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const dataUrl = URL.createObjectURL(blob);
      
      return {
        name: `${receiptNumber}_${soldier.lastName}_${soldier.firstName}.pdf`,
        receiptNumber,
        dataUrl,
        blob,
        soldier
      };
    } catch (error) {
      console.error('Error generating PDF for soldier:', soldier.id, error);
      throw error;
    }
  };

  // Generate PDFs for multiple items/soldiers
  const generatePdfs = async (selectedItems, soldiersMap) => {
    try {
      if (selectedItems.length === 0) {
        throw new Error('Please select at least one item to generate hand receipts.');
      }
      
      setGenerating(true);
      
      // Group selected items by soldier
      const itemsBySoldier = {};
      
      selectedItems.forEach(item => {
        if (!itemsBySoldier[item.assignedToID]) {
          itemsBySoldier[item.assignedToID] = [];
        }
        itemsBySoldier[item.assignedToID].push(item);
      });
      
      // Generate a PDF for each soldier
      const pdfFiles = [];
      
      for (const soldierId in itemsBySoldier) {
        const soldier = soldiersMap[soldierId];
        if (!soldier) continue;
        
        const items = itemsBySoldier[soldierId];
        const pdfFile = await generate2062Pdf(soldier, items);
        pdfFiles.push(pdfFile);
      }
      
      setGeneratedPdfs(pdfFiles);
      return pdfFiles;
    } catch (error) {
      console.error('Error generating PDFs:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  // Download a specific PDF
  const downloadPdf = (pdfFile) => {
    const link = document.createElement('a');
    link.href = pdfFile.dataUrl;
    link.download = pdfFile.name;
    link.click();
    
    return pdfFile;
  };

  // Download all generated PDFs
  const downloadAllPdfs = () => {
    if (generatedPdfs.length === 0) {
      throw new Error('No hand receipts have been generated yet.');
    }
    
    generatedPdfs.forEach(pdf => downloadPdf(pdf));
  };

  // Upload PDF to S3 and return the key
  const uploadPdfToS3 = async (pdfFile) => {
    try {
      const key = `hand-receipts/${pdfFile.name}`;
      
      // Upload the PDF to S3
      await uploadData({
        key,
        data: pdfFile.blob,
        options: {
          contentType: 'application/pdf'
        }
      });
      
      return key;
    } catch (error) {
      console.error('Error uploading PDF to S3:', error);
      throw error;
    }
  };

  // Clear generated PDFs
  const clearGeneratedPdfs = () => {
    setGeneratedPdfs([]);
  };

  return {
    generating,
    generatedPdfs,
    generatePdfs,
    downloadPdf,
    downloadAllPdfs,
    uploadPdfToS3,
    clearGeneratedPdfs
  };
};

export default usePdfGeneration; 