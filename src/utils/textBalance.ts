/**
 * Athenaeum Editorial Text Balancing & Layout Stability Utility
 * Inspired by A24 editorial typographic systems (https://a24.raviklaassens.com/)
 */

import React, { useMemo, useRef, useEffect } from 'react';

/**
 * Balances an array of words across target line count by minimizing
 * cumulative absolute deviation from the target average line length.
 * 
 * Time complexity: O(K * N^2) with memoization.
 */
export function balanceWords(words: string[], lineCount: number): string[] {
  if (lineCount <= 1 || words.length <= 1) {
    return [words.join(' ')];
  }

  // Clamp lines to word count so empty lines are never created
  const k = Math.min(lineCount, words.length);
  if (k <= 1) {
    return [words.join(' ')];
  }

  const fullText = words.join(' ');
  const targetAverageLength = fullText.length / k;

  // Memoization table: key = `${wordIndex}:${remainingLines}`
  const memo = new Map<string, { lines: string[]; score: number }>();

  function search(wordIndex: number, remainingLines: number): { lines: string[]; score: number } {
    const key = `${wordIndex}:${remainingLines}`;
    const cached = memo.get(key);
    if (cached) return cached;

    const remainingWords = words.length - wordIndex;
    if (remainingLines === 1 || remainingWords <= 1) {
      const line = words.slice(wordIndex).join(' ');
      const result = {
        lines: [line],
        score: Math.abs(line.length - targetAverageLength),
      };
      memo.set(key, result);
      return result;
    }

    let bestLines: string[] = [];
    let bestScore = Infinity;

    // Must leave at least (remainingLines - 1) words for subsequent lines
    const maxWordsForThisLine = remainingWords - (remainingLines - 1);

    for (let count = 1; count <= maxWordsForThisLine; count++) {
      const line = words.slice(wordIndex, wordIndex + count).join(' ');
      const thisLineScore = Math.abs(line.length - targetAverageLength);
      const sub = search(wordIndex + count, remainingLines - 1);
      const totalScore = thisLineScore + sub.score;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestLines = [line, ...sub.lines];
      }
    }

    const result = { lines: bestLines, score: bestScore };
    memo.set(key, result);
    return result;
  }

  return search(0, k).lines;
}

/**
 * Splits raw text into balanced lines minimizing deviation from average line length.
 */
export function balanceText(text: string, lineCount: number): string[] {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const words = normalized.split(' ');
  if (words.length <= 1 || lineCount < 2) {
    return [normalized];
  }

  return balanceWords(words, lineCount);
}

/**
 * Scans root element for [data-balance-lines] and dynamically inserts
 * child span[data-balance-line] elements while preserving text continuity.
 */
export function applyTextBalancing(rootElement: HTMLElement | Document = document): void {
  const elements = rootElement.querySelectorAll<HTMLElement>('[data-balance-lines]');
  elements.forEach((el) => {
    const attr = el.getAttribute('data-balance-lines');
    const targetLines = parseInt(attr || '', 10);
    if (!Number.isFinite(targetLines) || targetLines < 2) return;

    // Use preserved raw text to prevent corrupted re-runs
    const rawText = el.getAttribute('data-balance-source') || (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!rawText) return;

    el.setAttribute('data-balance-source', rawText);
    const words = rawText.split(' ');
    if (words.length < 2) return;

    const balanced = balanceWords(words, Math.min(targetLines, words.length));

    // Construct span[data-balance-line] child elements
    const spans = balanced.map((line, idx) => {
      const span = document.createElement('span');
      span.setAttribute('data-balance-line', '');
      span.style.display = 'block';
      // Append space for continuous text selection except on the terminal line
      span.textContent = line + (idx < balanced.length - 1 ? ' ' : '');
      return span;
    });

    el.replaceChildren(...spans);
  });
}

/**
 * Enforces vertical height reservation for elements with [data-reserve-lines].
 * Sets data-reserve-active="true" and applies minHeight with lh or em units.
 */
export function applyLineReservation(rootElement: HTMLElement | Document = document): void {
  const supportsLh = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('min-height', '1lh');
  const elements = rootElement.querySelectorAll<HTMLElement>('[data-reserve-lines]');

  elements.forEach((el) => {
    const attr = el.getAttribute('data-reserve-lines');
    const lines = parseInt(attr || '', 10);
    if (!Number.isFinite(lines) || lines < 1) {
      el.style.removeProperty('min-height');
      el.removeAttribute('data-reserve-active');
      return;
    }

    el.setAttribute('data-reserve-active', 'true');
    if (supportsLh) {
      el.style.minHeight = `${lines}lh`;
    } else {
      const computed = window.getComputedStyle(el);
      const lineHeight = parseFloat(computed.lineHeight);
      const fontSize = parseFloat(computed.fontSize);
      if (lineHeight && fontSize) {
        el.style.minHeight = `${(lineHeight / fontSize) * lines}em`;
      } else {
        el.style.minHeight = `${lines * 1.4}em`;
      }
    }
  });
}

/**
 * Initializes automatic typography balancing and line reservation lifecycle.
 * Syncs with document.fonts.ready and returns a cleanup function.
 */
export function initEditorialTypography(root: HTMLElement | Document = document): () => void {
  applyTextBalancing(root);
  applyLineReservation(root);

  if (typeof document !== 'undefined' && 'fonts' in document) {
    document.fonts.ready.then(() => {
      applyTextBalancing(root);
      applyLineReservation(root);
    });
  }

  const observer = typeof MutationObserver !== 'undefined'
    ? new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const m of mutations) {
          if (
            m.type === 'childList' ||
            (m.type === 'attributes' &&
              (m.attributeName === 'data-balance-lines' || m.attributeName === 'data-reserve-lines'))
          ) {
            shouldUpdate = true;
            break;
          }
        }
        if (shouldUpdate) {
          applyTextBalancing(root);
          applyLineReservation(root);
        }
      })
    : null;

  if (observer && root instanceof Node) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-balance-lines', 'data-reserve-lines'],
    });
  }

  return () => {
    observer?.disconnect();
  };
}

/**
 * React Hook for balanced text rendering and line reservation.
 */
export function useBalancedText(text: string, lines: number, reserveLines?: number) {
  const elementRef = useRef<HTMLElement | null>(null);

  const balancedLines = useMemo(() => {
    return balanceText(text, lines);
  }, [text, lines]);

  useEffect(() => {
    if (elementRef.current) {
      applyLineReservation(elementRef.current.parentElement || elementRef.current);
    }
  }, [reserveLines, balancedLines]);

  return {
    ref: elementRef,
    lines: balancedLines,
    'data-balance-lines': lines,
    'data-reserve-lines': reserveLines,
    'data-reserve-active': reserveLines && reserveLines > 0 ? 'true' : undefined,
  };
}

/**
 * Reusable React Component for balanced text formatting and line reservation.
 */
export interface BalancedTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  children: string;
  lines?: number;
  reserveLines?: number;
}

export const BalancedText: React.FC<BalancedTextProps> = ({
  as: Component = 'span',
  children,
  lines = 2,
  reserveLines,
  className = '',
  style,
  ...rest
}) => {
  const balancedLines = useMemo(() => {
    if (typeof children !== 'string') return [children];
    return balanceText(children, lines);
  }, [children, lines]);

  const reserve = reserveLines ?? lines;
  const reserveStyle: React.CSSProperties = reserve > 0 ? {
    minHeight: `${reserve}lh`,
    ...style,
  } : { ...style };

  const childElements = balancedLines.length > 1
    ? balancedLines.map((line, idx) =>
        React.createElement(
          'span',
          {
            key: idx,
            'data-balance-line': '',
            style: { display: 'block' },
          },
          line + (idx < balancedLines.length - 1 ? ' ' : '')
        )
      )
    : children;

  return React.createElement(
    Component,
    {
      'data-balance-lines': lines,
      'data-reserve-lines': reserve > 0 ? reserve : undefined,
      'data-reserve-active': reserve > 0 ? 'true' : undefined,
      'data-balance-source': typeof children === 'string' ? children : undefined,
      style: reserveStyle,
      className,
      ...rest,
    },
    childElements
  );
};
