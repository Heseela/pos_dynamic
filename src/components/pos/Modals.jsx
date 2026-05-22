import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function DeleteModal({ show, type, onConfirm, onCancel }) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (show && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [show]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900">
            Confirm Delete
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this {type}? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel();
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReserveModal({ show, onConfirm, onCancel }) {
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setCustomerName('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [show]);

  if (!show) return null;

  const handleSubmit = () => {
    const trimmedName = customerName.trim();
    
    if (!trimmedName) {
      setError('Customer name is required');
      inputRef.current?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    onConfirm(trimmedName);
    setCustomerName('');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-modal-title"
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 id="reserve-modal-title" className="text-lg font-semibold text-gray-900">
            Reserve Table
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            placeholder="Enter customer name"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-200 focus:ring-gray-900 focus:border-transparent'
            }`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'name-error' : undefined}
          />
          {error && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!customerName.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}

export function TableModal({ show, mode, tableData, onConfirm, onCancel }) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [errors, setErrors] = useState({ number: '', capacity: '' });
  const numberInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (mode === 'edit' && tableData) {
        setTableNumber(
          tableData.number !== undefined && tableData.number !== null
            ? tableData.number.toString()
            : ''
        );
        setCapacity(
          tableData.capacity !== undefined && tableData.capacity !== null
            ? tableData.capacity.toString()
            : '4'
        );
      } else {
        setTableNumber('');
        setCapacity('4');
      }
      setErrors({ number: '', capacity: '' });
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 100);
    }
  }, [show, mode, tableData]);

  if (!show) return null;

  const validateForm = () => {
    const newErrors = { number: '', capacity: '' };
    let isValid = true;

    const numValue = parseInt(tableNumber);
    if (!tableNumber || isNaN(numValue)) {
      newErrors.number = 'Table number is required';
      isValid = false;
    } else if (numValue < 1) {
      newErrors.number = 'Table number must be at least 1';
      isValid = false;
    }

    const capValue = parseInt(capacity);
    if (!capacity || isNaN(capValue)) {
      newErrors.capacity = 'Capacity is required';
      isValid = false;
    } else if (capValue < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
      isValid = false;
    } else if (capValue > 20) {
      newErrors.capacity = 'Capacity cannot exceed 20';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const numValue = parseInt(tableNumber);
    const capValue = parseInt(capacity);
    onConfirm(numValue, capValue, tableData?.id);
    
    setTableNumber('');
    setCapacity('4');
    setErrors({ number: '', capacity: '' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-modal-title"
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 id="table-modal-title" className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Table' : 'Edit Table'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={numberInputRef}
              id="tableNumber"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                setErrors({ ...errors, number: '' });
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter table number"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.number 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-200 focus:ring-gray-900 focus:border-transparent'
              }`}
              aria-invalid={errors.number ? 'true' : 'false'}
              aria-describedby={errors.number ? 'number-error' : undefined}
            />
            {errors.number && (
              <p id="number-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.number}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tableCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              id="tableCapacity"
              type="number"
              min="1"
              max="20"
              value={capacity}
              onChange={(e) => {
                setCapacity(e.target.value);
                setErrors({ ...errors, capacity: '' });
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter capacity"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.capacity 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-200 focus:ring-gray-900 focus:border-transparent'
              }`}
              aria-invalid={errors.capacity ? 'true' : 'false'}
              aria-describedby={errors.capacity ? 'capacity-error' : undefined}
            />
            {errors.capacity && (
              <p id="capacity-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.capacity}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!tableNumber || !capacity}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'Add Table' : 'Update Table'}
          </button>
        </div>
      </div>
    </div>
  );
}
