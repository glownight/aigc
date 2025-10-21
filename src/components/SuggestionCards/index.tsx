/**
 * SuggestionCards 组件 - 建议卡片
 */

import "./styles.css";

interface SuggestionCardsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestionCards({
  suggestions,
  onSelect,
}: SuggestionCardsProps) {
  return (
    <div className="suggestions">
      {suggestions.map((s) => (
        <button key={s} className="suggestion-card" onClick={() => onSelect(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
