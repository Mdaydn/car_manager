import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function InvoicePDF() {
  const invoiceRef = useRef();

  const downloadPDF = () => {
    const input = invoiceRef.current;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("invoice.pdf");
    });
  };

  return (
    <div className="p-6">

      {/* 🧾 INVOICE AREA */}
      <div ref={invoiceRef} className="bg-white p-6 shadow rounded">

        <h2 className="text-2xl font-bold mb-4">🧾 Invoice</h2>

        <p><b>Customer:</b> John Doe</p>
        <p><b>Date:</b> {new Date().toLocaleDateString()}</p>

        <table className="w-full mt-4 border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            <tr className="text-center border-t">
              <td className="p-2">Brake Pad</td>
              <td className="p-2">2</td>
              <td className="p-2">10,000</td>
              <td className="p-2">20,000</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-4 text-right font-bold text-lg">
          Total: 20,000 RWF
        </h3>

      </div>

      {/* 📥 DOWNLOAD BUTTON */}
      <button
        onClick={downloadPDF}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
      >
        📥 Download PDF
      </button>

    </div>
  );
}

export default InvoicePDF;