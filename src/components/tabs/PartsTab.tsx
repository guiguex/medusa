import { useState } from 'react';
import { Package, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Part, PartGroup } from '../../types';
import { viewerBridge } from '@/viewer/bridge';

type Props = {
  parts: { id: string; code: string; name?: string }[];
  productId: string;
};

interface PartsTabProps {
  parts: Part[];
  partGroups: PartGroup[];
  selectedParts: string[];
  onSelectionChange: (partIds: string[]) => void;
}

export function PartsTab({ parts, partGroups, selectedParts, onSelectionChange }: PartsTabProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [children, setChildren] = useState<Record<string, string[]>>({});

  async function loadKit(groupCode: string) {
    if (children[groupCode]) return;
    try {
      const r = await fetch(`/api/kit?code=${encodeURIComponent(groupCode)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('kit 404');
      const data = await r.json();
      const arr = (data?.enfant_kit?.codes || '')
        .split(',').map((s: string) => s.trim()).filter(Boolean);
      setChildren(s => ({ ...s, [groupCode]: arr }));
    } catch { setChildren(s => ({ ...s, [groupCode]: [] })); }
  }

  function onClickPart(code: string) {
    viewerBridge.selectPart(code);
    viewerBridge.cameraTo(code);
  }

  const togglePart = (partId: string) => {
    const newSelection = selectedParts.includes(partId)
      ? selectedParts.filter(id => id !== partId)
      : [...selectedParts, partId];
    onSelectionChange(newSelection);
  };

  const getPartsByGroup = (groupId: string) => {
    const group = partGroups.find(g => g.id === groupId);
    if (!group) return [];
    return parts.filter(part => group.parts.includes(part.id));
  };

  const ungroupedParts = parts.filter(part => !part.groupId);

  return (
    <div className="space-y-6">
      {/* Part Groups */}
      {partGroups.map(group => {
        const groupParts = getPartsByGroup(group.id);
        const isExpanded = activeGroup === group.id;
        const selectedInGroup = groupParts.filter(part => selectedParts.includes(part.id)).length;

        return (
          <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => setActiveGroup(isExpanded ? null : group.id)}
              className="w-full px-6 py-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                  {selectedInGroup}/{groupParts.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-6 bg-white border-t">
                <div className="grid grid-cols-1 gap-4">
                  {groupParts.map(part => (
                    <div
                      key={part.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedParts.includes(part.id)
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => togglePart(part.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={part.image}
                          alt={part.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{part.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {part.price.toLocaleString('fr-FR')} €
                              </span>
                              {selectedParts.includes(part.id) && (
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{part.description}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              part.inStock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {part.inStock ? 'En stock' : 'Rupture de stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped Parts */}
      {ungroupedParts.length > 0 && (
        <div className="border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <h3 className="font-semibold text-gray-900">Autres pièces</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {ungroupedParts.map(part => (
                <div
                  key={part.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    selectedParts.includes(part.id)
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                  onClick={() => togglePart(part.id)}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={part.image}
                      alt={part.name}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{part.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {part.price.toLocaleString('fr-FR')} €
                          </span>
                          {selectedParts.includes(part.id) && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{part.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}