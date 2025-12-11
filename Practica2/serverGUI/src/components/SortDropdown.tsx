import React, { useState, useRef, useEffect } from 'react';
import { type SortOption } from "../types/song";

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ sortBy, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getSortLabel = (sort: SortOption): string => {
    return sort === 'alphabetical' ? 'Alfabético' : 'Año';
  };

  const handleSelect = (sort: SortOption) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button 
        className="btn dropdown-toggle sort-button" 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        ORDENAR POR: {getSortLabel(sortBy)}
      </button>
      <ul 
        className={`dropdown-menu dropdown-menu-custom ${isOpen ? 'show' : ''}`}
        style={{ position: 'absolute' }}
      >
        <li>
          <button 
            className="dropdown-item dropdown-item-custom" 
            type="button"
            onClick={() => handleSelect('alphabetical')}
          >
            Alfabético
          </button>
        </li>
        <li>
          <button 
            className="dropdown-item dropdown-item-custom" 
            type="button"
            onClick={() => handleSelect('year')}
          >
            Año
          </button>
        </li>
      </ul>
    </div>
  );
};