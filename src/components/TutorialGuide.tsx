import { useState, useCallback, useEffect, useRef } from 'react';
import { Tutorial, TutorialStep, TutorialState, TutorialProgress, TUTORIALS, CATEGORY_LABELS, DIFFICULTY_LABELS, calculateTutorialProgress, getRecommendedTutorials } from '@/data/tutorials';
import './TutorialGuide.css';

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial?: (tutorial: Tutorial) => void;
  initialTutorialId?: string;
}

export function TutorialGuide({ isOpen, onClose, onStartTutorial, initialTutorialId }: TutorialGuideProps) {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentTutorial: null,
    currentStepIndex: 0,
    progress: [],
    isCompleted: {},
  });

  const [showStepOverlay, setShowStepOverlay] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  useEffect(() => {
    if (initialTutorialId) {
      const tutorial = TUTORIALS.find(t => t.id === initialTutorialId);
      if (tutorial) {
        startTutorial(tutorial);
      }
    }
  }, [initialTutorialId]);

  const startTutorial = useCallback((tutorial: Tutorial) => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentTutorial: tutorial,
      currentStepIndex: 0,
    }));
    setShowStepOverlay(true);
    onStartTutorial?.(tutorial);
    updateHighlight(tutorial.steps[0]);
  }, [onStartTutorial]);

  const updateHighlight = useCallback((step: TutorialStep) => {
    if (step.target && step.highlight) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.currentTutorial) return prev;

      const currentStep = prev.currentTutorial.steps[prev.currentStepIndex];
      const newProgress = [...prev.progress];
      const progressIndex = newProgress.findIndex(p => p.tutorialId === prev.currentTutorial!.id);

      if (progressIndex >= 0) {
        if (!newProgress[progressIndex].completedSteps.includes(currentStep.id)) {
          newProgress[progressIndex].completedSteps.push(currentStep.id);
        }
        newProgress[progressIndex].currentStep = prev.currentStepIndex + 1;
      } else {
        newProgress.push({
          tutorialId: prev.currentTutorial.id,
          completedSteps: [currentStep.id],
          currentStep: 1,
          startedAt: new Date(),
        });
      }

      if (prev.currentStepIndex < prev.currentTutorial.steps.length - 1) {
        const nextStepIndex = prev.currentStepIndex + 1;
        updateHighlight(prev.currentTutorial.steps[nextStepIndex]);
        return {
          ...prev,
          currentStepIndex: nextStepIndex,
          progress: newProgress,
        };
      } else {
        setShowStepOverlay(false);
        setHighlightRect(null);
        return {
          ...prev,
          isActive: false,
          currentTutorial: null,
          currentStepIndex: 0,
          progress: newProgress,
          isCompleted: { ...prev.isCompleted, [prev.currentTutorial.id]: true },
        };
      }
    });
  }, [updateHighlight]);

  const skipTutorial = useCallback(() => {
    setShowStepOverlay(false);
    setHighlightRect(null);
    setState(prev => ({
      ...prev,
      isActive: false,
      currentTutorial: null,
      currentStepIndex: 0,
    }));
  }, []);

  const closeGuide = useCallback(() => {
    skipTutorial();
    onClose();
  }, [skipTutorial, onClose]);

  const currentStep = state.currentTutorial?.steps[state.currentStepIndex];

  const filteredTutorials = TUTORIALS.filter(t => {
    if (activeTab === 'all') return true;
    return t.category === activeTab;
  });

  const completedCount = Object.keys(state.isCompleted).length;
  const totalCount = TUTORIALS.length;

  if (!isOpen) return null;

  return (
    <div className="tutorial-guide-overlay">
      <div className="tutorial-guide">
        <div className="tutorial-guide-header">
          <div className="tutorial-guide-title">
            <span className="tutorial-guide-icon">📚</span>
            <span>教程指南</span>
          </div>
          <button className="tutorial-guide-close" onClick={closeGuide}>×</button>
        </div>

        <div className="tutorial-guide-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="progress-text">{completedCount}/{totalCount} 教程完成</span>
        </div>

        <div className="tutorial-guide-tabs">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? '全部' : CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="tutorial-list">
          {filteredTutorials.map(tutorial => {
            const isCompleted = state.isCompleted[tutorial.id];
            const progress = state.progress.find(p => p.tutorialId === tutorial.id);
            const progressPercent = calculateTutorialProgress(tutorial, progress?.completedSteps || []);

            return (
              <div
                key={tutorial.id}
                className={`tutorial-card ${isCompleted ? 'completed' : ''}`}
                onClick={() => !isCompleted && startTutorial(tutorial)}
              >
                <div className="tutorial-card-header">
                  <span className="tutorial-icon">{tutorial.icon}</span>
                  <div className="tutorial-info">
                    <h3 className="tutorial-title">{tutorial.title}</h3>
                    <span className="tutorial-duration">{tutorial.duration}</span>
                  </div>
                  {isCompleted && <span className="completed-badge">✓</span>}
                </div>
                <p className="tutorial-description">{tutorial.description}</p>
                <div className="tutorial-footer">
                  <span className={`difficulty difficulty-${tutorial.difficulty}`}>
                    {DIFFICULTY_LABELS[tutorial.difficulty]}
                  </span>
                  <span className="tutorial-steps">{tutorial.steps.length} 步骤</span>
                </div>
                {progressPercent > 0 && progressPercent < 100 && (
                  <div className="tutorial-progress">
                    <div className="mini-progress" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="tutorial-guide-footer">
          <button className="btn-close" onClick={closeGuide}>关闭</button>
        </div>
      </div>

      {showStepOverlay && currentStep && (
        <div className="tutorial-step-overlay">
          <div className="tutorial-spotlight" style={{
            top: highlightRect ? highlightRect.top - 8 : 0,
            left: highlightRect ? highlightRect.left - 8 : 0,
            width: highlightRect ? highlightRect.width + 16 : '100%',
            height: highlightRect ? highlightRect.height + 16 : '100%',
          }} />
          
          <div className={`tutorial-step-card ${currentStep.position || 'bottom'}`} style={{
            top: highlightRect ? highlightRect.bottom + 16 : '50%',
            left: highlightRect ? Math.max(16, highlightRect.left) : '50%',
          }}>
            <div className="step-indicator">
              <span className="step-number">{state.currentStepIndex + 1}</span>
              <span className="step-total">/{state.currentTutorial?.steps.length}</span>
            </div>
            <h4 className="step-title">{currentStep.title}</h4>
            <p className="step-description">{currentStep.description}</p>
            
            {currentStep.action && (
              <div className="step-action">
                <span className="action-icon">👆</span>
                <span>{currentStep.action.description}</span>
              </div>
            )}

            <div className="step-buttons">
              {currentStep.skipButton && (
                <button className="btn-skip" onClick={skipTutorial}>
                  {currentStep.skipButton}
                </button>
              )}
              <button className="btn-next" onClick={nextStep}>
                {currentStep.nextButton || '下一步'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TutorialHint() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="tutorial-hint" onClick={() => setVisible(false)}>
      <span className="hint-icon">💡</span>
      <span className="hint-text">点击查看教程指南</span>
      <button className="hint-dismiss">×</button>
    </div>
  );
}
