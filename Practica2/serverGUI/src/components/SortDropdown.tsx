import { type SortOption } from "../types/song";

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ sortBy, onSortChange }) => {
  const getSortLabel = (sort: SortOption): string => {
    return sort === 'alphabetical' ? 'Alfabético' : 'Género';
  };

  return (
    <div className="dropdown">
      <button 
        className="btn dropdown-toggle sort-button" 
        type="button" 
        id="sortDropdown" 
        data-bs-toggle="dropdown"
      >
        ORDENAR POR: {getSortLabel(sortBy)}
      </button>
      <ul className="dropdown-menu dropdown-menu-custom">
        <li>
          <a 
            className="dropdown-item dropdown-item-custom" 
            href="#" 
            onClick={(e) => { e.preventDefault(); onSortChange('alphabetical'); }}
          >
            Alfabético
          </a>
        </li>
        <li>
          <a 
            className="dropdown-item dropdown-item-custom" 
            href="#" 
            onClick={(e) => { e.preventDefault(); onSortChange('genre'); }}
          >
            Género
          </a>
        </li>
      </ul>
    </div>
  );
};