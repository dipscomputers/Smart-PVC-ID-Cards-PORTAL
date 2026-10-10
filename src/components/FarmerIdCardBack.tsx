import React from 'react';
import { FarmerCardData, calculateTotalArea, calculateTotalAreaAcres } from '../types/farmerCard';

interface CardBackProps {
  card: FarmerCardData;
  isPrintMode?: boolean;
}

// Format Farmer ID without spaces
function formatFarmerId(val?: string): string {
  if (!val) return '';
  return val.replace(/\s+/g, '');
}

export const FarmerIdCardBack: React.FC<CardBackProps> = ({ card, isPrintMode = false }) => {
  const totalAreaHaR = card.totalArea || calculateTotalArea(card.lands || []);
  const totalAreaAcres = card.totalAreaAcres || calculateTotalAreaAcres(card.lands || []);
  const lands = card.lands && card.lands.length > 0 ? card.lands : [];
  const landCount = lands.length;

  // Exact typographic scale for 1 to 10+ lands
  const tableFontSize = isPrintMode
    ? landCount <= 2
      ? '2.4mm'
      : landCount <= 4
      ? '2.2mm'
      : landCount <= 6
      ? '2.0mm'
      : landCount <= 8
      ? '1.85mm'
      : landCount <= 10
      ? '1.75mm'
      : '1.6mm'
    : landCount <= 2
    ? '10px'
    : landCount <= 4
    ? '9.2px'
    : landCount <= 6
    ? '8.5px'
    : landCount <= 8
    ? '7.8px'
    : landCount <= 10
    ? '7.2px'
    : '6.8px';

  const headerFontSize = isPrintMode
    ? landCount <= 4
      ? '2.2mm'
      : landCount <= 7
      ? '2.0mm'
      : '1.85mm'
    : landCount <= 4
    ? '9.2px'
    : landCount <= 7
    ? '8.5px'
    : '7.8px';

  // Comfortable padding starting cleanly from top
  const cellPadding = isPrintMode
    ? landCount <= 3
      ? '0.9mm 1.0mm'
      : landCount <= 6
      ? '0.65mm 0.8mm'
      : landCount <= 8
      ? '0.45mm 0.6mm'
      : '0.3mm 0.5mm'
    : landCount <= 3
    ? '3.5px 4px'
    : landCount <= 6
    ? '2.5px 3px'
    : landCount <= 8
    ? '1.5px 2px'
    : '1px 2px';

  const cardPadding = isPrintMode
    ? landCount >= 7
      ? '1.8mm 2.2mm'
      : '2.2mm 2.5mm'
    : landCount >= 7
    ? '6px 8px'
    : '7px 9px';

  const addressLineClamp = landCount >= 8 ? 1 : 2;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#dcf0df',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        borderRadius: isPrintMode ? '3mm' : '10px',
        border: '1.5px solid #014728',
        width: isPrintMode ? '85.6mm' : '100%',
        maxWidth: isPrintMode ? '85.6mm' : '420px',
        height: isPrintMode ? '54.0mm' : '100%',
        aspectRatio: isPrintMode ? 'unset' : '85.6 / 54',
        padding: cardPadding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* 1. TOP SECTION: ADDRESS */}
      <div
        style={{
          borderBottom: '1px solid rgba(14, 89, 50, 0.25)',
          paddingBottom: landCount >= 7 ? '2.5px' : '4px',
          marginBottom: landCount >= 7 ? '2px' : '3px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: isPrintMode ? (landCount >= 7 ? '2.3mm' : '2.5mm') : (landCount >= 7 ? '9.5px' : '10.5px'),
            fontWeight: 900,
            color: '#0e5932',
            lineHeight: 1.2,
            letterSpacing: '0.2px',
          }}
        >
          संपूर्ण पत्ता / Address
        </div>
        <div
          style={{
            fontSize: isPrintMode ? (landCount >= 7 ? '2.0mm' : '2.2mm') : (landCount >= 7 ? '8.2px' : '9.2px'),
            fontWeight: 800,
            color: '#064e3b',
            textTransform: 'uppercase',
            lineHeight: 1.35,
            marginTop: '2.5px',
            letterSpacing: '0.2px',
            display: '-webkit-box',
            WebkitLineClamp: addressLineClamp,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {card.address || '-'}
        </div>
      </div>

      {/* 2. MIDDLE SECTION: LAND DETAILS TABLE (Starts strictly from TOP) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          margin: landCount >= 7 ? '1.5px 0' : '2.5px 0',
          minHeight: 0,
        }}
      >
        <div
          style={{
            fontSize: isPrintMode ? (landCount >= 7 ? '2.2mm' : '2.5mm') : (landCount >= 7 ? '9.5px' : '10.5px'),
            fontWeight: 900,
            color: '#0e5932',
            marginBottom: landCount >= 7 ? '1px' : '2px',
            flexShrink: 0,
          }}
        >
          जमिनीची माहिती / Land Details
        </div>

        {/* Structured Land Table with rows stacked from the TOP */}
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              fontSize: tableFontSize,
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr
                style={{
                  color: '#0e5932',
                  fontSize: headerFontSize,
                  fontWeight: 900,
                  backgroundColor: 'rgba(1, 71, 40, 0.08)',
                  borderBottom: '1.2px solid rgba(14, 89, 50, 0.35)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: cellPadding, fontWeight: 900, width: '18%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'left' }}>जिल्हा</th>
                <th style={{ padding: cellPadding, fontWeight: 900, width: '18%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'left' }}>तालुका</th>
                <th style={{ padding: cellPadding, fontWeight: 900, width: '20%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'left' }}>गाव</th>
                <th style={{ padding: cellPadding, fontWeight: 900, width: '14%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'center' }}>गट नं.</th>
                <th style={{ padding: cellPadding, fontWeight: 900, width: '14%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'center' }}>खाते नं.</th>
                <th style={{ padding: cellPadding, fontWeight: 900, width: '16%', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'right' }}>क्षेत्र हे.आर</th>
              </tr>
            </thead>
            <tbody style={{ color: '#064e3b', fontWeight: 700 }}>
              {lands.map((land, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <tr
                    key={land.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(14, 89, 50, 0.12)',
                      backgroundColor: isEven ? 'rgba(1, 71, 40, 0.03)' : 'transparent',
                    }}
                  >
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                        textAlign: 'left',
                      }}
                      title={land.district}
                    >
                      {land.district || '-'}
                    </td>
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                        textAlign: 'left',
                      }}
                      title={land.taluka}
                    >
                      {land.taluka || '-'}
                    </td>
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                        textAlign: 'left',
                      }}
                      title={land.village}
                    >
                      {land.village || '-'}
                    </td>
                    <td style={{ padding: cellPadding, textAlign: 'center', fontWeight: 900, fontFamily: 'monospace', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {land.gatNo || '-'}
                    </td>
                    <td style={{ padding: cellPadding, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {land.khateNo || '-'}
                    </td>
                    <td style={{ padding: cellPadding, textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {land.areaHaR || '0.00'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. BOTTOM: TOTAL AREA & OFFICIAL SUMMARY */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: landCount >= 7 ? '1.5px' : '2.5px',
          borderTop: '1px solid rgba(14, 89, 50, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: landCount >= 7 ? '1.5px' : '2.5px',
          flexShrink: 0,
        }}
      >
        {/* Total Area Highlight Row: LEFT: Gat count, RIGHT: Total Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: landCount >= 7 ? '1px 4.5px' : '2px 6px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            border: '1px solid rgba(14, 89, 50, 0.25)',
          }}
        >
          {/* LEFT: Gat count */}
          <span
            style={{
              fontSize: isPrintMode ? (landCount >= 7 ? '1.85mm' : '2.1mm') : (landCount >= 7 ? '8px' : '9.5px'),
              fontWeight: 800,
              color: '#047857',
            }}
          >
            एकूण {card.lands?.length || 1} गट नोंदवले आहेत
          </span>

          {/* RIGHT: Total Area with Acres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: isPrintMode ? (landCount >= 7 ? '2.0mm' : '2.3mm') : (landCount >= 7 ? '8.8px' : '10px'),
                fontWeight: 900,
                color: '#0e5932',
              }}
            >
              एकूण क्षेत्र :
            </span>
            <span
              style={{
                fontSize: isPrintMode ? (landCount >= 7 ? '2.1mm' : '2.4mm') : (landCount >= 7 ? '9.2px' : '10.5px'),
                fontWeight: 900,
                color: '#064e3b',
              }}
            >
              {totalAreaHaR} हे.आर {totalAreaAcres && totalAreaAcres !== '0.00' ? `(${totalAreaAcres} एकर)` : ''}
            </span>
          </div>
        </div>

        {/* Official Footer Text: FARMER ID IN FULL COLORS (Dark Green Background, Yellow Label, White ID) */}
        <div
          style={{
            backgroundColor: '#014728',
            borderRadius: '4px',
            padding: isPrintMode ? (landCount >= 7 ? '0.6mm 1.8mm' : '0.8mm 2mm') : (landCount >= 7 ? '2px 6px' : '2.5px 8px'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPrintMode ? '1.8mm' : '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span
            style={{
              fontSize: isPrintMode ? (landCount >= 7 ? '2.1mm' : '2.4mm') : (landCount >= 7 ? '9.5px' : '10.5px'),
              fontWeight: 900,
              color: '#FAF119',
              letterSpacing: '0.3px',
            }}
          >
            फार्मर आयडी :
          </span>
          <span
            style={{
              fontSize: isPrintMode ? (landCount >= 7 ? '2.2mm' : '2.5mm') : (landCount >= 7 ? '10px' : '11.5px'),
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: isPrintMode ? '0.2mm' : '0.5px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {formatFarmerId(card.farmerId)}
          </span>
        </div>
      </div>
    </div>
  );
};
