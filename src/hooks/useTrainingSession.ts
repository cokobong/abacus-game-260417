import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerSource, SubmissionResult, TrainingAnswer, TrainingProblem, TrainingSession } from '../types/game';
import { playSound } from '../audio/audioManager';

const NEXT_PROBLEM_DELAY_MS = 650;
const INITIAL_FEEDBACK = '정답을 입력하고 확인해보세요.';
const RESET_TRAINING_FEEDBACK = '주판알을 새 답에 맞게 움직인 뒤 리턴 버튼을 눌러주세요.';

interface UseTrainingSessionOptions {
  onCorrectAnswer?: (answer: TrainingAnswer) => void;
  onSetComplete?: (session: TrainingSession) => void;
  formatCorrectRewardFeedback?: () => string;
  formatSetCompleteFeedback?: () => string;
  resetKey?: string;
}

function createSession(problems: TrainingProblem[]): TrainingSession {
  return {
    id: `training-${Date.now()}`,
    status: 'running',
    problems,
    currentProblemIndex: 0,
    answers: [],
    startedAt: Date.now(),
    completedAt: null,
  };
}

function parseSubmittedValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useTrainingSession(problems: TrainingProblem[], options: UseTrainingSessionOptions = {}) {
  const [session, setSession] = useState<TrainingSession>(() => createSession(problems));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult>(null);
  const problemStartedAtRef = useRef(Date.now());
  const nextProblemTimerRef = useRef<number | null>(null);
  const answerRef = useRef('');
  const sessionRef = useRef(session);
  const setCompleteRewardGrantedRef = useRef(false);

  sessionRef.current = session;
  answerRef.current = answer;

  const currentProblem = session.problems[session.currentProblemIndex] ?? session.problems[0];
  const isSetComplete = session.status === 'completed';
  const wrongCount = useMemo(() => session.answers.filter((item) => !item.isCorrect).length, [session.answers]);
  const lastAnswerResult = submissionResult;

  const correctCount = useMemo(() => {
    const correctProblemIds = new Set(session.answers.filter((item) => item.isCorrect).map((item) => item.problemId));
    return correctProblemIds.size;
  }, [session.answers]);
  const completedProblemIds = useMemo(() => new Set(session.answers.filter((item) => item.isCorrect).map((item) => item.problemId)), [session.answers]);
  const answeredCount = completedProblemIds.size;

  useEffect(() => {
    return () => {
      if (nextProblemTimerRef.current !== null) {
        window.clearTimeout(nextProblemTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    clearNextProblemTimer();
    const nextSession = createSession(problems);
    setSession(nextSession);
    sessionRef.current = nextSession;
    setAnswer('');
    answerRef.current = '';
    setFeedback(INITIAL_FEEDBACK);
    setSubmissionResult(null);
    problemStartedAtRef.current = Date.now();
    setCompleteRewardGrantedRef.current = false;
  }, [problems, options.resetKey]);

  function clearNextProblemTimer() {
    if (nextProblemTimerRef.current !== null) {
      window.clearTimeout(nextProblemTimerRef.current);
      nextProblemTimerRef.current = null;
    }
  }

  function resetInput(message = RESET_TRAINING_FEEDBACK) {
    clearNextProblemTimer();
    setAnswer('');
    answerRef.current = '';
    setFeedback(message);
    setSubmissionResult(null);
    problemStartedAtRef.current = Date.now();
  }

  function resetSession(nextProblems = problems) {
    clearNextProblemTimer();
    const nextSession = createSession(nextProblems);
    setSession(nextSession);
    sessionRef.current = nextSession;
    setAnswer('');
    answerRef.current = '';
    setFeedback(INITIAL_FEEDBACK);
    setSubmissionResult(null);
    problemStartedAtRef.current = Date.now();
    setCompleteRewardGrantedRef.current = false;
  }

  function handleAnswerChange(value: string) {
    if (sessionRef.current.status === 'completed' || sessionRef.current.status === 'showing_feedback') return;

    setAnswer(value);
    answerRef.current = value;
    if (submissionResult === 'wrong') {
      setSubmissionResult(null);
      setFeedback(INITIAL_FEEDBACK);
    }
  }

  function chooseProblem(index: number) {
    if (index < 0 || index >= sessionRef.current.problems.length) return;

    setSession((current) => ({
      ...current,
      status: 'running',
      currentProblemIndex: index,
      completedAt: null,
    }));
    resetInput();
  }

  function moveToNextProblem() {
    const current = sessionRef.current;
    const nextIndex = current.currentProblemIndex + 1;
    setAnswer('');
    answerRef.current = '';
    setSubmissionResult(null);
    problemStartedAtRef.current = Date.now();
    nextProblemTimerRef.current = null;

    if (nextIndex >= current.problems.length) {
      const completedSession = {
        ...current,
        status: 'completed' as const,
        completedAt: Date.now(),
      };
      setSession((latest) => ({
        ...latest,
        status: 'completed',
        completedAt: completedSession.completedAt,
      }));
      sessionRef.current = completedSession;
      if (!setCompleteRewardGrantedRef.current) {
        setCompleteRewardGrantedRef.current = true;
        options.onSetComplete?.(completedSession);
      }
      setFeedback(options.formatSetCompleteFeedback?.() ?? '세트 완료! 보상이 더미 상태에 반영되었습니다.');
      return;
    }

    setSession((latest) => ({
      ...latest,
      status: 'running',
      currentProblemIndex: nextIndex,
    }));
    setFeedback(RESET_TRAINING_FEEDBACK);
  }

  function submitAnswer(source: AnswerSource, overrideValue = answerRef.current) {
    const currentSession = sessionRef.current;
    const activeProblem = currentSession.problems[currentSession.currentProblemIndex];
    if (!activeProblem || currentSession.status === 'completed' || currentSession.status === 'showing_feedback') {
      return;
    }

    playSound('training_submit');
    const rawInput = overrideValue.trim();
    if (!rawInput) {
      setFeedback('답을 먼저 입력해주세요.');
      return;
    }

    const submittedValue = parseSubmittedValue(rawInput);
    if (submittedValue === null) {
      setFeedback('숫자로 된 답을 입력해주세요.');
      setSubmissionResult('wrong');
      playSound('training_wrong');
      return;
    }

    const isCorrect = submittedValue === activeProblem.correctAnswer;
    const wasAlreadyCorrect = currentSession.answers.some((item) => item.problemId === activeProblem.id && item.isCorrect);
    const submittedAt = Date.now();
    const answerRecord: TrainingAnswer = {
      id: `answer-${submittedAt}-${currentSession.answers.length}`,
      problemId: activeProblem.id,
      problemIndex: currentSession.currentProblemIndex,
      submittedValue,
      rawInput,
      source,
      isCorrect,
      submittedAt,
      elapsedMsFromProblemStart: submittedAt - problemStartedAtRef.current,
    };

    setAnswer(rawInput);
    answerRef.current = rawInput;
    setSession((current) => ({
      ...current,
      status: isCorrect ? 'showing_feedback' : 'running',
      answers: [...current.answers, answerRecord],
    }));

    if (!isCorrect) {
      setSubmissionResult('wrong');
      playSound('training_wrong');
      setFeedback('조금만 더 생각해볼까요? 주판으로 다시 맞춰보세요.');
      return;
    }

    setSubmissionResult('correct');
    playSound('training_correct');
    if (!wasAlreadyCorrect) {
      options.onCorrectAnswer?.(answerRecord);
    }

    const isLastProblem = currentSession.currentProblemIndex >= currentSession.problems.length - 1;
    setFeedback(isLastProblem ? '정답! 세트 완료 보상까지 곧 반영됩니다.' : options.formatCorrectRewardFeedback?.() ?? '정답! 보상이 더미 상태에 반영되었습니다.');
    clearNextProblemTimer();
    nextProblemTimerRef.current = window.setTimeout(moveToNextProblem, NEXT_PROBLEM_DELAY_MS);
  }

  function reportBluetoothParseError() {
    if (sessionRef.current.status === 'completed' || sessionRef.current.status === 'showing_feedback') return;

    setFeedback('주판 값을 읽지 못했어요. 주판알을 답에 맞게 움직이고 다시 눌러주세요.');
  }

  return {
    session,
    currentProblem,
    currentProblemIndex: session.currentProblemIndex,
    totalProblems: session.problems.length,
    wrongCount,
    answeredCount,
    completedProblemIds,
    isSessionComplete: isSetComplete,
    sessionStartedAt: session.startedAt,
    sessionCompletedAt: session.completedAt,
    lastAnswerResult,
    answer,
    feedback,
    submissionResult,
    isSetComplete,
    correctCount,
    setAnswer: handleAnswerChange,
    chooseProblem,
    restartSession: resetSession,
    submitAnswer,
    reportBluetoothParseError,
  };
}
