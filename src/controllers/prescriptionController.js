const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

// Doctor Portal: Save Digital Prescription & Generate PDF
exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, vitals, diagnosis, medicines, advice, followUpDate } = req.body;

    if (!appointmentId || !diagnosis || !medicines) {
      return res.status(400).json({ success: false, message: 'Appointment ID, Diagnosis, and Medicines are required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const doctor = await Doctor.findById(appointment.doctorId);
    const patient = await Patient.findById(appointment.patientId);

    // Save or update prescription document
    let prescription = await Prescription.findOne({ appointmentId });
    if (prescription) {
      prescription.vitals = vitals || prescription.vitals;
      prescription.diagnosis = diagnosis;
      prescription.medicines = medicines;
      prescription.advice = advice || '';
      prescription.followUpDate = followUpDate || '';
      await prescription.save();
    } else {
      prescription = await Prescription.create({
        appointmentId,
        doctorId: doctor._id,
        patientId: appointment.patientId,
        vitals: vitals || { bp: '120/80', pulse: '72 bpm', weight: '68 kg', temperature: '98.6 F' },
        diagnosis,
        medicines,
        advice: advice || '',
        followUpDate: followUpDate || ''
      });
    }

    // Mark appointment status as COMPLETED
    appointment.status = 'COMPLETED';
    await appointment.save();

    // Generate PDF File
    const pdfDir = path.join(__dirname, '../../public/prescriptions');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `rx_${appointment._id}_${Date.now()}.pdf`;
    const outputPath = path.join(pdfDir, filename);

    await generatePrescriptionPDF(prescription, doctor, patient || {}, appointment, outputPath);

    const pdfUrl = `/prescriptions/${filename}`;
    prescription.pdfPath = pdfUrl;
    await prescription.save();

    return res.status(201).json({
      success: true,
      message: 'Prescription saved & PDF generated successfully!',
      prescription,
      pdfUrl
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Patient: Get Prescription for an Appointment
exports.getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const prescription = await Prescription.findOne({ appointmentId })
      .populate('doctorId')
      .populate('patientId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found yet' });
    }

    return res.status(200).json({ success: true, prescription });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
