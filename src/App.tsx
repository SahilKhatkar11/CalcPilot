import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DisplayScreen } from './components/DisplayScreen';
import { ButtonGrid } from './components/ButtonGrid';
import { HistoryPanel } from './components/HistoryPanel';
import { Footer } from './components/Footer';
import { HistoryItem, ButtonType } from './types';
import { evaluateExpressionString } from './utils/calculator';

export const App: React.FC = () => {
  // Calculator state
  const [displayStr, setDisplayStr] = useState<string>('0');
  const [evalStr, setEvalStr] = useState<string>('');
  const [displayHistory, setDisplayHistory] = useState<string>('');
  const [showingResult, setShowingResult] = useState<boolean>(false);
  const [lastExpression, setLastExpression] = useState<string>('');
  const [lastEvalStr, setLastEvalStr] = useState<string>('');
  const [lastHistory, setLastHistory] = useState<string>('');

  // UI States
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [dotState, setDotState] = useState<{ red: boolean; yellow: boolean; green: boolean }>({
    red: false,
    yellow: false,
    green: false,
  });
  const [activeGlows, setActiveGlows] = useState<{ [btnId: string]: string }>({});

  const glowIndexRef = useRef<number>(0);
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calc_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized: HistoryItem[] = parsed.map((item: Partial<HistoryItem>, idx: number) => ({
            id: item.id || `hist-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            expression: item.expression || '',
            result: item.result || '',
            timestamp: item.timestamp || Date.now(),
          }));
          setHistory(sanitized);
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const addHistoryItem = useCallback((expression: string, result: string) => {
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].expression === expression && prev[0].result === result) {
        return prev;
      }
      const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        expression,
        result,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...prev].slice(0, 50);
      try {
        localStorage.setItem('calc_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history to localStorage', e);
      }
      return updated;
    });
  }, []);

  // Dot glow trigger
  const triggerDotGlow = useCallback((isAllThree: boolean) => {
    if (dotTimeoutRef.current) clearTimeout(dotTimeoutRef.current);

    if (isAllThree) {
      setDotState({ red: true, yellow: true, green: true });
      dotTimeoutRef.current = setTimeout(() => {
        setDotState({ red: false, yellow: false, green: false });
      }, 500);
    } else {
      const index = glowIndexRef.current;
      if (index === 0) setDotState({ red: true, yellow: false, green: false });
      else if (index === 1) setDotState({ red: false, yellow: true, green: false });
      else if (index === 2) setDotState({ red: false, yellow: false, green: true });

      glowIndexRef.current = (index + 1) % 3;

      dotTimeoutRef.current = setTimeout(() => {
        setDotState({ red: false, yellow: false, green: false });
      }, 300);
    }
  }, []);

  // Neighborhood Light Leak Proximity Effect Generator
  const triggerGlowEffects = useCallback(
    (row: number, col: number, type: ButtonType, key: string) => {
      const isAllThree = key === '=' || key === 'C';
      triggerDotGlow(isAllThree);

      let colorType = 'white';
      let activeClass = 'glow-btn-active-white';
      if (type === 'operator') {
        colorType = 'orange';
        activeClass = 'glow-btn-active-orange';
      } else if (type === 'utility') {
        colorType = 'gray';
        activeClass = 'glow-btn-active-gray';
      }

      const activeBtnId = `btn-${row}-${col}`;
      const newGlows: { [btnId: string]: string } = { [activeBtnId]: activeClass };

      // Calculate neighbors for proximity light leak
      for (let r = 0; r <= 5; r++) {
        for (let c = 0; c <= 3; c++) {
          if (r === row && c === col) continue;

          let isNeighbor = false;
          let relation = '';

          if (r === row - 1 && c === col) {
            isNeighbor = true;
            relation = 'up';
          } else if (r === row + 1 && c === col) {
            isNeighbor = true;
            relation = 'down';
          } else if (r === row && c === col - 1) {
            isNeighbor = true;
            relation = 'left';
          } else if (r === row && c === col + 1) {
            isNeighbor = true;
            relation = 'right';
          } else if (r === row - 1 && c === col - 1) {
            isNeighbor = true;
            relation = 'up-left';
          } else if (r === row - 1 && c === col + 1) {
            isNeighbor = true;
            relation = 'up-right';
          } else if (r === row + 1 && c === col - 1) {
            isNeighbor = true;
            relation = 'down-left';
          } else if (r === row + 1 && c === col + 1) {
            isNeighbor = true;
            relation = 'down-right';
          }

          // Special multi-span row 5, col 0 button "0"
          if (row === 5 && col === 0) {
            if (r === 4 && (c === 0 || c === 1)) {
              isNeighbor = true;
              relation = 'up';
            }
            if (r === 5 && c === 2) {
              isNeighbor = true;
              relation = 'right';
            }
          }
          if (r === 5 && c === 0) {
            if (row === 4 && (col === 0 || col === 1)) {
              isNeighbor = true;
              relation = 'down';
            }
            if (row === 5 && col === 2) {
              isNeighbor = true;
              relation = 'left';
            }
          }

          if (isNeighbor && relation) {
            let side = '';
            if (relation === 'up') side = 'bottom';
            else if (relation === 'down') side = 'top';
            else if (relation === 'left') side = 'right';
            else if (relation === 'right') side = 'left';
            else if (relation === 'up-left') side = 'bottom-right';
            else if (relation === 'up-right') side = 'bottom-left';
            else if (relation === 'down-left') side = 'top-right';
            else if (relation === 'down-right') side = 'top-left';

            // Determine leak color based on source OR target button type
            // Any interaction touching an operator button (orange) MUST be orange.
            const isSourceOperator = type === 'operator' || (col === 3 && row >= 1);
            const isTargetOperator = c === 3 && r >= 1;
            const isSourceUtility = type === 'utility' || row === 0;
            const isTargetUtility = r === 0 || (r === 1 && c <= 2);

            let leakColor = 'white';
            if (isSourceOperator || isTargetOperator) {
              leakColor = 'orange';
            } else if (isSourceUtility || isTargetUtility) {
              leakColor = 'gray';
            }

            newGlows[`btn-${r}-${c}`] = `glow-edge-${side}-${leakColor}`;
          }
        }
      }

      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
      setActiveGlows(newGlows);

      glowTimeoutRef.current = setTimeout(() => {
        setActiveGlows({});
      }, 160);
    },
    [triggerDotGlow]
  );

  // Evaluate Expression Handler
  const evaluateExpression = useCallback(() => {
    if (!evalStr) return;

    const openParens = (evalStr.match(/\(/g) || []).length;
    const closeParens = (evalStr.match(/\)/g) || []).length;
    const missingParens = Math.max(0, openParens - closeParens);

    const { resultStr, status } = evaluateExpressionString(evalStr);

    const exprText = (displayStr === '0' ? '' : displayStr) + ')'.repeat(missingParens);

    if (status === 'success') {
      const historyText = `${exprText} = ${resultStr}`;
      setLastExpression(exprText);
      setLastEvalStr(evalStr + ')'.repeat(missingParens));
      setLastHistory(historyText);

      setDisplayStr(resultStr);
      setEvalStr(resultStr);
      setDisplayHistory(historyText);
      setShowingResult(true);

      addHistoryItem(exprText, resultStr);
    } else if (status === 'div0') {
      setDisplayStr('Error: Div by 0');
      setEvalStr('');
      setShowingResult(true);
      setLastExpression('');
      setLastEvalStr('');
      const hist = 'Division by zero';
      setLastHistory(hist);
      setDisplayHistory(hist);
    } else {
      setDisplayStr('Error');
      setEvalStr('');
      setShowingResult(true);
      setLastExpression('');
      setLastEvalStr('');
      const hist = 'Malformed Syntax';
      setLastHistory(hist);
      setDisplayHistory(hist);
    }
  }, [evalStr, displayStr, addHistoryItem]);

  // Key press handler
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'C') {
        setDisplayStr('0');
        setEvalStr('');
        setShowingResult(false);
        setLastExpression('');
        setLastEvalStr('');
        setLastHistory('');
        setDisplayHistory('');
        return;
      }

      if (key === 'backspace') {
        if (showingResult) {
          setShowingResult(false);
          if (displayStr.startsWith('Error')) {
            if (lastExpression) {
              setDisplayStr(lastExpression);
              setEvalStr(lastEvalStr);
              setLastExpression('');
              setLastEvalStr('');
              setLastHistory('');
              setDisplayHistory('');
            } else {
              setDisplayStr('0');
              setEvalStr('');
              setDisplayHistory('');
            }
            return;
          }
        }

        let currDisplay = displayStr;
        let currEval = evalStr;

        if (currDisplay.length > 0 && currDisplay !== '0') {
          if (currDisplay.endsWith('√(')) {
            currDisplay = currDisplay.slice(0, -2);
            if (currEval.endsWith('Math.sqrt(')) {
              currEval = currEval.slice(0, -10);
            }
          } else if (currDisplay.endsWith('^')) {
            currDisplay = currDisplay.slice(0, -1);
            if (currEval.endsWith('**')) {
              currEval = currEval.slice(0, -2);
            }
          } else if (currDisplay.endsWith(' ÷ ')) {
            currDisplay = currDisplay.slice(0, -3);
            if (currEval.endsWith('/')) {
              currEval = currEval.slice(0, -1);
            }
          } else if (currDisplay.endsWith(' × ')) {
            currDisplay = currDisplay.slice(0, -3);
            if (currEval.endsWith('*')) {
              currEval = currEval.slice(0, -1);
            }
          } else if (currDisplay.endsWith(' + ')) {
            currDisplay = currDisplay.slice(0, -3);
            if (currEval.endsWith('+')) {
              currEval = currEval.slice(0, -1);
            }
          } else if (currDisplay.endsWith(' - ')) {
            currDisplay = currDisplay.slice(0, -3);
            if (currEval.endsWith('-')) {
              currEval = currEval.slice(0, -1);
            }
          } else {
            currDisplay = currDisplay.slice(0, -1);
            currEval = currEval.slice(0, -1);
          }
        }

        if ((!currDisplay || currDisplay === '-') && lastExpression) {
          setDisplayStr(lastExpression);
          setEvalStr(lastEvalStr);
          setLastExpression('');
          setLastEvalStr('');
          setLastHistory('');
          setDisplayHistory('');
        } else {
          setDisplayStr(currDisplay || '0');
          setEvalStr(currEval);
          setDisplayHistory(lastHistory);
        }
        return;
      }

      if (key === '=') {
        evaluateExpression();
        return;
      }

      const isOperator = ['+', '-', '*', '/', '**', '%'].includes(key);

      // Prevent consecutive operators
      if (isOperator && evalStr) {
        if (
          evalStr.endsWith('+') ||
          evalStr.endsWith('-') ||
          evalStr.endsWith('*') ||
          evalStr.endsWith('/') ||
          evalStr.endsWith('**')
        ) {
          return;
        }
      }

      let newDisplay = displayStr;
      let newEval = evalStr;

      if (showingResult) {
        if (isOperator) {
          setShowingResult(false);
          // Keep displayStr and evalStr as the current result to continue calculating
        } else {
          newDisplay = '';
          newEval = '';
          setShowingResult(false);
          setLastExpression('');
          setLastEvalStr('');
          setLastHistory('');
          setDisplayHistory('');
        }
      }

      if ((newDisplay === '0' || newDisplay === '') && !isOperator && key !== '.') {
        newDisplay = '';
        newEval = '';
      }

      if ((newDisplay === '' || newDisplay === '0') && isOperator) {
        newDisplay = '0';
        newEval = '0';
      }

      if (key === 'sqrt') {
        if (showingResult || newDisplay === '' || newDisplay === '0') {
          newDisplay = '√(';
          newEval = 'Math.sqrt(';
          setShowingResult(false);
        } else {
          newDisplay += '√(';
          newEval += 'Math.sqrt(';
        }
      } else if (key === '**') {
        newDisplay += '^';
        newEval += '**';
      } else if (key === '*') {
        newDisplay += ' × ';
        newEval += '*';
      } else if (key === '/') {
        newDisplay += ' ÷ ';
        newEval += '/';
      } else if (key === '+') {
        newDisplay += ' + ';
        newEval += '+';
      } else if (key === '-') {
        newDisplay += ' - ';
        newEval += '-';
      } else if (key === '%') {
        newDisplay += '%';
        newEval += '/100';
      } else {
        newDisplay += key;
        newEval += key;
      }

      setDisplayStr(newDisplay);
      setEvalStr(newEval);
      setDisplayHistory(lastHistory);
    },
    [displayStr, evalStr, showingResult, lastExpression, lastEvalStr, lastHistory, evaluateExpression]
  );

  // Copy expression handler
  const handleCopy = useCallback(() => {
    let textToCopy = '';
    const histText = displayHistory.trim();
    const valText = displayStr.trim();

    if (
      histText &&
      histText !== 'Division by zero' &&
      histText !== 'Malformed Syntax' &&
      histText !== valText
    ) {
      if (histText.includes('=')) {
        if (histText.endsWith(`= ${valText}`) || histText.endsWith(`=${valText}`)) {
          textToCopy = histText;
        } else {
          textToCopy = valText;
        }
      } else {
        textToCopy = `${histText} = ${valText}`;
      }
    } else {
      textToCopy = valText || '0';
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('Copy fallback failed', e);
      }
      document.body.removeChild(textArea);
    }

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  }, [displayHistory, displayStr]);

  // History selection
  const handleSelectHistoryItem = useCallback((item: HistoryItem) => {
    setDisplayStr(item.result);
    setEvalStr(item.result);
    setShowingResult(true);
    setLastExpression(item.expression);
    setLastEvalStr(
      item.expression
        .replace(/ ÷ /g, '/')
        .replace(/ × /g, '*')
        .replace(/\^/g, '**')
        .replace(/√\(/g, 'Math.sqrt(')
    );
    const hist = `${item.expression} = ${item.result}`;
    setLastHistory(hist);
    setDisplayHistory(hist);
    setIsHistoryOpen(false);
  }, []);

  // Physical keyboard binding listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events if user is typing in a text field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key;
      let targetKey: string | null = null;
      let row = -1;
      let col = -1;
      let type: ButtonType = 'number';

      if (key >= '0' && key <= '9') {
        targetKey = key;
        type = 'number';
        if (key === '0') {
          row = 5;
          col = 0;
        } else {
          const num = parseInt(key);
          row = 4 - Math.floor((num - 1) / 3);
          col = (num - 1) % 3;
        }
      } else if (key === '.') {
        targetKey = '.';
        type = 'number';
        row = 5;
        col = 2;
      } else if (key === '+') {
        targetKey = '+';
        type = 'operator';
        row = 4;
        col = 3;
      } else if (key === '-') {
        targetKey = '-';
        type = 'operator';
        row = 3;
        col = 3;
      } else if (key === '*') {
        targetKey = '*';
        type = 'operator';
        row = 2;
        col = 3;
      } else if (key === '/') {
        targetKey = '/';
        type = 'operator';
        row = 1;
        col = 3;
      } else if (key === '%') {
        targetKey = '%';
        type = 'utility';
        row = 1;
        col = 2;
      } else if (key === '(') {
        targetKey = '(';
        type = 'utility';
        row = 0;
        col = 0;
      } else if (key === ')') {
        targetKey = ')';
        type = 'utility';
        row = 0;
        col = 1;
      } else if (key === '^') {
        targetKey = '**';
        type = 'utility';
        row = 0;
        col = 2;
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        targetKey = '=';
        type = 'operator';
        row = 5;
        col = 3;
      } else if (key === 'Backspace') {
        targetKey = 'backspace';
        type = 'utility';
        row = 1;
        col = 1;
      } else if (key.toLowerCase() === 'c' || key === 'Escape') {
        targetKey = 'C';
        type = 'utility';
        row = 1;
        col = 0;
      }

      if (targetKey && row !== -1 && col !== -1) {
        triggerGlowEffects(row, col, type, targetKey);
        handleKeyPress(targetKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, triggerGlowEffects]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white select-none relative p-0 overflow-x-hidden">
      {/* Ambient glassmorphic glowing decorative blobs in background */}
      <div className="absolute w-[800px] h-[800px] bg-[#ff9f0a] opacity-[0.05] rounded-full blur-[120px] -top-40 -left-40 -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600 opacity-[0.05] rounded-full blur-[100px] bottom-0 right-0 -z-10" />

      {/* Main Wrapper Grouping Calculator & Footnote */}
      <div className="flex flex-col items-center w-full max-w-[450px] px-1 sm:px-2 my-auto py-1 sm:py-2">
        <div className="glass-calculator w-full p-3.5 sm:p-5 relative overflow-hidden">
          {/* History Panel Overlay */}
          <HistoryPanel
            isOpen={isHistoryOpen}
            history={history}
            onClose={() => setIsHistoryOpen(false)}
            onClear={() => {
              setHistory([]);
              try {
                localStorage.removeItem('calc_history');
              } catch (e) {
                console.warn('Failed to clear localStorage', e);
              }
            }}
            onSelect={handleSelectHistoryItem}
          />

          {/* Header Controls */}
          <Header
            dotState={dotState}
            onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
            onCopy={handleCopy}
            isCopied={isCopied}
          />

          {/* Digital Display Screen */}
          <DisplayScreen
            displayValue={displayStr}
            displayHistory={displayHistory}
          />

          {/* Keypad Grid */}
          <ButtonGrid
            onKeyPress={handleKeyPress}
            onTriggerGlow={triggerGlowEffects}
            activeGlows={activeGlows}
          />

          {/* Home Indicator bar */}
          <div className="mt-4 text-center">
            <div className="w-32 h-1 bg-white/10 rounded-full mx-auto" />
          </div>
        </div>

        {/* Developer Footnote */}
        <Footer />
      </div>
    </div>
  );
};
