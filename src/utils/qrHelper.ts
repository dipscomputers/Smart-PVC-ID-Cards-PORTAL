import QRCode from 'qrcode';
import { FarmerFormData } from '../types/form';

export async function generateFarmerQrCode(data: FarmerFormData): Promise<string> {
  const qrPayload = JSON.stringify({
    app: 'AgriRecord',
    title: 'शेती परिचय पत्र',
    farmerId: data.farmerId || '803 68 73 81 90',
    nameMr: data.fullNameMr || 'दिपक माधव खंदारे',
    nameEn: data.fullNameEn || 'DIPAK MADHAV KHANDARE',
    gender: data.gender || 'Male',
    mobile: data.whatsappNumber || '9049102035',
    aadhaar: data.aadhaarNumber || '9420 4790 8747',
  });

  try {
    return await QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e5631',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR error:', err);
    return '';
  }
}
