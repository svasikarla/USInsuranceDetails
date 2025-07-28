import { useState, useEffect } from 'react';
import { carrierApi } from '../../services/apiService';
import { InsuranceCarrier } from '../../types/api';

interface CarrierSelectProps {
  value?: string;
  onChange: (carrierId: string | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  includeInactive?: boolean;
  error?: string;
  label?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export function CarrierSelect({
  value,
  onChange,
  placeholder = "Select a carrier...",
  required = false,
  disabled = false,
  className = "",
  includeInactive = false,
  error,
  label,
  id,
  name,
  'aria-label': ariaLabel
}: CarrierSelectProps) {
  // Generate unique ID if not provided
  const selectId = id || `carrier-select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCarriers();
  }, [includeInactive]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const carriersData = await carrierApi.getCarriers();
      
      // Filter carriers based on includeInactive prop
      const filteredCarriers = includeInactive 
        ? carriersData 
        : carriersData.filter(c => c.is_active);
      
      setCarriers(filteredCarriers);
      setLoadError(null);
    } catch (err) {
      console.error('Error loading carriers:', err);
      setLoadError('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  const baseClassName = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

  if (loading) {
    return (
      <div className={baseClassName}>
        <option>Loading carriers...</option>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        <select className={baseClassName} disabled>
          <option>Error loading carriers</option>
        </select>
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name || selectId}
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={baseClassName}
        aria-label={ariaLabel || label || placeholder}
        aria-describedby={errorId}
        aria-invalid={error ? 'true' : 'false'}
      >
        <option value="">{placeholder}</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>
            {carrier.name} ({carrier.code})
            {!carrier.is_active && ' - Inactive'}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

interface CarrierAutocompleteProps {
  value?: string;
  onChange: (carrierId: string | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  includeInactive?: boolean;
  error?: string;
}

export function CarrierAutocomplete({
  value,
  onChange,
  placeholder = "Search carriers...",
  required = false,
  disabled = false,
  className = "",
  includeInactive = false,
  error
}: CarrierAutocompleteProps) {
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [filteredCarriers, setFilteredCarriers] = useState<InsuranceCarrier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<InsuranceCarrier | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarriers();
  }, [includeInactive]);

  useEffect(() => {
    // Find selected carrier when value changes
    if (value && carriers.length > 0) {
      const carrier = carriers.find(c => c.id === value);
      setSelectedCarrier(carrier || null);
      setSearchTerm(carrier ? `${carrier.name} (${carrier.code})` : '');
    } else {
      setSelectedCarrier(null);
      setSearchTerm('');
    }
  }, [value, carriers]);

  useEffect(() => {
    // Filter carriers based on search term
    if (searchTerm.trim() === '') {
      setFilteredCarriers(carriers);
    } else {
      const filtered = carriers.filter(carrier =>
        carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCarriers(filtered);
    }
  }, [searchTerm, carriers]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const carriersData = await carrierApi.getCarriers();
      
      // Filter carriers based on includeInactive prop
      const filteredCarriers = includeInactive 
        ? carriersData 
        : carriersData.filter(c => c.is_active);
      
      setCarriers(filteredCarriers);
      setFilteredCarriers(filteredCarriers);
    } catch (err) {
      console.error('Error loading carriers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    
    // If user clears the input, clear the selection
    if (newSearchTerm === '') {
      setSelectedCarrier(null);
      onChange(null);
    }
  };

  const handleCarrierSelect = (carrier: InsuranceCarrier) => {
    setSelectedCarrier(carrier);
    setSearchTerm(`${carrier.name} (${carrier.code})`);
    setIsOpen(false);
    onChange(carrier.id);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events on options
    setTimeout(() => setIsOpen(false), 200);
  };

  const baseClassName = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

  return (
    <div className="relative space-y-1">
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled || loading}
        className={baseClassName}
        autoComplete="off"
      />
      
      {isOpen && !disabled && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCarriers.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              {searchTerm ? 'No carriers found' : 'No carriers available'}
            </div>
          ) : (
            filteredCarriers.map((carrier) => (
              <div
                key={carrier.id}
                onClick={() => handleCarrierSelect(carrier)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900">{carrier.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{carrier.code}</div>
                </div>
                {!carrier.is_active && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface CarrierDisplayProps {
  carrierId?: string;
  showCode?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function CarrierDisplay({ 
  carrierId, 
  showCode = true, 
  showStatus = false,
  className = "" 
}: CarrierDisplayProps) {
  const [carrier, setCarrier] = useState<InsuranceCarrier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (carrierId) {
      loadCarrier(carrierId);
    } else {
      setCarrier(null);
    }
  }, [carrierId]);

  const loadCarrier = async (id: string) => {
    try {
      setLoading(true);
      const carrierData = await carrierApi.getCarrier(id);
      setCarrier(carrierData);
    } catch (err) {
      console.error('Error loading carrier:', err);
      setCarrier(null);
    } finally {
      setLoading(false);
    }
  };

  if (!carrierId) {
    return <span className={`text-gray-400 ${className}`}>No carrier</span>;
  }

  if (loading) {
    return <span className={`text-gray-500 ${className}`}>Loading...</span>;
  }

  if (!carrier) {
    return <span className={`text-red-500 ${className}`}>Carrier not found</span>;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {carrier.logo_url && (
        <img 
          src={carrier.logo_url} 
          alt={carrier.name}
          className="h-6 w-6 rounded object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span className="font-medium">{carrier.name}</span>
      {showCode && (
        <span className="text-gray-500 font-mono text-sm">({carrier.code})</span>
      )}
      {showStatus && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          carrier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {carrier.is_active ? 'Active' : 'Inactive'}
        </span>
      )}
    </div>
  );
}
