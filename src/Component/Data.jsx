import React from 'react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'

const RoForm = () => {
  // Dummy customer details and table data for demonstration
  const custDetails = {
    fname: 'John',
    lname: 'Doe',
    address: '123 Main St, Cityville',
    mob: '(123) 456-7890',
  };

  const tableData = [
    { data: 'Product A', quantity: 2, price: 10, total: 20 },
    { data: 'Product B', quantity: 1, price: 15, total: 15 },
  ];

  const totalPrice = tableData.reduce((acc, item) => acc + item.total, 0);

  // Generate PDF Invoice
  function generateInvoice(custDetails, tableData, totalPrice) {
    if (!custDetails || typeof custDetails !== 'object') {
      alert('Customer details are missing or invalid.');
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#111827'); // dark slate color
    doc.text('INVOICE', 14, 30);

    // Company Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#6b7280'); // neutral gray
    const companyX = 14;
    let currentY = 45;
    const lineHeight = 8;
    const companyLines = [
      'YOUR LOGO HERE',
      'Your Company Name',
      'Street Address',
      'City, ST ZIP Code',
      '[Phone] [Fax]',
      'email@example.com',
    ];
    companyLines.forEach(line => {
      doc.text(line, companyX, currentY);
      currentY += lineHeight;
    });

    // Invoice info (right aligned)
    const pageWidth = doc.internal.pageSize.getWidth();
    const infoX = pageWidth - 70;
    doc.text('INVOICE NO.: 100', infoX, 45);
    doc.text('DATE: ' + new Date().toLocaleDateString(), infoX, 53);
    doc.text('CUSTOMER ID: ABC12345', infoX, 61);

    // Customer Details
    const custX = 14;
    let custY = 90;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#111827');
    doc.text('TO:', custX, custY);
    custY += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    const custFullName = `${custDetails.fname || ''} ${custDetails.lname || ''}`.trim() || 'N/A';
    doc.text(custFullName, custX, custY);
    custY += lineHeight;
    doc.text(custDetails.address || 'N/A', custX, custY);
    custY += lineHeight;
    doc.text(custDetails.mob || 'N/A', custX, custY);

    // Prepare table content
    const invoiceData = Array.isArray(tableData)
      ? tableData.map(item => [
          item.data || '',
          item.quantity != null ? item.quantity.toString() : '',
          item.price != null ? `$${parseFloat(item.price).toFixed(2)}` : '',
          item.total != null ? `$${parseFloat(item.total).toFixed(2)}` : '',
        ])
      : [];

    // Draw table
    autoTable(doc, {
      head: [['DESCRIPTION', 'QUANTITY', 'AMOUNT', 'TOTAL']],
      body: invoiceData,
      startY: custY + 20,
      theme: 'grid',
      headStyles: { fillColor: '#000000', textColor: '#ffffff', fontStyle: 'bold' },
      styles: { fontSize: 12, textColor: '#374151' },
      margin: { left: 14, right: 14 },
    });

    // Safely get last Y position after table
    const finalY = doc.autoTable && doc.autoTable.previous ? doc.autoTable.previous.finalY : custY + 80;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#111827');
    doc.text(`TOTAL DUE: $${totalPrice.toFixed(2)}`, infoX, finalY + 15);

    // Footer message
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#6b7280');
    doc.text('Make all checks payable to Your Company Name.', custX, finalY + 35);
    doc.text('THANK YOU FOR YOUR BUSINESS!', custX, finalY + 45);

    // Save PDF
    doc.save('invoice.pdf');
  }

  return (
    <main className="bg-white min-h-screen flex flex-col items-center py-20 px-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-10">Generate Invoice</h1>
        <button
          onClick={() => generateInvoice(custDetails, tableData, totalPrice)}
          className="inline-block bg-black text-white font-semibold rounded-xl px-8 py-4 shadow-md hover:bg-gray-800 transition-colors"
          aria-label="Download Invoice PDF"
        >
          Download Invoice PDF
        </button>
      </div>
    </main>
  );
};

export default RoForm;

