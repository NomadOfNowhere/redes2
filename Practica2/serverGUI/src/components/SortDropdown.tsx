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
    switch(sort) {
      case 'alphabetical':
        return 'Alfabético';
      case 'artist':
        return 'Artista';
      case 'album':
        return 'Álbum';
      case 'year':
        return 'Año';
      case 'duration':
        return 'Duración';
    }
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
            SORT BY: {getSortLabel(sortBy)}
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
              <span>Alfabético</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('artist')}
            >
              <i className="bi bi-person-fill me-2"></i>
              <span>Artista</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('album')}
            >
              <i className="bi bi-disc-fill me-2"></i>
              <span>Álbum</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('year')}
            >
              <i className="bi bi-calendar-fill me-2"></i>
              <span>Año</span>
            </button>
          </li>

          <li>
            <button 
              className="dropdown-item dropdown-item-custom" 
              type="button"
              onClick={() => handleSelect('duration')}
            >
              <i className="bi bi-clock-fill me-2"></i>
              <span>Duración</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};