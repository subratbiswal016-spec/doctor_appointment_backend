const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF prescription document
 */
const generatePrescriptionPDF = (prescription, doctor, patient, appointment, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header Banner
      doc.rect(0, 0, 595, 100).fill('#0E8A76');
      
      // Doctor Title & Clinic Info
      doc.fillColor('#FFFFFF')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(`Dr. ${doctor.name}`, 40, 25);
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(`${doctor.qualification} · ${doctor.speciality}`, 40, 52)
         .text(`Reg No: ${doctor.registrationNumber} | ${doctor.clinicName}`, 40, 68);

      // Clinic Address & Serial Token Badge
      doc.rect(430, 20, 135, 60).fill('#FFFFFF');
      doc.fillColor('#0E8A76')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('SERIAL TOKEN', 440, 28, { width: 115, align: 'center' });
      doc.fillColor('#132320')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(`#${appointment.serialNumber}`, 440, 42, { width: 115, align: 'center' });

      // Patient Details Bar
      doc.rect(40, 115, 515, 45).fill('#F5F8F7').stroke('#DCE6E3');
      doc.fillColor('#132320')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(`Patient: ${patient.name || appointment.patientName}`, 52, 125)
         .font('Helvetica')
         .text(`Age/Sex: ${patient.age || appointment.patientAge} yrs / ${patient.gender || appointment.patientGender}`, 220, 125)
         .text(`Phone: ${patient.phone || appointment.patientPhone}`, 380, 125)
         .text(`Date: ${new Date(appointment.createdAt).toLocaleDateString('en-IN')}`, 52, 142)
         .text(`Status: CONFIRMED / VISITED`, 380, 142);

      // Vitals Box
      doc.rect(40, 175, 120, 480).fill('#FAFAFA').stroke('#EFEFEF');
      doc.fillColor('#0E8A76')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('VITALS', 50, 190);
      
      doc.fillColor('#3C4E4A')
         .fontSize(9)
         .font('Helvetica')
         .text(`BP: ${prescription.vitals?.bp || '120/80'}`, 50, 215)
         .text(`Pulse: ${prescription.vitals?.pulse || '72 bpm'}`, 50, 235)
         .text(`Weight: ${prescription.vitals?.weight || '68 kg'}`, 50, 255)
         .text(`Temp: ${prescription.vitals?.temperature || '98.6 F'}`, 50, 275);

      // Rx Main Section
      doc.fillColor('#0E8A76')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('Rx', 175, 185);

      // Diagnosis
      doc.fillColor('#132320')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Diagnosis:', 175, 220);
      doc.font('Helvetica')
         .text(prescription.diagnosis, 240, 220);

      // Table Header for Medicines
      doc.rect(175, 250, 380, 25).fill('#0E8A76');
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Medicine Name', 185, 258)
         .text('Dosage', 340, 258)
         .text('Duration', 470, 258);

      let y = 285;
      (prescription.medicines || []).forEach((med, idx) => {
        if (idx % 2 === 0) {
          doc.rect(175, y - 5, 380, 25).fill('#F5F8F7');
        }
        doc.fillColor('#132320')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`${idx + 1}. ${med.name}`, 185, y)
           .font('Helvetica')
           .text(med.dosage, 340, y)
           .text(med.duration, 470, y);
        y += 28;
      });

      // Advice & Follow Up
      if (prescription.advice) {
        y += 15;
        doc.fillColor('#132320')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Advice / Instructions:', 175, y);
        doc.font('Helvetica')
           .fontSize(10)
           .text(prescription.advice, 175, y + 18);
        y += 45;
      }

      if (prescription.followUpDate) {
        doc.fillColor('#0E8A76')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`Follow-Up Date: ${prescription.followUpDate}`, 175, y + 20);
      }

      // Doctor Signature Footer
      doc.rect(40, 760, 515, 1).fill('#DCE6E3');
      doc.fillColor('#697B77')
         .fontSize(9)
         .font('Helvetica')
         .text('This prescription is digitally generated via SERIAL Token App.', 40, 775)
         .text(`Dr. ${doctor.name}`, 440, 775, { align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePrescriptionPDF };
