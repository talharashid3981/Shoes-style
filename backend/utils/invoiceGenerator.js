import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';
import cloudinary from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Helper to cleanup resources on error
const cleanup = (stream, filePath) => {
  try {
    if (stream && !stream.destroyed) {
      stream.destroy();
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
};

export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    const invoiceName = `invoice-${order.orderId}.pdf`;
    const invoicePath = path.join('/tmp', invoiceName);
    let writeStream = null;
    let doc = null;

    try {
      doc = new PDFDocument({ margin: 50 });
      writeStream = fs.createWriteStream(invoicePath);

      // ✅ Handle stream errors
      writeStream.on('error', (err) => {
        cleanup(writeStream, invoicePath);
        reject(err);
      });

      doc.on('error', (err) => {
        cleanup(writeStream, invoicePath);
        reject(err);
      });

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).text('SOLE STYLE', 50, 50);
      doc.fontSize(10).text('Invoice', 50, 80);
      doc.text(`Order ID: ${order.orderId}`, 50, 95);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 110);

      // Billing Address
      doc.text('Bill To:', 50, 140);
      doc.text(order.billingAddress.name, 50, 155);
      doc.text(order.billingAddress.addressLine1, 50, 170);
      doc.text(`${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}`, 50, 185);
      doc.text(order.billingAddress.phone, 50, 200);

      // Table
      let y = 250;
      doc.text('Item', 50, y);
      doc.text('Qty', 300, y);
      doc.text('Price', 350, y);
      doc.text('Total', 450, y);
      y += 15;

      order.items.forEach(item => {
        doc.text(item.name.substring(0, 30), 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`Rs. ${item.price}`, 350, y);
        doc.text(`Rs. ${item.quantity * item.price}`, 450, y);
        y += 20;
      });

      y += 10;
      doc.text(`Subtotal: Rs. ${order.subtotal}`, 350, y);
      y += 15;
      doc.text(`Tax: Rs. ${order.tax}`, 350, y);
      y += 15;
      doc.text(`Shipping: Rs. ${order.shippingCost}`, 350, y);
      y += 15;
      doc.text(`Discount: Rs. ${order.discount}`, 350, y);
      y += 15;
      doc.fontSize(12).text(`Total: Rs. ${order.total}`, 350, y);

    doc.end();

    writeStream.on('finish', async () => {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(invoicePath, {
          resource_type: 'raw',
          folder: 'invoices',
          public_id: invoiceName.replace('.pdf', ''),
        });
        // Delete local file
        fs.unlinkSync(invoicePath);
        resolve(result.secure_url);
      } catch (err) {
        cleanup(writeStream, invoicePath);
        reject(err);
      }
    });

    writeStream.on('error', (err) => {
      cleanup(writeStream, invoicePath);
      reject(err);
    });

  } catch (error) {
    cleanup(writeStream, invoicePath);
    reject(error);
  }
  });
};