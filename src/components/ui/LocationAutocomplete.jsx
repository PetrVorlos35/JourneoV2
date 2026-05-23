import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LocationAutocomplete = ({ value, onChange, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const containerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sync internal state with external value if it changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=cs`,
        {
          headers: {
            'User-Agent': 'JourneoApp/1.0',
          }
        }
      );
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      // Parse data into clean format
      const formatted = data.map(item => {
        const address = item.address;
        const name = item.name || address.city || address.town || address.village || '';
        const country = address.country || '';
        const detail = [
          address.city || address.town || address.village,
          address.state,
          country
        ].filter(Boolean).filter(part => part !== name).join(', ');

        return {
          id: item.place_id,
          name: name,
          detail: detail,
          fullName: detail ? `${name}, ${detail}` : name
        };
      });

      // Filter out duplicates (Nominatim sometimes returns same place multiple times)
      const unique = formatted.filter((v, i, a) => a.findIndex(t => (t.id === v.id || t.fullName === v.fullName)) === i);
      
      setSuggestions(unique);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val); // Update parent immediately with typed text
    
    setShowSuggestions(true);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (val.trim().length >= 3) {
      debounceTimeoutRef.current = setTimeout(() => {
        searchLocations(val);
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion) => {
    setInputValue(suggestion.fullName);
    onChange(suggestion.fullName);
    setShowSuggestions(false);
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.length >= 3) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={className}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 size={18} className="text-blue-500 animate-spin" strokeWidth={2.5} />
          ) : inputValue ? (
            <button 
              onClick={clearInput}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 z-[200] glass-card shadow-2xl p-2 rounded-2xl border border-gray-100 dark:border-white/10"
          >
            <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSelect(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                  >
                    <div className="mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0">
                      <MapPin size={18} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[15px] text-gray-900 dark:text-white truncate">
                        {suggestion.name}
                      </div>
                      {suggestion.detail && (
                        <div className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                          {suggestion.detail}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 text-right pr-4 pb-2 pt-2 border-t border-gray-100 dark:border-white/5 mt-2 opacity-50">
              Data © OpenStreetMap
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationAutocomplete;
