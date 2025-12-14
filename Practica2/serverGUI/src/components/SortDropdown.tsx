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
    return sort.charAt(0).toUpperCase() + sort.slice(1);
  };

  const getSortIcon = (sort: SortOption): string => {
    switch(sort) {
      case 'alphabetical':
        return 'bi-sort-alpha-down';
      case 'artist':
        return 'bi-person-fill';
      case 'album':
        return 'bi-disc-fill';
      case 'year':
        return 'bi-calendar-fill';
      case 'duration':
        return 'bi-clock-fill';
    }
  };

  const handleSelect = (sort: SortOption) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  // Cerrar al hacer clic fuera
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
    <>
      <div className="dropdown sort-dropdown-container" ref={dropdownRef}>
        <button 
          className="btn dropdown-toggle sort-button" 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {/* Desktop: Texto completo */}
          <span className="sort-button-text-full">
            <i className={`bi ${getSortIcon(sortBy)} me-1`}></i>
            {getSortLabel(sortBy)}
          </span>
          
          {/* Tablet: Solo label */}
          <span className="sort-button-text-medium">
            {getSortLabel(sortBy)}
          </span>
          
          {/* Mobile: Solo icono */}
          <span className="sort-button-icon-only">
            <i className={`bi ${getSortIcon(sortBy)}`}></i>
          </span>
        </button>
        
        <ul 
          className={`dropdown-menu dropdown-menu-custom ${isOpen ? 'show' : ''}`}
        >
          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('alphabetical')}
            >
              <i className="bi bi-sort-alpha-down me-2"></i>
              <span>Alphabetical</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('artist')}
            >
              <i className="bi bi-person-fill me-2"></i>
              <span>Artist</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('album')}
            >
              <i className="bi bi-disc-fill me-2"></i>
              <span>Album</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('year')}
            >
              <i className="bi bi-calendar-fill me-2"></i>
              <span>Year</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('duration')}
            >
              <i className="bi bi-clock-fill me-2"></i>
              <span>Duration</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};