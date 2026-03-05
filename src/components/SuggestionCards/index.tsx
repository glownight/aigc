/**
 * SuggestionCards 组件 - 建议卡片
 */

import { memo, useCallback } from "react";
import "./styles.css";

interface SuggestionCardsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SuggestionCards = memo(function SuggestionCards({
  suggestions,
  onSelect,
}: SuggestionCardsProps) {
  return (
    <div className="suggestions">
      {suggestions.map((s) => (
        <SuggestionCard key={s} suggestion={s} onSelect={onSelect} />
      ))}
    </div>
  );
});

// 单独的卡片组件，避免不必要的重渲染
interface SuggestionCardProps {
  suggestion: string;
  onSelect: (suggestion: string) => void;
}

const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onSelect,
}: SuggestionCardProps) {
  const handleClick = useCallback(() => {
    onSelect(suggestion);
  }, [onSelect, suggestion]);

  return (
    <button className="suggestion-card" onClick={handleClick}>
      {suggestion}
    </button>
  );
});

export default SuggestionCards;
