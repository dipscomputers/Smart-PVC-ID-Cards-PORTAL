import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { LandDetail } from '../types/form';
import { formatAreaHaR } from '../utils/formatters';

interface LandDetailsSectionProps {
  lands: LandDetail[];
  onChange: (lands: LandDetail[]) => void;
}

export const LandDetailsSection: React.FC<LandDetailsSectionProps> = ({ lands, onChange }) => {
  // Add a new land row
  const handleAddRow = () => {
    const newLand: LandDetail = {
      id: `land-${Date.now()}`,
      district: lands.length > 0 ? lands[lands.length - 1].district : '',
      taluka: lands.length > 0 ? lands[lands.length - 1].taluka : '',
      village: lands.length > 0 ? lands[lands.length - 1].village : '',
      gatNo: '',
      khateNo: lands.length > 0 ? lands[lands.length - 1].khateNo : '',
      areaHaR: '',
    };
    onChange([...lands, newLand]);
  };

  // Remove a land row
  const handleRemoveRow = (index: number) => {
    if (lands.length <= 1) {
      // Clear instead of empty array
      onChange([
        {
          id: `land-${Date.now()}`,
          district: '',
          taluka: '',
          village: '',
          gatNo: '',
          khateNo: '',
          areaHaR: '',
        },
      ]);
      return;
    }
    onChange(lands.filter((_, i) => i !== index));
  };

  // Update a field in a specific row
  const handleFieldChange = (index: number, field: keyof LandDetail, value: string) => {
    const updated = [...lands];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // Calculate total area in Ha.R
  const totalArea = lands.reduce((sum, item) => {
    const val = parseFloat(item.areaHaR) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header exactly matching user's image */}
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-[#2e7d32]">
          जमिनीची माहिती / Land Details
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-gray-600">
        प्रत्येक जमिनीच्या गटाची माहिती नोंदवा. नवीन गट किंवा जमीन जोडण्यासाठी खालील '+' बटण वापरा.
      </p>

      {/* Responsive Table matching user's image columns: जिल्हा, तालुका, गाव, गट नं., खाते नं., क्षेत्र हे.आर */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-xs bg-white">
        <table className="w-full min-w-[700px] text-left border-collapse">
          {/* Header matching exact user image labels */}
          <thead>
            <tr className="bg-[#236939] text-white text-xs sm:text-sm font-semibold divide-x divide-green-800">
              <th className="py-3 px-3 w-10 text-center">अ.क्र.</th>
              <th className="py-3 px-3 w-[18%]">जिल्हा</th>
              <th className="py-3 px-3 w-[18%]">तालुका</th>
              <th className="py-3 px-3 w-[18%]">गाव</th>
              <th className="py-3 px-3 w-[14%]">गट नं.</th>
              <th className="py-3 px-3 w-[14%]">खाते नं.</th>
              <th className="py-3 px-3 w-[14%]">क्षेत्र हे.आर</th>
              <th className="py-3 px-2 w-12 text-center">कृती</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {lands.map((land, index) => (
              <tr key={land.id} className="hover:bg-green-50/30 transition-colors">
                {/* Serial No */}
                <td className="py-2.5 px-2 text-center text-xs text-gray-500 font-medium">
                  {index + 1}
                </td>

                {/* जिल्हा (District) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.district}
                    placeholder="जिल्हा"
                    onChange={(e) => handleFieldChange(index, 'district', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* तालुका (Taluka) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.taluka}
                    placeholder="तालुका"
                    onChange={(e) => handleFieldChange(index, 'taluka', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* गाव (Village) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.village}
                    placeholder="गाव"
                    onChange={(e) => handleFieldChange(index, 'village', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* गट नं. (Gat No.) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.gatNo}
                    placeholder="उदा. १९४"
                    onChange={(e) => handleFieldChange(index, 'gatNo', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* खाते नं. (Khate No.) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.khateNo}
                    placeholder="उदा. ४९१२"
                    onChange={(e) => handleFieldChange(index, 'khateNo', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* क्षेत्र हे.आर (Area Ha.R) */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={land.areaHaR}
                    placeholder="उदा. १.०३"
                    onChange={(e) => handleFieldChange(index, 'areaHaR', e.target.value)}
                    onBlur={(e) => handleFieldChange(index, 'areaHaR', formatAreaHaR(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm font-mono font-medium focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                  />
                </td>

                {/* Action: Delete */}
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="p-1.5 rounded text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="ही नोंद काढा"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Table Footer with Total Area */}
          <tfoot>
            <tr className="bg-green-50/80 font-semibold text-green-900 border-t border-green-200 text-xs sm:text-sm">
              <td colSpan={6} className="py-2.5 px-4 text-right">
                एकूण नोंदणीकृत क्षेत्र (Total Area):
              </td>
              <td className="py-2.5 px-2 font-mono font-bold text-green-800">
                {totalArea > 0 ? totalArea.toFixed(2) : '०.००'} हे.आर
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* + Add another land / गट जोडा button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-green-600 rounded-md text-green-700 hover:bg-green-50 font-medium text-sm transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          + जमीन / गट जोडा (Add Land)
        </button>

        <span className="text-xs text-gray-500">
          एकूण नोंदी: {lands.length}
        </span>
      </div>
    </div>
  );
};
