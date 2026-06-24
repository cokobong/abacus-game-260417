import type { AbacusStageConfig, DigitType, OperationMode, ProblemOperator, TrainingProblem } from '../types/game';

export interface GenerateTrainingProblemsInput {
  stage: AbacusStageConfig;
  problemCount: number;
  numberCount: number;
  digitType: DigitType;
  operationMode: OperationMode;
  seed?: number;
}

function createRandom(seed?: number) {
  if (seed === undefined) return Math.random;

  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getRandomInt(random: () => number, min: number, max: number) {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  if (safeMax <= safeMin) return safeMin;

  return Math.floor(random() * (safeMax - safeMin + 1)) + safeMin;
}

function getBaseRange(digitType: DigitType) {
  if (digitType === 'one-digit') return { min: 1, max: 9 };
  if (digitType === 'two-digit') return { min: 10, max: 99 };
  return { min: 1, max: 99 };
}

function getStageAwareRange(stage: AbacusStageConfig, digitType: DigitType) {
  const base = getBaseRange(digitType);
  const min = Math.max(base.min, stage.minNumber);
  const max = Math.min(base.max, stage.maxNumber);

  if (min <= max) return { min, max };
  return base;
}

function getRandomTerm(random: () => number, stage: AbacusStageConfig, digitType: DigitType) {
  if (digitType === 'mixed-digit') {
    const oneDigitRange = getStageAwareRange(stage, 'one-digit');
    const twoDigitRange = getStageAwareRange(stage, 'two-digit');
    const canUseOneDigit = oneDigitRange.min <= oneDigitRange.max && oneDigitRange.max <= 9;
    const canUseTwoDigit = twoDigitRange.min <= twoDigitRange.max && twoDigitRange.min >= 10;

    if (canUseOneDigit && canUseTwoDigit) {
      return random() < 0.5 ? getRandomInt(random, oneDigitRange.min, oneDigitRange.max) : getRandomInt(random, twoDigitRange.min, twoDigitRange.max);
    }
  }

  const range = getStageAwareRange(stage, digitType);
  return getRandomInt(random, range.min, range.max);
}

function calculateAnswer(numbers: number[], operators: ProblemOperator[]) {
  return operators.reduce((total, operator, index) => {
    const nextNumber = numbers[index + 1] ?? 0;
    return operator === '+' ? total + nextNumber : total - nextNumber;
  }, numbers[0] ?? 0);
}

function formatExpression(numbers: number[], operators: ProblemOperator[]) {
  return numbers
    .map((number, index) => (index === 0 ? String(number) : `${operators[index - 1]} ${number}`))
    .join(' ');
}

function buildSubtractOnlyTerms(random: () => number, stage: AbacusStageConfig, numberCount: number, digitType: DigitType) {
  const range = getStageAwareRange(stage, digitType);
  const minimumFirstNumber = Math.min(range.max, Math.max(range.min, range.min * (numberCount - 1)));
  const numbers = [getRandomInt(random, minimumFirstNumber, range.max)];
  const operators: ProblemOperator[] = [];
  let currentTotal = numbers[0];

  for (let index = 1; index < numberCount; index += 1) {
    const remainingSubtractions = numberCount - index - 1;
    const maxSubtract = Math.max(range.min, Math.min(range.max, currentTotal - remainingSubtractions * range.min));
    const nextNumber = getRandomInt(random, range.min, maxSubtract);
    numbers.push(nextNumber);
    operators.push('-');
    currentTotal -= nextNumber;
  }

  return { numbers, operators };
}

function buildTerms(random: () => number, stage: AbacusStageConfig, numberCount: number, digitType: DigitType, operationMode: OperationMode) {
  if (operationMode === 'subtract') {
    return buildSubtractOnlyTerms(random, stage, numberCount, digitType);
  }

  const range = getStageAwareRange(stage, digitType);
  const numbers = [getRandomTerm(random, stage, digitType)];
  const operators: ProblemOperator[] = [];
  let currentTotal = numbers[0];
  let usedSubtract = false;

  for (let index = 1; index < numberCount; index += 1) {
    const remainingSlots = numberCount - index;
    const shouldPreferSubtract = operationMode === 'mixed' && !usedSubtract && remainingSlots === 1;
    const shouldSubtract = operationMode === 'mixed' && (shouldPreferSubtract || random() < 0.45);

    if (shouldSubtract && !stage.allowNegative && currentTotal >= range.min) {
      const maxSubtract = Math.min(range.max, currentTotal);
      const nextNumber = getRandomInt(random, range.min, maxSubtract);
      numbers.push(nextNumber);
      operators.push('-');
      currentTotal -= nextNumber;
      usedSubtract = true;
      continue;
    }

    const nextNumber = getRandomTerm(random, stage, digitType);
    numbers.push(nextNumber);
    operators.push('+');
    currentTotal += nextNumber;
  }

  return { numbers, operators };
}

export function generateTrainingProblems({ stage, problemCount, numberCount, digitType, operationMode, seed }: GenerateTrainingProblemsInput): TrainingProblem[] {
  const random = createRandom(seed);

  return Array.from({ length: problemCount }, (_, index) => {
    const { numbers, operators } = buildTerms(random, stage, numberCount, digitType, operationMode);
    const answer = calculateAnswer(numbers, operators);
    const expressionText = formatExpression(numbers, operators);

    return {
      id: `generated-${stage.id}-${Date.now()}-${index + 1}`,
      index,
      numbers,
      operators,
      correctAnswer: answer,
      displayText: expressionText,
      status: 'ready',
      expressionText,
      answer,
      level: stage.level,
      stageId: stage.id,
    };
  });
}
