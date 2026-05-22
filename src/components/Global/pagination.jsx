"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage = 4,
  onItemsPerPageChange,
  showItemsPerPage = true 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1 && !showItemsPerPage) return null;

  return (
    <div className="flex flex-col gap-4 mt-12 ">
      <div className="flex flex-col sm:flex-row bg-white justify-between items-center gap-4 px-6 py-4 rounded-xl shadow-md border border-gray-100">
        {showItemsPerPage && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04413D] focus:border-transparent text-sm font-medium bg-gray-50 hover:bg-white transition-all cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
              <span className="mx-1">-</span>
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</span>
              <span className="mx-1">of</span>
              <span className="font-medium">{totalPages * itemsPerPage}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              currentPage === 1
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-800 hover:text-white hover:shadow-md'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={`w-9 h-9 rounded-lg font-medium text-sm transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-linear-to-br from-blue-900 to-blue-950 text-white shadow-md'
                    : page === '...'
                    ? 'bg-transparent cursor-default text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#04413D]'
                }`}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
          </div>
          
          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              currentPage === totalPages
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-gray-50 text-gray-600 hover:bg-[#04413D] hover:text-white hover:shadow-md'
            }`}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Page Indicator */}
      <div className="sm:hidden text-center text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default Pagination;