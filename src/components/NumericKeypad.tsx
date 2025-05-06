
import React from 'react';
import { Button } from "@/components/ui/button";

interface NumericKeypadProps {
  onKeyPress: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onClear, onSubmit }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'Clear', '0', 'Enter'
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'Clear') {
      onClear();
    } else if (key === 'Enter') {
      onSubmit();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <Button
          key={key}
          type="button"
          variant={key === 'Enter' ? "default" : key === 'Clear' ? "outline" : "secondary"}
          className={`py-4 ${key === 'Enter' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          onClick={() => handleKeyPress(key)}
        >
          {key}
        </Button>
      ))}
    </div>
  );
};

export default NumericKeypad;
