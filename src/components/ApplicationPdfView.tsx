import React from 'react';
import { FarmerFormData } from '../types/form';
import { formatAreaHaR } from '../utils/formatters';

interface ApplicationPdfViewProps {
  data: FarmerFormData;
  id?: string;
}

export const ApplicationPdfView: React.FC<ApplicationPdfViewProps> = ({ data, id = 'printable-application' }) => {
  // Calculate total area in Ha.R
  const totalArea = (data.lands || []).reduce((acc, land) => {
    const val = parseFloat(land.areaHaR) || 0;
    return acc + val;
  }, 0);

  return (
    <div
      id={id}
      className="bg-white text-gray-900 w-full max-w-[800px] mx-auto p-6 sm:p-8 border border-gray-300 shadow-sm print:shadow-none print:border-none print:p-0 text-sm leading-normal font-sans"
    >
      {/* Official Government Header */}
      <div className="border-b-2 border-green-800 pb-3 mb-4 text-center relative">
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 flex items-center justify-center border border-green-700 rounded-full bg-green-50 text-green-800 font-bold text-xs p-1 text-center shrink-0">
            <span>महाराष्ट्र<br/>शासन</span>
          </div>

          <div className="flex-1 px-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-green-900 tracking-tight font-serif">
              महाराष्ट्र शासन — कृषी विभाग
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-gray-800 mt-0.5">
              शेतकरी नोंदणी व योजना अर्ज २०२६
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              Government of Maharashtra — Department of Agriculture (Farmer Registration)
            </p>
          </div>

          {/* Barcode / QR Simulation */}
          <div className="w-20 text-right shrink-0">
            <div className="border border-gray-400 p-1 bg-gray-50 rounded text-center">
              <div className="text-[9px] font-mono font-bold text-gray-800 truncate">
                {data.applicationNo || 'MH-AGRI-2026'}
              </div>
              <div className="h-6 flex items-center justify-center space-x-0.5 my-0.5">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w}px` }}></div>
                ))}
              </div>
              <span className="text-[8px] text-gray-500 block">ई-नोंदणीकृत</span>
            </div>
          </div>
        </div>

        {/* Application Meta Bar */}
        <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-gray-200 text-xs text-gray-700 bg-gray-50/80 px-3 py-1.5 rounded">
          <div>
            <span className="font-semibold text-gray-900">अर्ज क्रमांक (App No): </span>
            <span className="font-mono font-bold text-green-900">{data.applicationNo}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">दिनांक (Date): </span>
            <span>{data.submittedAt || new Date().toLocaleDateString('mr-IN')}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">नोंदणी प्रकार: </span>
            <span className="text-green-800 font-medium">वैयक्तिक शेतकरी (Individual)</span>
          </div>
        </div>
      </div>

      {/* Main Form Content with Top Right Photo */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Left Side: Personal Info & Identification */}
        <div className="col-span-9 space-y-3">
          {/* Section 1: वैयक्तिक माहिती */}
          <div>
            <div className="bg-green-800 text-white px-2.5 py-1 text-xs font-bold rounded-t flex items-center justify-between">
              <span>१. वैयक्तिक माहिती / Personal Information</span>
            </div>
            <div className="border border-t-0 border-gray-300 p-2.5 text-xs grid grid-cols-2 gap-y-2 gap-x-3 bg-white rounded-b">
              <div>
                <span className="text-gray-500 block text-[11px]">पूर्ण नाव (इंग्रजी) / Full Name (En):</span>
                <span className="font-bold text-gray-900">{data.fullNameEn || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">पूर्ण नाव (मराठी) / Full Name (Mr):</span>
                <span className="font-bold text-gray-900">{data.fullNameMr || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">जन्म दिनांक / Date of Birth:</span>
                <span className="font-medium text-gray-900">
                  {data.dobDay && data.dobMonth && data.dobYear
                    ? `${data.dobDay} ${data.dobMonth} ${data.dobYear}`
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">लिंग / Gender:</span>
                <span className="font-medium text-gray-900">
                  {data.gender === 'Male' ? 'Male / पुरुष' : data.gender === 'Female' ? 'Female / महिला' : '-'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block text-[11px]">व्हॉट्सॲप / मोबाइल क्रमांक / WhatsApp Number:</span>
                <span className="font-mono font-bold text-gray-900">{data.whatsappNumber || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: ओळख क्रमांक */}
          <div>
            <div className="bg-green-800 text-white px-2.5 py-1 text-xs font-bold rounded-t flex items-center justify-between">
              <span>२. ओळख क्रमांक / Identification Numbers</span>
            </div>
            <div className="border border-t-0 border-gray-300 p-2.5 text-xs grid grid-cols-2 gap-y-2 gap-x-3 bg-white rounded-b">
              <div>
                <span className="text-gray-500 block text-[11px]">आधार क्रमांक (UID) / Aadhaar No:</span>
                <span className="font-mono font-bold text-gray-900">{data.aadhaarNumber || ''}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">शेतकरी आयडी / Farmer ID:</span>
                <span className="font-mono font-bold text-gray-900">{data.farmerId || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Photo Box */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="w-[125px] h-[155px] border-2 border-gray-400 rounded bg-gray-50 overflow-hidden flex flex-col items-center justify-center text-center p-1 shadow-2xs">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Farmer Photograph"
                className="w-full h-full object-cover object-center rounded-xs"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center justify-center h-full">
                <span className="text-[10px] text-gray-400 font-medium">पासपोर्ट फोटो</span>
                <span className="text-[9px] text-gray-400">160 × 200 px</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 text-center font-medium">
            अर्जदाराचे छायाचित्र
          </span>
        </div>
      </div>

      {/* Section 3: रहिवासी पत्ता / Address Information */}
      <div className="mb-4">
        <div className="bg-green-800 text-white px-2.5 py-1 text-xs font-bold rounded-t flex items-center justify-between">
          <span>३. रहिवासी पत्ता / Residence Address</span>
        </div>
        <div className="border border-t-0 border-gray-300 p-2.5 text-xs bg-white rounded-b divide-y divide-gray-100">
          {data.addressEn && (
            <div className="pb-2">
              <span className="text-gray-500 block text-[11px]">Address In English / संपूर्ण पत्ता:</span>
              <span className="font-bold text-gray-900 uppercase tracking-wide">{data.addressEn}</span>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div>
              <span className="text-gray-500 block text-[11px]">Village (English):</span>
              <span className="font-medium text-gray-900">{data.villageEn || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Tehsil/Taluka (English):</span>
              <span className="font-medium text-gray-900">{data.tehsilEn || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">District (English):</span>
              <span className="font-medium text-gray-900">{data.districtEn || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Pincode / पिनकोड:</span>
              <span className="font-mono font-bold text-gray-900">{data.pincode || '-'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div>
              <span className="text-gray-500 block text-[11px]">गाव (मराठी):</span>
              <span className="font-semibold text-gray-900">{data.villageMr || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">तालुका/तहसील (मराठी):</span>
              <span className="font-semibold text-gray-900">{data.tehsilMr || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">जिल्हा (मराठी):</span>
              <span className="font-semibold text-gray-900">{data.districtMr || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: जमिनीची माहिती / Land Details */}
      <div className="mb-4">
        <div className="bg-green-800 text-white px-2.5 py-1 text-xs font-bold rounded-t flex items-center justify-between">
          <span>४. जमिनीची माहिती / Land Details (७/१२ प्रमाणे)</span>
          <span className="text-[10px] bg-green-900 px-2 py-0.5 rounded">
            एकूण क्षेत्र: {totalArea > 0 ? formatAreaHaR(totalArea) : '०.००'} हे.आर
          </span>
        </div>
        <div className="border border-t-0 border-gray-300 overflow-hidden rounded-b">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-300">
              <tr>
                <th className="p-2 border-r border-gray-300 w-10 text-center">अ.क्र.</th>
                <th className="p-2 border-r border-gray-300">जिल्हा</th>
                <th className="p-2 border-r border-gray-300">तालुका</th>
                <th className="p-2 border-r border-gray-300">गाव</th>
                <th className="p-2 border-r border-gray-300">गट नं.</th>
                <th className="p-2 border-r border-gray-300">खाते नं.</th>
                <th className="p-2 text-right">क्षेत्र (हे.आर)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.lands && data.lands.length > 0 ? (
                data.lands.map((land, idx) => (
                  <tr key={land.id || idx} className="hover:bg-gray-50">
                    <td className="p-2 border-r border-gray-200 text-center text-gray-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-gray-200 font-medium text-gray-800">
                      {land.district || '-'}
                    </td>
                    <td className="p-2 border-r border-gray-200 font-medium text-gray-800">
                      {land.taluka || '-'}
                    </td>
                    <td className="p-2 border-r border-gray-200 font-medium text-gray-800">
                      {land.village || '-'}
                    </td>
                    <td className="p-2 border-r border-gray-200 font-mono font-bold text-gray-900">
                      {land.gatNo || '-'}
                    </td>
                    <td className="p-2 border-r border-gray-200 font-mono text-gray-800">
                      {land.khateNo || ''}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-green-900">
                      {land.areaHaR ? `${formatAreaHaR(land.areaHaR)} हे.आर` : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-3 text-center text-gray-400">
                    जमिनीचा कोणताही तपशील नोंदवलेला नाही
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-green-50 font-bold border-t-2 border-green-700 text-green-900">
              <tr>
                <td colSpan={6} className="p-2 text-right border-r border-green-200">
                  एकूण नोंदणीकृत शेतजमीन क्षेत्र (Total Area):
                </td>
                <td className="p-2 text-right font-mono text-sm">
                  {totalArea > 0 ? `${formatAreaHaR(totalArea)} हे.आर` : '०.०० हे.आर'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 5: शेतकरी स्वयंघोषणा / Self Declaration */}
      <div className="mb-4 border border-gray-300 rounded p-3 text-[11px] text-gray-700 bg-gray-50/50 leading-relaxed">
        <h4 className="font-bold text-gray-900 mb-1 text-xs">स्वयंघोषणापत्र (Self Declaration):</h4>
        <p>
          मी याद्वारे घोषित करतो/करते की, या अर्जात व सोबत जोडलेल्या कागदपत्रांमध्ये दिलेली माहिती माझ्या संपूर्ण माहितीप्रमाणे खरी व अचूक आहे. यातील कोणतीही माहिती खोटी किंवा चुकीची आढळल्यास शासकीय नियमांनुसार कारवाईस मी स्वतः पात्र राहीन याची मला जाणीव आहे.
        </p>
      </div>

      {/* Signature & Seal Section */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-300 text-center text-xs">
        <div>
          <div className="h-14 flex items-end justify-center">
            <span className="font-mono text-xs text-gray-400">.................................</span>
          </div>
          <p className="font-semibold text-gray-800">दिनांक व ठिकाण</p>
          <p className="text-[10px] text-gray-500">(Date & Place)</p>
        </div>

        <div>
          <div className="h-14 flex items-center justify-center">
            <div className="border border-dashed border-gray-400 px-3 py-1 text-[10px] text-gray-400 rounded">
              कार्यालयीन शिक्का / Stamp
            </div>
          </div>
          <p className="font-semibold text-gray-800">ग्रामसेवक / कृषी सहाय्यक स्वाक्षरी</p>
          <p className="text-[10px] text-gray-500">(Verification Officer)</p>
        </div>

        <div>
          <div className="h-14 flex items-end justify-center">
            <span className="font-mono text-xs text-gray-400">.................................</span>
          </div>
          <p className="font-semibold text-gray-800">अर्जदार शेतकऱ्याची सही / अंगठा</p>
          <p className="text-[10px] text-gray-500">(Applicant Farmer Signature)</p>
        </div>
      </div>

      {/* Cut Perforation line for Acknowledgement Slip */}
      <div className="my-5 border-t border-dashed border-gray-400 relative text-center">
        <span className="bg-white px-3 text-[10px] text-gray-500 uppercase tracking-widest relative -top-2">
          ✂ येथे कापा / Cut Along This Line for Acknowledgement ✂
        </span>
      </div>

      {/* Counterfoil Acknowledgement Receipt */}
      <div className="border border-green-700 rounded p-3 bg-green-50/40 text-xs">
        <div className="flex items-center justify-between border-b border-green-200 pb-1 mb-2">
          <span className="font-bold text-green-900">
            शेतकरी नोंदणी पोचपावती (Farmer Registration Acknowledgement Slip)
          </span>
          <span className="font-mono font-bold text-green-800">
            {data.applicationNo}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div>
            <span className="text-gray-500 block">शेतकऱ्याचे नाव:</span>
            <span className="font-bold text-gray-900">{data.fullNameMr || data.fullNameEn || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">गाव / तालुका:</span>
            <span className="font-medium text-gray-900">
              {data.villageMr || data.villageEn || '-'}, {data.tehsilMr || data.tehsilEn || '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">नोंदणी दिनांक:</span>
            <span className="font-medium text-gray-900">
              {data.submittedAt || new Date().toLocaleDateString('mr-IN')}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-500 text-right">
          * ही संगणकीकृत पावती असून अर्जाच्या स्थितीसाठी व योजना लाभासाठी हा अर्ज क्रमांक सुरक्षित ठेवावा.
        </div>
      </div>
    </div>
  );
};
