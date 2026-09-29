const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

// Verify & Confirm Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { appointmentId, paymentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctorId').populate('sessionId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment record not found' });
    }

    if (appointment.status !== 'HELD') {
      return res.status(400).json({
        success: false,
        message: appointment.status === 'CONFIRMED'
          ? 'This booking is already confirmed.'
          : `Cannot confirm — booking status is ${appointment.status}.`
      });
    }

    if (new Date() > new Date(appointment.holdExpiresAt)) {
      await appointment.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Your hold has expired. Please select a new serial token.'
      });
    }

    const finalPaymentId = paymentId || `pay_${Date.now()}_${appointment.serialNumber}`;

    // Step 1: Transition Appointment Status HELD -> CONFIRMED
    appointment.status = 'CONFIRMED';
    appointment.paymentId = finalPaymentId;
    await appointment.save();

    // Step 2: Record Payment Log
    await Payment.create({
      appointmentId: appointment._id,
      paymentId: finalPaymentId,
      paymentMethod: 'DIRECT_PAYMENT',
      amount: appointment.amount,
      status: 'SUCCESS',
      paidAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `🎉 Booking Confirmed! Serial Token #${appointment.serialNumber} is permanently booked.`,
      appointment: {
        id: appointment._id,
        serialNumber: appointment.serialNumber,
        status: appointment.status,
        patientName: appointment.patientName,
        doctorName: appointment.doctorId ? appointment.doctorId.name : '',
        clinicName: appointment.doctorId ? appointment.doctorId.clinicName : '',
        address: appointment.doctorId ? appointment.doctorId.address : '',
        sessionDisplayDate: appointment.sessionId ? appointment.sessionId.displayDate : '',
        sessionTime: appointment.sessionId ? `${appointment.sessionId.startTime} - ${appointment.sessionId.endTime}` : '',
        amountPaid: appointment.amount,
        paymentId: finalPaymentId
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Generic Webhook / Notification Handler
exports.handleWebhook = async (req, res) => {
  return res.status(200).json({ status: 'ok', message: 'Payment webhook active' });
};

