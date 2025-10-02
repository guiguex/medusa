import { useState } from 'react';
import { Settings, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Option, OptionGroup } from '../../types';
import { viewerBridge } from '@/viewer/bridge';

type Props = {
  options: { id: string; code: string; name?: string }[];
};

interface OptionsTabProps {
  options: Option[];
  optionGroups: OptionGroup[];
  selectedOptions: string[];
  onSelectionChange: (optionIds: string[]) => void;
}

export function OptionsTab({ options, optionGroups, selectedOptions, onSelectionChange }: OptionsTabProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const toggleOption = (optionId: string, groupId?: string) => {
    if (!groupId) {
      const newSelection = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      onSelectionChange(newSelection);
      return;
    }

    const group = optionGroups.find(g => g.id === groupId);
    if (!group) return;

    if (group.type === 'single') {
      // Single selection: remove other options from the same group
      const groupOptionIds = options
        .filter(opt => opt.groupId === groupId)
        .map(opt => opt.id);
      
      const newSelection = selectedOptions
        .filter(id => !groupOptionIds.includes(id))
        .concat(selectedOptions.includes(optionId) ? [] : [optionId]);
      
      onSelectionChange(newSelection);
    } else {
      // Multiple selection
      const newSelection = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      onSelectionChange(newSelection);
    }
  };

  const getOptionsByGroup = (groupId: string) => {
    const group = optionGroups.find(g => g.id === groupId);
    if (!group) return [];
    return options.filter(option => group.options.includes(option.id));
  };

  const ungroupedOptions = options.filter(option => !option.groupId);

  return (
    <div className="space-y-6">
      {/* Option Groups */}
      {optionGroups.map(group => {
        const groupOptions = getOptionsByGroup(group.id);
        const isExpanded = activeGroup === group.id;
        const selectedInGroup = groupOptions.filter(opt => selectedOptions.includes(opt.id)).length;

        return (
          <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => setActiveGroup(isExpanded ? null : group.id)}
              className="w-full px-6 py-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.description}</p>
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {group.type === 'single' ? 'Sélection unique' : 'Sélection multiple'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                  {selectedInGroup}/{groupOptions.length}
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
                <div className="space-y-3">
                  {groupOptions.map(option => {
                    const isSelected = selectedOptions.includes(option.id);
                    const priceDisplay = option.priceModifier > 0 
                      ? `+${option.priceModifier.toLocaleString('fr-FR')} €`
                      : option.priceModifier < 0
                      ? `${option.priceModifier.toLocaleString('fr-FR')} €`
                      : 'Inclus';

                    return (
                      <div
                        key={option.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                        }`}
                        onClick={() => toggleOption(option.id, group.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{option.name}</h4>
                              {isSelected && (
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            <span className="text-xs text-gray-500">Valeur: {option.value}</span>
                          </div>
                          <span className={`font-medium ${
                            option.priceModifier > 0 
                              ? 'text-orange-600' 
                              : option.priceModifier < 0 
                              ? 'text-green-600' 
                              : 'text-gray-600'
                          }`}>
                            {priceDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped Options */}
      {ungroupedOptions.length > 0 && (
        <div className="border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <h3 className="font-semibold text-gray-900">Autres options</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {ungroupedOptions.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const priceDisplay = option.priceModifier > 0 
                  ? `+${option.priceModifier.toLocaleString('fr-FR')} €`
                  : option.priceModifier < 0
                  ? `${option.priceModifier.toLocaleString('fr-FR')} €`
                  : 'Inclus';

                return (
                  <div
                    key={option.id}
                    className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                    onClick={() => toggleOption(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          {isSelected && (
                            <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                      <span className={`font-medium ${
                        option.priceModifier > 0 
                          ? 'text-orange-600' 
                          : option.priceModifier < 0 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`}>
                        {priceDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}